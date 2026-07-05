import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API 路由
  app.post("/api/chat", async (req, res) => {
    const { system_prompt, messages, settings } = req.body;
    
    try {
      const apiKey = settings?.userApiKey || settings?.apiKey || process.env.GEMINI_API_KEY;
      let baseUrl = settings?.baseUrl;
      
      if (baseUrl) {
        baseUrl = baseUrl.replace(/\/+$/, '');
        // OpenAI compatibility check
        const isOpenAI = baseUrl.endsWith('/v1');
        
        if (isOpenAI) {
          const url = `${baseUrl}/chat/completions`;
          const openaiMessages = [
            { role: 'system', content: system_prompt },
            ...messages.map((m: any) => ({
              role: m.role === 'model' ? 'assistant' : m.role,
              content: m.parts?.[0]?.text || m.content || ''
            }))
          ];

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: settings.modelName || settings.model || 'gpt-3.5-turbo',
              messages: openaiMessages,
              temperature: settings.temperature || 0.7,
              max_tokens: settings.maxTokens || 2000
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
          }

          const data: any = await response.json();
          return res.json({ text: data.choices?.[0]?.message?.content || '' });
        }

        // Native Gemini with custom baseUrl
        const v1Match = baseUrl.match(/^(.*?)\/v1(\/|$)/);
        if (v1Match) baseUrl = v1Match[1];
      }

      const client = new GoogleGenAI({ 
        apiKey: apiKey || '',
        ...(baseUrl ? { baseUrl } : {})
      });

      const safetySettings = [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
      ];

      const response = await client.models.generateContent({
        model: settings.modelName || "gemini-1.5-flash",
        contents: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: m.parts
        })),
        config: {
          systemInstruction: system_prompt,
          temperature: settings.temperature || 0.7,
          maxOutputTokens: settings.maxTokens || 2000,
          safetySettings
        }
      } as any);

      res.json({ text: response.text });

    } catch (error: any) {
      console.error("Server AI error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString()
    });
  });

  app.post("/api/models", async (req, res) => {
    const { baseUrl, apiKey } = req.body;
    try {
      const url = baseUrl || 'https://generativelanguage.googleapis.com';
      const cleanUrl = url.replace(/\/+$/, '');
      
      const endpoints = [
        { 
          endpoint: `${cleanUrl}/models`, 
          headers: { 'Authorization': `Bearer ${apiKey}` },
          desc: 'OpenAI 兼容接口'
        },
        { 
          endpoint: `${cleanUrl.replace(/\/v1$/, '')}/v1/models`, 
          headers: { 'Authorization': `Bearer ${apiKey}` },
          desc: 'OpenAI V1 补全接口'
        },
        { 
          endpoint: `${cleanUrl}/v1beta/models?key=${apiKey}`, 
          headers: {},
          desc: 'Gemini 原生接口'
        }
      ];

      let lastError = null;
      for (const { endpoint, headers } of endpoints) {
        try {
          const fetchRes = await fetch(endpoint, { headers });
          if (fetchRes.ok) {
            const data = await fetchRes.json();
            return res.json(data);
          }
        } catch (err) {
          lastError = err;
        }
      }
      res.status(500).json({ error: lastError?.message || "Failed to fetch models from all endpoints" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId, model, settings } = req.body;
    try {
      const apiKey = settings.minimaxApiKey;
      const groupId = settings.minimaxGroupId;
      const region = settings.minimaxRegion || 'china';
      const baseUrl = region === 'international' ? 'https://api.minimaxi.com/v1' : 'https://api.minimax.chat/v1';
      
      const response = await fetch(`${baseUrl}/text_to_speech/v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || settings.minimaxModel || 'speech-01-turbo',
          text: text,
          stream: false,
          voice_setting: {
            voice_id: voiceId || settings.minimaxVoiceId || 'male-qn-qingse',
            speed: 1.0,
            vol: 1.0,
            pitch: 0
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || err.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.data?.audio) {
        res.json({ audio: data.data.audio });
      } else {
        res.status(500).json({ error: "No audio data returned" });
      }
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite 中间件
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
