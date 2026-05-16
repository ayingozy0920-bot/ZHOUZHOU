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
              response_format: req.config?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
              safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
              ],
              safety_settings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
              ],
              gemini_safety_settings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
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

    // Native Gemini: stripping any leftover /v1 or trailing slashes
    baseUrl = baseUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  }

  const client = new GoogleGenAI({
    apiKey: apiKey || '',
    ...(baseUrl && baseUrl.trim() !== '' ? { baseUrl: baseUrl.trim() } : {})
  });

  const injectSafetySettings = (req: any) => {
    if (!req.config) req.config = {};
    if (!req.config.safetySettings) {
      req.config.safetySettings = [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
      ];
    }
    return req;
  };

  const originalGenerateContent = client.models.generateContent.bind(client.models);
  const originalGenerateContentStream = client.models.generateContentStream.bind(client.models);

  return {
    ...client,
    models: {
      ...client.models,
      generateContent: async (req: any) => originalGenerateContent(injectSafetySettings(req)),
      generateContentStream: async (req: any) => originalGenerateContentStream(injectSafetySettings(req))
    }
  } as any;
};

export const getGeminiModel = (settings?: AppSettings) => {
  return settings?.modelName || "gemini-2.0-flash";
};
