import { GoogleGenAI } from "@google/genai";
import { AppSettings } from "../types";

export const getGeminiClient = (settings?: AppSettings) => {
  const apiKey = settings?.userApiKey || settings?.apiKey || process.env.GEMINI_API_KEY;
  let baseUrl = settings?.baseUrl;
  
  if (baseUrl) {
    // If the base URL ends with /v1, it strongly indicates an OpenAI-compatible endpoint.
    const isOpenAI = baseUrl.endsWith('/v1') || baseUrl.endsWith('/v1/');
    
    if (isOpenAI) {
      return {
        apiKey: apiKey, // Provide apiKey for compatibility checks
        models: {
          generateContent: async (req: any) => {
            const url = baseUrl!.replace(/\/+$/, '') + '/chat/completions';
            const messages = [];
            
            // Handle system instruction explicitly
            if (req.config?.systemInstruction) {
              let sysText = '';
              if (typeof req.config.systemInstruction === 'string') {
                  sysText = req.config.systemInstruction;
              } else if (req.config.systemInstruction.parts?.[0]?.text) {
                  sysText = req.config.systemInstruction.parts[0].text;
              }
              if (sysText) {
                  messages.push({ role: 'system', content: sysText });
              }
            }

            if (Array.isArray(req.contents)) {
              for (const c of req.contents) {
                const role = c.role === 'model' ? 'assistant' : (c.role || 'user');
                let content = '';
                if (c.parts && c.parts[0]) {
                  content = typeof c.parts[0] === 'string' ? c.parts[0] : c.parts[0].text;
                } else if (typeof c === 'string') {
                  content = c;
                }
                messages.push({ role, content });
              }
            } else if (typeof req.contents === 'string') {
              messages.push({ role: 'user', content: req.contents });
            }

            const bodyPayload: any = {
              model: req.model,
              messages,
              temperature: req.config?.temperature || undefined,
              safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ],
              safety_settings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ],
              gemini_safety_settings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ]
            };

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(bodyPayload)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              let parsed;
              try { parsed = JSON.parse(errorText); } catch(e) {}
              throw new Error(`[OpenAI Proxy Error] HTTP ${response.status}: ${parsed?.error?.message || errorText}`);
            }
            
            const data = await response.json();
            return {
              text: data.choices?.[0]?.message?.content || ""
            };
          }
        }
      } as any;
    }

    // Native Gemini: improved cleaning to avoid duplicate version paths
    // If the URL contains /v1 or /v1beta, we should treat the part before it as the base
    const v1Match = baseUrl.match(/^(.*?)\/v1(\/|$)/);
    const v1betaMatch = baseUrl.match(/^(.*?)\/v1beta(\/|$)/);
    
    if (v1Match) {
      baseUrl = v1Match[1];
    } else if (v1betaMatch) {
      baseUrl = v1betaMatch[1];
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
  }

  const client = new GoogleGenAI({
    apiKey: apiKey || '',
    ...(baseUrl && baseUrl.trim() !== '' ? { baseUrl: baseUrl.trim() } : {})
  });

  const injectSafetySettings = (req: any) => {
    const safetySettings = [
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
    ];
    
    // Some versions of the SDK/proxies expect it at the top level
    if (!req.safetySettings) req.safetySettings = safetySettings;
    
    // Others expect it inside config
    if (!req.config) req.config = {};
    if (!req.config.safetySettings) {
      req.config.safetySettings = safetySettings;
    }
    
    return req;
  };

  const originalGenerateContent = client.models.generateContent.bind(client.models);
  const originalGenerateContentStream = client.models.generateContentStream.bind(client.models);

  const fallbackModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  return {
    ...client,
    models: {
      ...client.models,
      generateContent: async (req: any) => {
        const injected = injectSafetySettings(req);
        const originalModel = injected.model;
        const modelsToTry = Array.from(new Set([originalModel, ...fallbackModels])).filter(Boolean);
        
        let lastErr: any = null;
        for (const m of modelsToTry) {
          try {
            return await originalGenerateContent({ ...injected, model: m });
          } catch (e: any) {
            lastErr = e;
            const msg = e?.message || '';
            if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found')) {
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      },
      generateContentStream: async (req: any) => {
        const injected = injectSafetySettings(req);
        const originalModel = injected.model;
        const modelsToTry = Array.from(new Set([originalModel, ...fallbackModels])).filter(Boolean);
        
        let lastErr: any = null;
        for (const m of modelsToTry) {
          try {
            return await originalGenerateContentStream({ ...injected, model: m });
          } catch (e: any) {
            lastErr = e;
            const msg = e?.message || '';
            if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found')) {
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      }
    }
  } as any;
};

export const getGeminiModel = (settings?: AppSettings) => {
  return settings?.modelName || "gemini-1.5-flash";
};
