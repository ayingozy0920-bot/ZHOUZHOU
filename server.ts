import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Log {
  type: string;
  status: number | 'error';
  url: string;
  timestamp: string;
  error?: string;
  model?: string;
}

const apiLogs: Log[] = [];

function logToFile(message: string) {
  try {
    const time = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), "debug.log"), `[${time}] ${message}\n`);
  } catch (e) {
    console.error("Failed to write log to file:", e);
  }
}

function addApiLog(type: string, status: number | 'error', url: string, error?: string, model?: string) {
  apiLogs.unshift({
    type,
    status,
    url,
    timestamp: new Date().toISOString(),
    error,
    model
  });
  if (apiLogs.length > 50) {
    apiLogs.pop();
  }
  logToFile(`API Log - Type: ${type}, Status: ${status}, URL: ${url}, Error: ${error || 'None'}`);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 允许所有跨域请求
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API 路由
  app.post("/api/chat", async (req, res) => {
    const { system_prompt, messages, settings } = req.body;
    
    try {
      let baseUrl = settings?.baseUrl;
      const apiKey = (baseUrl ? (settings?.apiKey || settings?.userApiKey) : (settings?.userApiKey || settings?.apiKey)) || process.env.GEMINI_API_KEY;
      
      if (baseUrl) {
        baseUrl = baseUrl.replace(/\/+$/, '');
        // 只要提供了 baseUrl，就优先尝试 OpenAI 兼容路径
        const isOpenAI = true;
        
        if (isOpenAI) {
          let url = baseUrl;
          if (!url.includes('/chat/completions')) {
            if (url.endsWith('/v1')) {
              url = `${url}/chat/completions`;
            } else {
              url = `${url}/v1/chat/completions`;
            }
          }
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

      // Initialize with @google/generative-ai
      const genAI = new GoogleGenerativeAI(apiKey || '');
      
      const safetySettings = [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
      ];

      const modelName = settings.modelName || settings.model || "gemini-1.5-flash";
      const genModel = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: system_prompt,
        safetySettings: safetySettings as any,
        generationConfig: {
          temperature: settings.temperature || 0.8,
          maxOutputTokens: settings.maxTokens || 2048,
          topP: 0.95,
          topK: 40
        }
      });

      const response = await genModel.generateContent({
        contents: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.parts?.[0]?.text || m.content || '' }]
        }))
      });

      const result = await response.response;
      const text = result.text();
      res.json({ text });

    } catch (error: any) {
      console.error("Server AI error:", error);
      // Log safety block details if available
      if (error.response?.promptFeedback) {
        logToFile(`Prompt blocked: ${JSON.stringify(error.response.promptFeedback)}`);
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString()
    });
  });

  app.get("/api/logs", (req, res) => {
    res.json(apiLogs);
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

  app.post("/api/image-models", async (req, res) => {
    const { baseUrl, apiKey } = req.body;
    try {
      const url = baseUrl || 'https://api.openai.com/v1';
      const cleanUrl = url.replace(/\/+$/, '');
      const response = await fetch(`${cleanUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  function extractAudioFromResponseServer(textResponse: string): string {
    try {
      const data = JSON.parse(textResponse);
      if (data.data?.audio) {
        return data.data.audio;
      }
      if (data.audio) {
        return data.audio;
      }
    } catch (e) {}

    const base64Chunks: string[] = [];
    const lines = textResponse.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let jsonStr = trimmed;
      if (trimmed.startsWith('data:')) {
        jsonStr = trimmed.substring(5).trim();
      }

      if (jsonStr === '[DONE]' || !jsonStr) continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const audioChunk = parsed.data?.audio || parsed.audio || parsed.data?.data?.audio;
        if (audioChunk) {
          base64Chunks.push(audioChunk);
        }
      } catch (e) {}
    }

    if (base64Chunks.length === 0) {
      throw new Error("No audio data found in TTS response");
    }

    if (base64Chunks.length === 1) {
      return base64Chunks[0];
    }

    // Concatenate multiple base64 chunks safely in Node.js
    const buffers = base64Chunks.map(chunk => Buffer.from(chunk, 'base64'));
    const finalBuffer = Buffer.concat(buffers);
    return finalBuffer.toString('base64');
  }

  app.post("/api/proxy", async (req, res) => {
    const { url, headers, body, method = 'POST' } = req.body;
    if (!url) return res.status(400).json({ error: "Missing target url" });
    
    try {
      const response = await fetch(url, {
        method,
        headers: headers || {},
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
      });
      
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(response.status);
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId, model, settings } = req.body;
    console.log(`[TTS Backend] Received request. Text: "${text?.substring(0, 50)}...", VoiceId: ${voiceId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[TTS Backend] Request timed out after 90 seconds. Aborting fetch to MiniMax.`);
      controller.abort();
    }, 90000);

    const region = settings.minimaxRegion || 'china';
    let baseUrl = settings.minimaxApiUrl || (region === 'international' ? 'https://api.minimaxi.com/v1' : 'https://api.minimax.chat/v1');
    baseUrl = baseUrl.replace(/\/+$/, '');

    try {
      const apiKey = settings.minimaxApiKey;
      const groupId = settings.minimaxGroupId;
      
      let url = `${baseUrl}/t2a_v2`;
      if (groupId) {
        url += `?GroupId=${groupId}`;
      }

      console.log(`[TTS Backend] Sending fetch to MiniMax URL: ${url} (Region: ${region})`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
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

      clearTimeout(timeoutId);
      console.log(`[TTS Backend] MiniMax response received. Status: ${response.status}`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[TTS Backend] MiniMax API returned error: ${response.status}. Body:`, errText);
        let errMsg = `HTTP ${response.status}`;
        try {
          const err = JSON.parse(errText);
          errMsg = err.error?.message || err.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const textResponse = await response.text();
      console.log(`[TTS Backend] Raw response length: ${textResponse.length}`);
      console.log(`[TTS Backend] Raw response preview (first 500 chars):\n${textResponse.substring(0, 500)}`);
      logToFile(`[TTS Response] length: ${textResponse.length}, preview: ${textResponse.substring(0, 500)}`);
      
      const audioBase64 = extractAudioFromResponseServer(textResponse);
      console.log(`[TTS Backend] Audio extracted. Base64/Hex length: ${audioBase64?.length || 0}`);
      
      let finalAudioBase64 = audioBase64;
      if (audioBase64 && /^[0-9a-fA-F]+$/.test(audioBase64) && audioBase64.length > 100) {
        console.log(`[TTS Backend] Detected Hex encoding for audio, converting to Base64...`);
        finalAudioBase64 = Buffer.from(audioBase64, 'hex').toString('base64');
      }

      if (finalAudioBase64) {
        console.log(`[TTS Backend] Extracted base64 preview (first 100 chars): ${finalAudioBase64.substring(0, 100)}`);
        console.log(`[TTS Backend] Extracted base64 preview (last 100 chars): ${finalAudioBase64.substring(finalAudioBase64.length - 100)}`);
        logToFile(`[TTS Extracted] length: ${finalAudioBase64.length}, head: ${finalAudioBase64.substring(0, 100)}`);
      }
      
      addApiLog('models', 200, url, undefined, model || settings.minimaxModel || 'speech-01-turbo');
      res.json({ audio: finalAudioBase64 });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("[TTS Backend] Error occurred during TTS synthesis:", error);
      const errorMsg = error.name === 'AbortError' ? '连接语音服务器超时，请检查服务区域或代理设置。' : error.message;
      logToFile(`[TTS Error] name: ${error.name}, message: ${error.message}`);
      addApiLog('models', 'error', `${baseUrl}/t2a_v2`, errorMsg, model || settings.minimaxModel || 'speech-01-turbo');
      res.status(500).json({ error: errorMsg });
    }
  });

  app.post("/api/image-gen", async (req, res) => {
    const { prompt, negative_prompt, ratio, settings } = req.body;
    try {
      const apiKey = settings.imageGenApiKey || process.env.OPENAI_API_KEY;
      const baseUrl = settings.imageGenBaseUrl || 'https://api.openai.com/v1';
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      
      const posPrompt = settings.imageGenPositivePrompt || '';
      const fullPrompt = posPrompt ? `${posPrompt}, ${prompt}` : prompt;
      
      const targetModel = settings.imageGenModel || 'gpt-image-2';

      // Map ratio to OpenAI sizes if needed
      let size = ratio || settings.imageGenSize || '1024x1024';
      if (size === '1:1') size = '1024x1024';
      if (size === '9:16') size = '1024x1792';
      if (size === '16:9') size = '1792x1024';

      let targetUrl = cleanUrl;
      if (!targetUrl.includes('/images/generations')) {
        if (targetUrl.endsWith('/v1')) {
          targetUrl = `${targetUrl}/images/generations`;
        } else {
          targetUrl = targetUrl.replace(/\/+$/, '') + '/v1/images/generations';
        }
      }
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          prompt: fullPrompt,
          n: 1,
          size: size,
          quality: settings.imageGenQuality || 'standard',
          ...(negative_prompt || settings.imageGenNegativePrompt ? { negative_prompt: negative_prompt || settings.imageGenNegativePrompt } : {})
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || err.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      let imageUrl = data.data?.[0]?.url;
      
      if (imageUrl) {
        // Return a proxied URL to avoid CORS and expiring URL issues
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        res.json({ url: proxiedUrl, originalUrl: imageUrl });
      } else if (data.data?.[0]?.b64_json) {
        res.json({ b64: data.data[0].b64_json });
      } else {
        res.status(500).json({ error: "No image data returned from provider" });
      }
    } catch (error: any) {
      console.error("Image Gen error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("No URL provided");

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      
      // Set headers to allow downloading
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Image proxy error:", error);
      res.status(500).send("Error proxying image");
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
