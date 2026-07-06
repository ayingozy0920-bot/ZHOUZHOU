import { AppSettings } from '../types';

interface ApiRequest {
  endpoint: '/api/chat' | '/api/models' | '/api/image-models' | '/api/image-gen' | '/api/tts';
  body: any;
}

export async function apiFetch(req: ApiRequest): Promise<any> {
  // 1. Attempt to fetch from local Node.js proxy first (if available)
  try {
    const response = await fetch(req.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // If response is not ok but is JSON, throw the error JSON so the caller handles it
    if (!response.ok && contentType.includes('application/json')) {
      const errJson = await response.json();
      throw new Error(errJson.error || errJson.message || `HTTP ${response.status}`);
    }

    // If it's a 404 or non-JSON content, it means the server is not running (e.g. Cloudflare Pages static hosting)
    // We fall back to client-side direct request
    console.warn(`Local endpoint ${req.endpoint} returned non-JSON/404. Falling back to direct client-side fetch...`);
  } catch (error: any) {
    // If it's an error like "Failed to fetch" (network error) or custom JSON error, let's see.
    // If it was a custom error thrown from JSON above, don't fall back (since the backend actually replied with an error).
    if (error.message && !error.message.startsWith('HTTP') && !error.message.includes('status:')) {
      console.warn(`Local fetch to ${req.endpoint} failed. Falling back to direct client-side fetch...`, error);
    } else {
      throw error; // Rethrow real backend errors
    }
  }

  // 2. Client-side direct fetch fallback
  return await handleDirectFetch(req.endpoint, req.body);
}

async function handleDirectFetch(endpoint: string, body: any): Promise<any> {
  if (endpoint === '/api/chat') {
    const { system_prompt, messages, settings } = body;
    const apiKey = settings?.userApiKey || settings?.apiKey;
    if (!apiKey) throw new Error('API Key is missing');

    let baseUrl = settings?.baseUrl || 'https://generativelanguage.googleapis.com';
    baseUrl = baseUrl.replace(/\/+$/, '');

    // OpenAI compatibility check
    const isOpenAI = baseUrl.endsWith('/v1');
    if (isOpenAI) {
      const url = `${baseUrl}/chat/completions`;
      const openaiMessages = [
        { role: 'system', content: system_prompt },
        ...messages.map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
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
        throw new Error(errText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { text: data.choices?.[0]?.message?.content || '' };
    }

    // Native Gemini via REST API directly from browser
    const model = settings.modelName || 'gemini-1.5-flash';
    const cleanBaseUrl = baseUrl.replace(/\/v1beta$/, '').replace(/\/v1$/, '');
    const url = `${cleanBaseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: m.parts || [{ text: m.content || '' }]
    }));

    const safetySettings = [
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: system_prompt }]
        },
        generationConfig: {
          temperature: settings.temperature || 0.7,
          maxOutputTokens: settings.maxTokens || 2000
        },
        safetySettings
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text: generatedText };
  }

  if (endpoint === '/api/models') {
    const { baseUrl, apiKey } = body;
    const url = baseUrl || 'https://generativelanguage.googleapis.com';
    const cleanUrl = url.replace(/\/+$/, '');

    const endpoints = [
      { 
        endpoint: `${cleanUrl}/models`, 
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      { 
        endpoint: `${cleanUrl.replace(/\/v1$/, '')}/v1/models`, 
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      { 
        endpoint: `${cleanUrl}/v1beta/models?key=${apiKey}`, 
        headers: {}
      }
    ];

    let lastError = null;
    for (const ep of endpoints) {
      try {
        const fetchRes = await fetch(ep.endpoint, { headers: ep.headers });
        if (fetchRes.ok) {
          return await fetchRes.json();
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("Failed to fetch models from all endpoints");
  }

  if (endpoint === '/api/image-models') {
    const { baseUrl, apiKey } = body;
    const url = baseUrl || 'https://api.openai.com/v1';
    const cleanUrl = url.replace(/\/+$/, '');
    const response = await fetch(`${cleanUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  }

  if (endpoint === '/api/image-gen') {
    const { prompt, settings } = body;
    const apiKey = settings.imageGenApiKey;
    const baseUrl = settings.imageGenBaseUrl || 'https://api.openai.com/v1';
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    
    const fullPrompt = `${settings.imageGenPositivePrompt || ''}, ${prompt}`;
    
    const response = await fetch(`${cleanUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.imageGenModel || 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: settings.imageGenSize || '1024x1024',
        quality: settings.imageGenQuality || 'standard',
        ...(settings.imageGenNegativePrompt ? { negative_prompt: settings.imageGenNegativePrompt } : {})
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || err.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.data?.[0]?.url) {
      return { url: data.data[0].url };
    } else if (data.data?.[0]?.b64_json) {
      return { b64: data.data[0].b64_json };
    } else {
      throw new Error("No image data returned from provider");
    }
  }

  if (endpoint === '/api/tts') {
    const { text, voiceId, model, settings } = body;
    const apiKey = settings.minimaxApiKey;
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
      return { audio: data.data.audio };
    } else {
      throw new Error("No audio data returned");
    }
  }

  throw new Error(`Unknown endpoint: ${endpoint}`);
}
