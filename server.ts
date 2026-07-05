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
