import { AppSettings } from "../types";
import { apiFetch } from "./apiHelper";

export const getGeminiClient = (settings?: AppSettings) => {
  return {
    models: {
      generateContent: async (req: any) => {
        let system_prompt = "";
        if (req.config?.systemInstruction) {
          if (typeof req.config.systemInstruction === 'string') {
            system_prompt = req.config.systemInstruction;
          } else if (req.config.systemInstruction.parts?.[0]?.text) {
            system_prompt = req.config.systemInstruction.parts[0].text;
          }
        }

        let messages: any[] = [];
        if (Array.isArray(req.contents)) {
          messages = req.contents.map((c: any) => ({
            role: c.role === 'model' ? 'assistant' : (c.role || 'user'),
            content: typeof c === 'string' ? c : (c.parts?.[0]?.text || c.content || '')
          }));
        } else if (typeof req.contents === 'string') {
          messages = [{ role: 'user', content: req.contents }];
        } else if (req.contents?.parts) {
          messages = [{ role: 'user', content: req.contents.parts[0]?.text || '' }];
        } else if (req.contents && typeof req.contents === 'object') {
          messages = [{ role: 'user', content: JSON.stringify(req.contents) }];
        }

        const res = await apiFetch({
          endpoint: '/api/chat',
          body: {
            system_prompt,
            messages,
            settings: {
              ...(settings || {}),
              modelName: req.model || settings?.modelName || (settings as any)?.model
            }
          }
        });

        const text = res.text || '';
        return {
          text,
          response: {
            text: () => text
          },
          candidates: [
            {
              content: {
                parts: [{ text }]
              }
            }
          ]
        };
      },
      generateContentStream: async (req: any) => {
        const result = await getGeminiClient(settings).models.generateContent(req);
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { text: () => result.text };
          }
        };
      }
    }
  };
};

export const getGeminiModel = (settings?: AppSettings) => {
  return settings?.modelName || (settings as any)?.model || "gemini-2.5-flash";
};
