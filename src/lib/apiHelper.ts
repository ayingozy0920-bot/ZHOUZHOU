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
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }
      if (response.ok) {
        return data;
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } else {
      const text = await response.text();
      if (response.ok) {
        return { text };
      } else {
        throw new Error(text || `API error: ${response.status}`);
      }
    }
  } catch (error: any) {
    if (error.message && (error.message.includes('PROHIBITED_CONTENT') || error.message.includes('safety') || error.message.includes('blocked') || error.message.includes('API key') || error.message.includes('429') || error.message.includes('quota'))) {
      throw error;
    }
    console.warn(`Local fetch to ${req.endpoint} failed. Falling back to direct client-side fetch...`, error);
  }

  // 2. Client-side direct fetch fallback
  return await handleDirectFetch(req.endpoint, req.body);
}

function extractAudioFromResponseClient(textResponse: string): string {
  let audioStr = "";
  try {
    const data = JSON.parse(textResponse);
    if (data.data?.audio) {
      audioStr = data.data.audio;
    } else if (data.audio) {
      audioStr = data.audio;
    }
  } catch (e) {}

  if (audioStr) {
    if (/^[0-9a-fA-F]+$/.test(audioStr) && audioStr.length > 100) {
      // Hex to base64
      let binary = '';
      for (let i = 0; i < audioStr.length; i += 2) {
        binary += String.fromCharCode(parseInt(audioStr.substr(i, 2), 16));
      }
      return btoa(binary);
    }
    return audioStr;
  }

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

  // Decode each base64 string to a binary array
  const binaryChunks = base64Chunks.map(chunk => {
    const binaryStr = atob(chunk);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  });

  // Concatenate binary chunks
  const totalLength = binaryChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const finalBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of binaryChunks) {
    finalBytes.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert final binary to base64
  let binaryStr = '';
  const len = finalBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(finalBytes[i]);
  }
  return btoa(binaryStr);
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
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_UNSPECIFIED", threshold: "BLOCK_NONE" }
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
    
    const posPrompt = settings.imageGenPositivePrompt || '';
    const fullPrompt = posPrompt ? `${posPrompt}, ${prompt}` : prompt;
    
    const targetModel = settings.imageGenModel || 'gpt-image-2';

    // Map ratio to OpenAI sizes if needed
    let size = settings.imageGenSize || '1024x1024';
    if (size === '1:1') size = '1024x1024';
    if (size === '9:16') size = '1024x1792';
    if (size === '16:9') size = '1792x1024';
    if (size === '3:4') size = '768x1024';
    if (size === '4:3') size = '1024x768';

    // Detect model type for specialized compatibility mapping
    const isDalle3 = targetModel.toLowerCase().includes('dall-e-3');
    const isDalle2 = targetModel.toLowerCase().includes('dall-e-2');
    const isDalle = isDalle3 || isDalle2;
    
    let finalPrompt = fullPrompt;
    let finalSize = size;
    
    if (!isDalle) {
      const ratio = settings.imageGenSize;
      const isSize916 = ratio === '9:16' || ratio === '1024x1792';
      const isSize169 = ratio === '16:9' || ratio === '1792x1024';
      const isSize34  = ratio === '3:4'  || ratio === '768x1024';
      const isSize43  = ratio === '4:3'  || ratio === '1024x768';

      if (isSize916) {
        if (!finalPrompt.includes('--ar')) finalPrompt += ' --ar 9:16';
        finalSize = '1024x1024';
      } else if (isSize169) {
        if (!finalPrompt.includes('--ar')) finalPrompt += ' --ar 16:9';
        finalSize = '1024x1024';
      } else if (isSize34) {
        if (!finalPrompt.includes('--ar')) finalPrompt += ' --ar 3:4';
        finalSize = '1024x1024';
      } else if (isSize43) {
        if (!finalPrompt.includes('--ar')) finalPrompt += ' --ar 4:3';
        finalSize = '1024x1024';
      } else {
        finalSize = '1024x1024';
      }
    } else if (isDalle2) {
      finalSize = '1024x1024';
    }

    // Build compatible request body
    const requestBody: any = {
      model: targetModel,
      prompt: finalPrompt,
      n: 1,
      size: finalSize
    };

    // Only include 'quality' parameter for DALL-E 3 models
    if (isDalle3) {
      requestBody.quality = settings.imageGenQuality || 'standard';
    }

    // Only include 'negative_prompt' if it's set and model is not standard DALL-E
    const negPromptVal = settings.imageGenNegativePrompt;
    if (negPromptVal && !isDalle) {
      requestBody.negative_prompt = negPromptVal;
    }

    const response = await fetch(`${cleanUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || err.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      const errMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
      throw new Error(errMsg);
    }
    if (data.success === false || data.status === 'fail' || data.status === 'error') {
      const errMsg = data.message || data.msg || data.error?.message || 'Gateway reported an error';
      throw new Error(errMsg);
    }
    if (data.code !== undefined && data.code !== 0 && data.code !== 200 && data.code === 'fail') {
      const errMsg = data.msg || data.message || `Gateway returned error code ${data.code}`;
      throw new Error(errMsg);
    }

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
    const groupId = settings.minimaxGroupId;
    const region = settings.minimaxRegion || 'china';
    let baseUrl = settings.minimaxApiUrl || (region === 'international' ? 'https://api.minimaxi.com/v1' : 'https://api.minimax.chat/v1');
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    let url = `${baseUrl}/t2a_v2`;
    if (groupId) {
      url += `?GroupId=${groupId}`;
    }

    const requestBody = {
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
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `HTTP ${response.status}`;
      try {
        const err = JSON.parse(errText);
        errMsg = err.error?.message || err.message || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const textResponse = await response.text();
    const audioBase64 = extractAudioFromResponseClient(textResponse);
    return { audio: audioBase64 };
  }

  throw new Error(`Unknown endpoint: ${endpoint}`);
}
