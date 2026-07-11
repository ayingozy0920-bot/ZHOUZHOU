import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const PORT = Number(process.env.DEFAULT_APP_PORT || process.env.PORT || 3000);

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
        try {
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
                max_tokens: settings.maxTokens || 1000
              })
            });

            if (!response.ok) {
              const errText = await response.text();
              console.error(`[Proxy Error] Proxy failed with ${response.status}: ${errText}`);
              return res.status(response.status).json({ error: errText || `Proxy error ${response.status}` });
            } else {
              const data: any = await response.json();
              return res.json({ text: data.choices?.[0]?.message?.content || '' });
            }
          }
        } catch (proxyErr: any) {
          console.error(`[Proxy Exception]`, proxyErr);
          return res.status(500).json({ error: proxyErr.message || 'Proxy request failed' });
        }
      }

      // Initialize with @google/generative-ai
      const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || '');
      
      const safetySettings = [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_UNSPECIFIED", threshold: "BLOCK_NONE" }
      ];

      const requestedModel = settings.modelName || settings.model || "gemini-2.0-flash";
      const fallbackModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
      const modelsToTry = Array.from(new Set([requestedModel, ...fallbackModels]));

      let response: any = null;
      let lastError: any = null;

      for (const m of modelsToTry) {
        try {
          const genModel = genAI.getGenerativeModel({ 
            model: m,
            systemInstruction: system_prompt,
            safetySettings: safetySettings as any,
            generationConfig: {
              temperature: settings.temperature || 0.8,
              maxOutputTokens: settings.maxTokens || 1024,
              topP: 0.95,
              topK: 40
            }
          });

          response = await genModel.generateContent({
            contents: messages.map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.parts?.[0]?.text || msg.content || '' }]
            }))
          });
          break;
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || '';
          if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found') || msg.includes('PROHIBITED_CONTENT') || msg.includes('prompt_blocked')) {
            continue;
          }
          throw err;
        }
      }

      if (!response && lastError) {
        if (system_prompt && system_prompt.includes("JSON")) {
          const fallbackText = JSON.stringify([
            { time: "08:00", task: "晨起签到与健康早餐" },
            { time: "10:00", task: "核心工作与任务推进" },
            { time: "12:30", task: "午餐时间与放松休憩" },
            { time: "15:00", task: "下午工作与协作交流" },
            { time: "18:30", task: "晚餐与休闲时间" },
            { time: "21:00", task: "夜间阅读与复盘总结" }
          ]);
          return res.json({ text: fallbackText });
        }
        throw lastError;
      }

      let text = '';
      try {
        const result = await response.response;
        text = result.text();
      } catch (e: any) {
        console.warn("AI generation text error / safety block:", e);
        if (system_prompt && system_prompt.includes("JSON")) {
          text = JSON.stringify([
            { time: "08:00", task: "晨起签到与健康早餐" },
            { time: "10:00", task: "核心工作与任务推进" },
            { time: "12:30", task: "午餐时间与放松休憩" },
            { time: "15:00", task: "下午工作与协作交流" },
            { time: "18:30", task: "晚餐与休闲时间" },
            { time: "21:00", task: "夜间阅读与复盘总结" }
          ]);
        } else {
          text = "抱歉，刚才的内容触发了安全审核或暂时无法生成，请稍后再试或调整内容。";
        }
      }
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

  app.post("/api/spot-check-scan", (req, res) => {
    try {
      const { friendId, friends, chats, spotCheckLimit = 15 } = req.body;
      const limit = Number(spotCheckLimit) > 0 ? Number(spotCheckLimit) : 15;

      const otherFriends = (friends || []).filter((f: any) => f.id !== friendId);
      const items = otherFriends.map((f: any) => {
        const friendMsgs = (chats || {})[f.id] || [];
        const recentMsgs = friendMsgs.slice(-limit);
        const transcript = recentMsgs.map((m: any) => {
          const sender = m.role === 'user' ? '用户' : (f.alias || f.name);
          const content = m.content || m.parts?.[0]?.text || '';
          return `${sender}: ${content}`;
        }).join(' | ');

        const previewText = transcript || f.lastMessage || '最近聊得很开心...';
        
        return {
          friendId: f.id,
          friendName: f.alias || f.name,
          friendAvatar: f.avatar,
          previewText,
          transcript,
          messageCount: recentMsgs.length
        };
      }).filter((item: any) => item.previewText);

      // Ensure at least 3 rich items for a comprehensive scan experience if few friends exist
      const mockPool = [
        { friendId: 'mock1', friendName: '学姐', friendAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', previewText: '周末要不要一起去图书馆自习呀？留个位置给你~', transcript: '用户: 在干嘛呢？ | 学姐: 周末要不要一起去图书馆自习呀？留个位置给你~' },
        { friendId: 'mock2', friendName: '阿杰', friendAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80', previewText: '昨晚跟你说的那个聚会你到底去不去啊，大家都在等呢', transcript: '阿杰: 昨晚跟你说的那个聚会你到底去不去啊，大家都在等呢 | 用户: 看看情况吧' },
        { friendId: 'mock3', friendName: '小美', friendAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', previewText: '收到啦，谢谢你的奶茶！下次请你喝咖啡哦~', transcript: '用户: 奶茶好喝吗 | 小美: 收到啦，谢谢你的奶茶！下次请你喝咖啡哦~' }
      ];

      let finalItems = [...items];
      for (const m of mockPool) {
        if (finalItems.length < 4 && !finalItems.some(i => i.friendName === m.friendName)) {
          finalItems.push(m);
        }
      }

      const summaryText = finalItems.map((item: any) => `[好友：${item.friendName}] (已读取最近 ${item.messageCount || limit} 条对话记录):\n${item.transcript || item.previewText}`).join('\n\n');

      res.json({
        items: finalItems,
        summaryText,
        limitUsed: limit
      });
    } catch (e: any) {
      console.error("Spot check scan API error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/huabei", (req, res) => {
    const { amount } = req.body;
    let total = parseFloat(amount);
    if (isNaN(total) || total <= 0) {
      total = parseFloat((Math.random() * 800 + 200).toFixed(2));
    }

    const categoryPools = [
      {
        name: "美食餐饮",
        pool: [
          { title: "奈雪的茶：多肉葡萄与欧包套餐" },
          { title: "美团外卖：深夜海底捞小龙虾外卖" },
          { title: "星巴克咖啡与下午茶组合" },
          { title: "大众点评：周末双人日料大餐" },
          { title: "喜茶：芝士芒芒与轻芒芒" }
        ]
      },
      {
        name: "日常购物",
        pool: [
          { title: "淘宝：购买了一套海蓝之谜化妆品" },
          { title: "淘宝：入手Dyson吹风机配件" },
          { title: "优衣库：夏季新款短袖T恤与休闲裤" },
          { title: "名创优品：创意盲盒与日用小物" },
          { title: "屈臣氏：个人护理与美妆护肤品" }
        ]
      },
      {
        name: "休闲娱乐",
        pool: [
          { title: "猫眼电影：IMAX双人观影及爆米花" },
          { title: "沉浸式剧本杀与密室逃脱" },
          { title: "KTV欢唱与果盘小吃" },
          { title: "周末温泉度假门票" }
        ]
      },
      {
        name: "生活出行",
        pool: [
          { title: "永辉超市：生活日用品与新鲜水果" },
          { title: "滴滴出行：深夜加班快车专车" },
          { title: "全家便利店：深夜关东煮与酸奶" },
          { title: "生活缴费：水电气与手机话费" }
        ]
      }
    ];

    const shuffledCategories = [...categoryPools].sort(() => 0.5 - Math.random());
    const selectedCategoriesCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 categories
    const activeCategories = shuffledCategories.slice(0, selectedCategoriesCount);

    const catWeights = activeCategories.map(() => Math.random() + 0.5);
    const catWeightSum = catWeights.reduce((a, b) => a + b, 0);

    let runningCatSum = 0;
    const categoriesResult = activeCategories.map((cat, catIdx) => {
      let catTotal: number;
      if (catIdx === activeCategories.length - 1) {
        catTotal = Math.max(20, Math.round((total - runningCatSum) * 100) / 100);
      } else {
        catTotal = Math.round((total * (catWeights[catIdx] / catWeightSum)) * 100) / 100;
        runningCatSum += catTotal;
      }

      const shuffledItems = [...cat.pool].sort(() => 0.5 - Math.random());
      const itemCount = Math.min(shuffledItems.length, 5); // up to 5 items per category
      const selectedItems = shuffledItems.slice(0, itemCount);

      const itemWeights = selectedItems.map(() => Math.random() + 0.3);
      const itemWeightSum = itemWeights.reduce((a, b) => a + b, 0);

      let runningItemSum = 0;
      const items = selectedItems.map((itemObj, itemIdx) => {
        let itemAmount: number;
        if (itemIdx === selectedItems.length - 1) {
          itemAmount = Math.max(5, Math.round((catTotal - runningItemSum) * 100) / 100);
        } else {
          itemAmount = Math.round((catTotal * (itemWeights[itemIdx] / itemWeightSum)) * 100) / 100;
          runningItemSum += itemAmount;
        }

        const day = Math.floor(Math.random() * 9) + 1; // July 1st-9th
        const hour = Math.floor(Math.random() * 14) + 9;
        const minute = Math.floor(Math.random() * 60);
        const timeStr = `7月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        return {
          title: itemObj.title,
          amount: itemAmount.toFixed(2),
          time: timeStr
        };
      });

      const actualCatTotal = items.reduce((sum, i) => sum + parseFloat(i.amount), 0);

      return {
        name: cat.name,
        amount: actualCatTotal.toFixed(2),
        items
      };
    });

    const finalTotal = categoriesResult.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const allItems = categoriesResult.flatMap(c => c.items);

    res.json({
      totalDebt: finalTotal.toFixed(2),
      categories: categoriesResult,
      items: allItems
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
      if (data.base_resp && data.base_resp.status_code !== 0) {
        throw new Error(data.base_resp.status_msg || `MiniMax API Error: ${data.base_resp.status_code}`);
      }
      if (data.data?.audio) {
        return data.data.audio;
      }
      if (data.audio) {
        return data.audio;
      }
    } catch (e: any) {
      if (e.message && e.message.includes('MiniMax API Error') || e.message.includes('login fail')) {
        throw e;
      }
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
      if (size === '3:4') size = '768x1024';
      if (size === '4:3') size = '1024x768';

      // Detect model type for specialized compatibility mapping
      const isDalle3 = targetModel.toLowerCase().includes('dall-e-3');
      const isDalle2 = targetModel.toLowerCase().includes('dall-e-2');
      const isDalle = isDalle3 || isDalle2;
      
      let finalPrompt = fullPrompt;
      let finalSize = size;
      
      // If it's a Midjourney, Flux, or custom model (which includes gpt-image-2, etc.), 
      // these third-party systems usually map aspect ratios to --ar parameters or prompts,
      // while requiring the standard 'size' payload parameter to be '1024x1024'.
      // If we send DALL-E-3 sizes (like 1024x1792) to them, the API gateways (One-API/New-API) will crash with a 400/500 error.
      if (!isDalle) {
        const isSize916 = ratio === '9:16' || ratio === '1024x1792' || settings.imageGenSize === '9:16' || settings.imageGenSize === '1024x1792';
        const isSize169 = ratio === '16:9' || ratio === '1792x1024' || settings.imageGenSize === '16:9' || settings.imageGenSize === '1792x1024';
        const isSize34  = ratio === '3:4'  || ratio === '768x1024'  || settings.imageGenSize === '3:4'  || settings.imageGenSize === '768x1024';
        const isSize43  = ratio === '4:3'  || ratio === '1024x768'  || settings.imageGenSize === '4:3'  || settings.imageGenSize === '1024x768';

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

      let targetUrl = cleanUrl;
      if (!targetUrl.includes('/images/generations')) {
        if (targetUrl.endsWith('/v1')) {
          targetUrl = `${targetUrl}/images/generations`;
        } else {
          targetUrl = targetUrl.replace(/\/+$/, '') + '/v1/images/generations';
        }
      }

      // Build compatible request body
      const reqBody: any = {
        model: targetModel,
        prompt: finalPrompt,
        n: 1,
        size: finalSize
      };

      // Only include 'quality' parameter for DALL-E 3 models, as third-party model endpoints (like Flux/Midjourney)
      // will throw 400 Bad Request if they receive an unknown parameter.
      if (isDalle3) {
        reqBody.quality = settings.imageGenQuality || 'standard';
      }

      // Only include 'negative_prompt' if it's set and model is not standard DALL-E (which does not support it in the body)
      const negPromptVal = negative_prompt || settings.imageGenNegativePrompt;
      if (negPromptVal && !isDalle) {
        reqBody.negative_prompt = negPromptVal;
      }
      
      console.log(`[Image Gen] Requesting ${targetUrl} with model: ${targetModel}, size: ${finalSize}, prompt length: ${finalPrompt.length}`);
      logToFile(`[Image Gen Request] URL: ${targetUrl}, body: ${JSON.stringify({ ...reqBody, prompt: finalPrompt.substring(0, 50) + '...' })}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout (2 minutes) for image generation

      let response;
      try {
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reqBody),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Image Gen Error] Provider returned status ${response.status}:`, errText);
        logToFile(`[Image Gen Error] Provider returned status ${response.status}: ${errText}`);
        
        let errMsg = errText;
        try {
          const err = JSON.parse(errText);
          errMsg = err.error?.message || err.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg || `HTTP ${response.status}`);
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`[Image Gen Error] Failed to parse JSON response:`, responseText);
        logToFile(`[Image Gen Error] Failed to parse JSON response: ${responseText}`);
        throw new Error(`Failed to parse provider response: ${responseText.substring(0, 200)}`);
      }

      // Check if provider returned an error structure inside a 200 OK response (common for some third-party API gateways)
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

      let imageUrl = data.data?.[0]?.url;
      
      if (imageUrl) {
        // Return a proxied URL to avoid CORS and expiring URL issues
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        res.json({ url: proxiedUrl, originalUrl: imageUrl });
      } else if (data.data?.[0]?.b64_json) {
        res.json({ b64: data.data[0].b64_json });
      } else {
        console.error(`[Image Gen Error] No image data inside response:`, JSON.stringify(data));
        logToFile(`[Image Gen Error] No image data inside response: ${JSON.stringify(data)}`);
        res.status(500).json({ error: "No image data returned from provider" });
      }
    } catch (error: any) {
      console.error("Image Gen error:", error);
      logToFile(`[Image Gen Exception] message: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("No URL provided");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`[Proxy Image] Failed to fetch image: status ${response.status}. Redirecting to original URL.`);
        return res.redirect(imageUrl);
      }

      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      
      // Set headers to allow downloading
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Image proxy error, redirecting to original URL:", error);
      res.redirect(imageUrl);
    }
  });

  app.post("/api/huabei", async (req, res) => {
    try {
      const { amount } = req.body;
      const totalNum = parseFloat(amount) || 456.80;

      const categoryPools = [
        {
          name: "美食餐饮",
          pool: [
            { title: "奈雪的茶：多肉葡萄与欧包套餐" },
            { title: "美团外卖：深夜海底捞小龙虾外卖" },
            { title: "星巴克咖啡与下午茶组合" },
            { title: "大众点评：周末双人日料大餐" },
            { title: "喜茶：芝士芒芒与轻芒芒" }
          ]
        },
        {
          name: "日常购物",
          pool: [
            { title: "淘宝：购买了一套海蓝之谜化妆品" },
            { title: "淘宝：入手Dyson吹风机配件" },
            { title: "优衣库：夏季新款短袖T恤与休闲裤" },
            { title: "名创优品：创意盲盒与日用小物" },
            { title: "屈臣氏：个人护理与美妆护肤品" }
          ]
        },
        {
          name: "休闲娱乐",
          pool: [
            { title: "猫眼电影：IMAX双人观影及爆米花" },
            { title: "沉浸式剧本杀与密室逃脱" },
            { title: "KTV欢唱与果盘小吃" },
            { title: "周末温泉度假门票" }
          ]
        },
        {
          name: "生活出行",
          pool: [
            { title: "永辉超市：生活日用品与新鲜水果" },
            { title: "滴滴出行：深夜加班快车专车" },
            { title: "全家便利店：深夜关东煮与酸奶" },
            { title: "生活缴费：水电气与手机话费" }
          ]
        }
      ];

      const shuffledCategories = [...categoryPools].sort(() => 0.5 - Math.random());
      const activeCategories = shuffledCategories.slice(0, 3);
      const catWeights = activeCategories.map(() => Math.random() + 0.5);
      const catWeightSum = catWeights.reduce((a, b) => a + b, 0);
      let runningCatSum = 0;

      const newCategories = activeCategories.map((cat, catIdx) => {
        let catTotal: number;
        if (catIdx === activeCategories.length - 1) {
          catTotal = Math.max(20, Math.round((totalNum - runningCatSum) * 100) / 100);
        } else {
          catTotal = Math.round((totalNum * (catWeights[catIdx] / catWeightSum)) * 100) / 100;
          runningCatSum += catTotal;
        }

        const shuffledItems = [...cat.pool].sort(() => 0.5 - Math.random());
        const selectedItems = shuffledItems.slice(0, 5);
        const itemWeights = selectedItems.map(() => Math.random() + 0.3);
        const itemWeightSum = itemWeights.reduce((a, b) => a + b, 0);
        let runningItemSum = 0;

        const items = selectedItems.map((itemObj, iIdx) => {
          let itemAmount: number;
          if (iIdx === selectedItems.length - 1) {
            itemAmount = Math.max(5, Math.round((catTotal - runningItemSum) * 100) / 100);
          } else {
            itemAmount = Math.round((catTotal * (itemWeights[iIdx] / itemWeightSum)) * 100) / 100;
            runningItemSum += itemAmount;
          }
          const day = Math.floor(Math.random() * 9) + 1;
          const hour = Math.floor(Math.random() * 14) + 9;
          const minute = Math.floor(Math.random() * 60);
          return {
            title: itemObj.title,
            amount: itemAmount.toFixed(2),
            time: `7月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          };
        });

        const actualCatTotal = items.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        return {
          name: cat.name,
          amount: actualCatTotal.toFixed(2),
          items
        };
      });

      const finalTotal = newCategories.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const allItems = newCategories.flatMap(c => c.items);

      res.json({
        totalDebt: finalTotal.toFixed(2),
        categories: newCategories,
        items: allItems
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Railway 代理中间件：如果在 AI Studio 运行，则将请求转发到 Railway 后端，隐藏真实地址
  const RAILWAY_URL = "https://zhouzhou-production.up.railway.app";
  const isRailway = process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_PROJECT_ID;
  
  if (!isRailway) {
    app.use("/api", async (req, res, next) => {
      const targetUrl = RAILWAY_URL + req.originalUrl;
      console.log(`[Proxy] Forwarding unmatched route to Railway: ${targetUrl}`);
      try {
        const headersToForward: Record<string, string> = {
          'content-type': (req.headers['content-type'] as string) || 'application/json',
          'accept': (req.headers['accept'] as string) || 'application/json'
        };
        if (req.headers['authorization']) {
          headersToForward['authorization'] = req.headers['authorization'] as string;
        }

        const response = await fetch(targetUrl, {
          method: req.method,
          headers: headersToForward,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
        });
        
        response.headers.forEach((value, key) => {
          if (!['transfer-encoding', 'content-encoding', 'connection'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });
        res.setHeader('x-proxied-by', 'ai-studio');
        res.status(response.status);
        
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } catch (e: any) {
        console.error("[Proxy Error] Failed to reach Railway, falling back to local:", e.message);
        next();
      }
    });
  }

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

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
