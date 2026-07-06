import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Lock, Search, MessageCircle, FileText, Gift, Wallet, Gamepad2, X, Settings as SettingsIcon, Battery, Wifi, Signal, RefreshCw, Users, Compass, User, Mic, Smile, PlusCircle, Globe, ShoppingBag, ShieldAlert, Smartphone, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppSettings, Friend } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useFriends } from '../../hooks/useFriends';
import { useGifts } from '../../hooks/useGifts';
import { get, set } from 'idb-keyval';
import { getGeminiClient, getGeminiModel } from '../../lib/gemini';

interface Props {
  settings: AppSettings;
  onBack: () => void;
}

type PhoneAppType = 'home' | 'wechat' | 'memo' | 'browser' | 'gifts' | 'wallet' | 'taptap';

const AppLayout = ({ children, footer, className, noPadding = false }: { children: React.ReactNode, footer?: React.ReactNode, className?: string, noPadding?: boolean }) => {
  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div 
        className={cn("flex-1 overflow-y-auto custom-scrollbar", !noPadding && "p-4")}
        style={{
          WebkitOverflowScrolling: 'touch',
          overflowAnchor: 'none',
          overscrollBehavior: 'none',
          touchAction: 'pan-y'
        }}
      >
        {children}
      </div>
      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );
};

export default function CheckPhoneApp({ settings, onBack }: Props) {
  const { friends, user, chats } = useFriends();
  const { gifts } = useGifts();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [correctPasscode, setCorrectPasscode] = useState('1234');
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [currentApp, setCurrentApp] = useState<PhoneAppType>('home');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [wechatData, setWechatData] = useState<any>(null);
  const [memoData, setMemoData] = useState<any>(null);
  const [browserData, setBrowserData] = useState<any>(null);
  const [taptapData, setTaptapData] = useState<any>(null);
  const [giftsData, setGiftsData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);

  const isRainy = settings.themeId === 'rainy-cat';

  useEffect(() => {
    if (selectedFriend) {
      const keys = ['wechat', 'memo', 'browser', 'taptap', 'gifts', 'wallet'];
      const setters = [setWechatData, setMemoData, setBrowserData, setTaptapData, setGiftsData, setWalletData];
      
      keys.forEach((key, index) => {
        get(`checkphone_${selectedFriend.id}_${key}`)
          .then(data => data && setters[index](data))
          .catch(err => console.error(`Failed to load ${key}:`, err));
      });
    }
  }, [selectedFriend]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateAppData = useCallback(async () => {
    if (!selectedFriend) {
      setRefreshError("未选中好友");
      return;
    }
    const ai = getGeminiClient(settings);
    if (!ai) {
      setRefreshError("未配置 API Key");
      return;
    }
    if (currentApp === 'home') return;
    
    setIsRefreshing(true);
    setRefreshError(null);
    
    try {
      console.log("Starting data generation for:", currentApp);
      const friendChats = chats[selectedFriend.id] || [];
      const chatHistory = friendChats.slice(-30).map(m => `${m.role === 'user' ? '我' : selectedFriend.name}: ${m.content}`).join('\n');
      
      let prompt = '';
      let schema: any = {};
      
      if (currentApp === 'wechat') {
        // ... (prompt and schema setup)
        console.log("Prompt prepared for wechat");
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。你需要模拟一个真实的人的手机内容。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
最近聊天记录：
${chatHistory}

要求：
1. 必须包含一个名为"${user.name}"（即用户）的联系人，聊天记录要符合上面的真实聊天记录。
2. 绝对不能包含角色自身（${selectedFriend.name}）作为联系人。
3. 生成至少5个符合你人设的真实联系人（例如：家人、同事、朋友）。
4. 所有联系人对你的称呼必须符合你们的关系。你的名字是${selectedFriend.name}。
5. 聊天记录极其真实，体现你的日常生活、社交圈、以及你和用户（${user.name}）目前的真实关系。如果最近你和用户吵架了，要在和好朋友的聊天中体现出来。
6. 头像字段只需要返回联系人姓名的第一个汉字。
7. 每个联系人的聊天记录生成 5-10 条即可。
8. **极其关键的要求：你必须返回完整的聊天记录数据。在返回的 JSON 中，chatHistory 必须是一个对象，其键（key）必须与 contacts 数组中每个联系人的 id 完全一致，值（value）是该联系人的聊天记录数组（包含 sender, content, time 字段）。**
   **如果 chatHistory 为空，这是严重的错误。请务必根据 contacts 列表生成对应的聊天记录。**
   示例结构：
   {
     "contacts": [
       { "id": "jiangy_m", "name": "江月眠", "avatar": "江", "lastMessage": "...", "time": "...", "isUser": false }
     ],
     "chatHistory": {
       "jiangy_m": [
         { "sender": "me", "content": "你在干嘛？", "time": "2023-11-27 23:00" },
         { "sender": "them", "content": "刚忙完，准备休息了。", "time": "2023-11-27 23:05" }
       ]
     }
   }
9. 返回JSON格式，不要包含任何其他说明文字。`;
        schema = {
          type: "object",
          properties: {
            contacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  avatar: { type: "string", description: "联系人姓名的第一个汉字" },
                  lastMessage: { type: "string" },
                  time: { type: "string" },
                  isUser: { type: "boolean" }
                }
              }
            },
            chatHistory: {
              type: "object",
              description: "Key is contact id",
              additionalProperties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sender: { type: "string", enum: ["me", "them"] },
                    content: { type: "string" },
                    time: { type: "string" }
                  }
                }
              }
            }
          }
        };
      } else if (currentApp === 'memo') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。
角色设定：${selectedFriend.persona}
最近聊天记录：
${chatHistory}

要求：
1. 生成3-5条极其真实的备忘录，体现你的日常生活、工作/学习琐事、对用户的真实想法、以及生活压力。
2. 内容要符合你的身份和人设，不要虚构。
3. 返回JSON格式。`;
        schema = {
          type: "object",
          properties: {
            memos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  date: { type: "string" },
                  title: { type: "string" },
                  content: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'browser') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。
角色设定：${selectedFriend.persona}

要求：
1. 为 bilibili、zhihu、weibo、xiaohongshu 生成浏览历史和推荐内容。
2. 历史记录要极其真实，符合你的背景和爱好（例如：关注你的专业领域、符合人设的娱乐内容）。
3. 返回JSON格式。`;
        schema = {
          type: "object",
          properties: {
            history: {
              type: "array",
              items: { type: "string" }
            },
            platforms: {
              type: "object",
              properties: {
                bilibili: { 
                  type: "object",
                  properties: {
                    browsing_history: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          title: { type: "string" }, 
                          up_user: { type: "string" } 
                        } 
                      } 
                    }
                  }
                },
                zhihu: { 
                  type: "object",
                  properties: {
                    browsing_history: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          title: { type: "string" }, 
                          author: { type: "string" } 
                        } 
                      } 
                    }
                  }
                },
                weibo: { 
                  type: "object",
                  properties: {
                    browsing_history: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          content: { type: "string" }, 
                          author: { type: "string" } 
                        } 
                      } 
                    }
                  }
                },
                xiaohongshu: { 
                  type: "object",
                  properties: {
                    browsing_history: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          title: { type: "string" }, 
                          description: { type: "string" } 
                        } 
                      } 
                    }
                  }
                }
              }
            }
          }
        };
      } else if (currentApp === 'taptap') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。
角色设定：${selectedFriend.persona}

要求：
1. 生成2-3个最近在玩的游戏（符合你的休闲习惯）。
2. 生成2-3条游戏动态（发表的想法、吐槽等，体现你的性格）。
3. 返回JSON格式。`;
        schema = {
          type: "object",
          properties: {
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }
                }
              }
            },
            game_updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  timestamp: { type: "string" },
                  content: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'wallet') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。
角色设定：${selectedFriend.persona}

要求：
1. 根据你的职业和身份背景，生成合理的钱包余额和消费记录。
2. 生成2-3条最近账单记录（消费、转账等，体现你的生活方式）。
3. 返回JSON格式。`;
        schema = {
          type: "object",
          properties: {
            balance: { type: "string" },
            bills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  amount: { type: "string" },
                  time: { type: "string" },
                  type: { type: "string", enum: ["in", "out"] }
                }
              }
            }
          }
        };
      } else if (currentApp === 'gifts') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。
角色设定：${selectedFriend.persona}

要求：
1. 生成3-5件礼物，礼物要极其符合你的人设和与用户（${user.name}）的关系。
2. 每件礼物包含名称、感想、收到时间。
3. 返回JSON格式。`;
        schema = {
          type: "object",
          properties: {
            gifts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  image: { type: "string", description: "Gift image URL, e.g. from unsplash" },
                  thought: { type: "string" },
                  date: { type: "string" }
                }
              }
            }
          }
        };
      }

      console.log("Calling Direct Gemini SDK...");
      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      let text = "";
      try {
        text = result.text || "";
      } catch (e) {
        console.warn("Failed to get result.text directly, trying to extract. Error:", e);
      }
      
      if (!text && result.candidates && result.candidates.length > 0) {
          text = result.candidates[0].content?.parts?.[0]?.text || "";
      }

      if (!text) {
        console.error("Empty response. Result object:", JSON.stringify(result, null, 2));
        throw new Error("API 返回内容为空。这可能是因为触发了安全拦截(Safety)或模型无响应。请稍后再试。");
      }

      console.log("Raw API response text:", text);

      // 处理 JSON 内容
      // 如果包含 markdown 代码块，先剥离
      let cleanedText = text.replace(/^```json\s*/gm, '').replace(/```\s*$/gm, '').trim();
      
      // 如果还是不合法（例如只有中间部分），尝试寻找最外层的 { } 或 [ ]
      const jsonStartIndex = cleanedText.indexOf('{');
      const jsonEndIndex = cleanedText.lastIndexOf('}');
      const arrayStartIndex = cleanedText.indexOf('[');
      const arrayEndIndex = cleanedText.lastIndexOf(']');

      let finalJsonStr = '';
      if (jsonStartIndex !== -1 && (arrayStartIndex === -1 || jsonStartIndex < arrayStartIndex)) {
        finalJsonStr = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
      } else if (arrayStartIndex !== -1) {
        finalJsonStr = cleanedText.substring(arrayStartIndex, arrayEndIndex + 1);
      } else {
        finalJsonStr = cleanedText;
      }

      let data;
      try {
        data = JSON.parse(finalJsonStr);
        
        // 特殊处理：如果模型直接返回了数组但我们需要对象包装（如 memos）
        if (Array.isArray(data)) {
          if (currentApp === 'memo') data = { memos: data };
          else if (currentApp === 'wechat') data = { contacts: data, chatHistory: {} };
          else if (currentApp === 'browser') data = { history: [], platforms: { bilibili: { browsing_history: data } } };
          else if (currentApp === 'taptap') data = { games: data, game_updates: [] };
          else if (currentApp === 'gifts') data = { gifts: data };
          else if (currentApp === 'wallet') data = { balance: "0.00", bills: data };
        }
      } catch (e) {
        // 如果是那种搞笑的 {obj}, {obj} 格式
        try {
          data = JSON.parse(`[${finalJsonStr}]`);
          if (currentApp === 'memo') data = { memos: data };
          else if (currentApp === 'wechat') data = { contacts: data, chatHistory: {} };
          else if (currentApp === 'browser') data = { history: [], platforms: { bilibili: { browsing_history: data } } };
          else if (currentApp === 'taptap') data = { games: data, game_updates: [] };
          else if (currentApp === 'gifts') data = { gifts: data };
          else if (currentApp === 'wallet') data = { balance: "0.00", bills: data };
        } catch (e2) {
          console.error("JSON Parse Error. Cleaned text:", finalJsonStr);
          throw new Error("API 返回的 JSON 格式错误，请尝试刷新重试");
        }
      }
      console.log("API Generated Data for " + currentApp + ":", data);
      
      // Ensure data has the expected structure even if partial
      if (currentApp === 'browser') {
        if (!data.platforms) data.platforms = {};
        if (!data.history) data.history = [];
      } else if (currentApp === 'taptap') {
        if (!data.games) data.games = [];
        if (!data.game_updates) data.game_updates = [];
      } else if (currentApp === 'wallet') {
        if (!data.balance) data.balance = "0.00";
        if (!data.bills) data.bills = [];
      }

      
      if (currentApp === 'wechat') {
        console.log("Setting WeChat Data:", data);
        setWechatData(data);
        await set(`checkphone_${selectedFriend.id}_wechat`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'memo') {
        setMemoData(data);
        await set(`checkphone_${selectedFriend.id}_memo`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'browser') {
        setBrowserData(data);
        await set(`checkphone_${selectedFriend.id}_browser`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'taptap') {
        setTaptapData(data);
        await set(`checkphone_${selectedFriend.id}_taptap`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'gifts') {
        setGiftsData(data);
        await set(`checkphone_${selectedFriend.id}_gifts`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'wallet') {
        setWalletData(data);
        await set(`checkphone_${selectedFriend.id}_wallet`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      }
      
    } catch (error) {
      console.error("Failed to generate app data:", error);
      setRefreshError(error instanceof Error ? error.message : "生成数据失败，请检查 API Key 或稍后再试");
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedFriend, settings.apiKey, settings.userApiKey, settings.baseUrl, settings.modelName, currentApp, chats, user.name]);
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      get(`phone_passcode_${selectedFriend.id}`).catch(err => console.error("IDB get error:", err)).then(val => {
        if (val) setCorrectPasscode(val);
        else setCorrectPasscode('1234');
      }).catch(err => console.error(err));
    }
  }, [selectedFriend]);

  // Listen for AI "kick out" command
  useEffect(() => {
    if (selectedFriend && isUnlocked) {
      const friendChats = chats[selectedFriend.id] || [];
      const lastMsg = friendChats[friendChats.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && (lastMsg.content.includes('退出手机') || lastMsg.content.includes('下线'))) {
        setIsUnlocked(false);
        setIsKicked(true);
        setPasscode('');
        setTimeout(() => setIsKicked(false), 3000);
      }
    }
  }, [chats, selectedFriend, isUnlocked]);

  const handleUnlock = async () => {
    if (!selectedFriend) return;

    const isMaster = passcode === '0920';
    const isCorrect = passcode === correctPasscode || isMaster;

    if (isCorrect) {
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode('');
      setTimeout(() => setPasscodeError(false), 1500);
    }

    // Send notification to Chat App
    const friendChats = chats[selectedFriend.id] || [];
    const newMessage = {
      id: `sys-${Date.now()}`,
      role: 'user' as const,
      content: isCorrect ? `[解锁成功] ${passcode}` : `[解锁失败] ${passcode}`,
      timestamp: Date.now(),
      type: 'text' as const,
      isSystemNotification: true,
      notificationType: isCorrect ? 'unlock_success' : 'unlock_fail',
      notificationData: {
        userName: user.name,
        isMaster,
        passcode
      }
    };

    // Update chats in IDB and trigger state update via custom event
    const updatedChats = { ...chats, [selectedFriend.id]: [...friendChats, newMessage] };
    await set('chats', updatedChats);
    window.dispatchEvent(new CustomEvent('zhouzhou_ji_chats_updated', { detail: { friendId: selectedFriend.id, message: newMessage } }));
  };

  const handleUpdatePasscode = async () => {
    if (newPasscode.length === 4 && selectedFriend) {
      await set(`phone_passcode_${selectedFriend.id}`, newPasscode);
      setCorrectPasscode(newPasscode);
      setIsChangingPasscode(false);
      setNewPasscode('');
    }
  };

  const StatusBar = () => (
    <div className="flex justify-between items-center px-6 py-2 text-xs font-bold text-slate-600">
      <span>{currentDate} {currentTime}</span>
      <div className="flex gap-2">
        <Signal size={14} />
        <Wifi size={14} />
        <Battery size={14} />
      </div>
    </div>
  );

  const renderPasscode = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-[#f2f4f7]">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm backdrop-blur-sm">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-700">输入密码</h2>
      </div>

      <div className="flex gap-4">
        {[1, 2, 3, 4].map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              passcode.length > i ? "bg-slate-600" : "bg-slate-300"
            )} 
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
          <button
            key={i}
            onClick={() => {
              if (num === 'del') setPasscode(p => p.slice(0, -1));
              else if (typeof num === 'number' && passcode.length < 4) {
                setPasscode(p => p + num);
                setPasscodeError(false);
              }
            }}
            className={cn(
              "h-16 rounded-full flex items-center justify-center text-xl font-medium transition-all active:scale-90",
              num === '' ? "invisible" : "bg-white/60 hover:bg-white/80 text-slate-700 shadow-sm backdrop-blur-md",
              passcodeError && "border-2 border-red-400 animate-shake"
            )}
          >
            {num === 'del' ? '删除' : num}
          </button>
        ))}
      </div>

      {isKicked && (
        <div className="text-red-500 text-xs font-bold animate-bounce">
          你已被对方踢下线！
        </div>
      )}

      <button 
        onClick={handleUnlock}
        className="w-full max-w-[240px] py-4 bg-slate-700/90 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all backdrop-blur-md"
      >
        解锁
      </button>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#f2f4f7] relative">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#e2e8f0] to-transparent opacity-50 pointer-events-none"></div>
      
      <div 
        className="p-6 flex-1 overflow-y-auto z-10 space-y-6"
        style={{
          WebkitOverflowScrolling: 'touch',
          overflowAnchor: 'none',
          overscrollBehavior: 'contain',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Game Widget */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-4 shadow-sm border border-white/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-600">TapTap 游戏动态</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">刚刚更新</span>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Game" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700 mb-1">原神 - 新版本前瞻</h4>
              <p className="text-[10px] text-slate-500 line-clamp-2">全新区域即将开放，参与活动获取丰厚原石奖励！</p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-4 gap-y-6 gap-x-4">
          <button onClick={() => setCurrentApp('wechat')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#e8f5e9] rounded-[18px] flex items-center justify-center text-[#81c784] shadow-sm border border-white">
              <MessageCircle size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">微信</span>
          </button>
          <button onClick={() => setCurrentApp('memo')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#fff8e1] rounded-[18px] flex items-center justify-center text-[#ffd54f] shadow-sm border border-white">
              <FileText size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">备忘录</span>
          </button>
          <button onClick={() => setCurrentApp('gifts')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#fce4ec] rounded-[18px] flex items-center justify-center text-[#f06292] shadow-sm border border-white">
              <Gift size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">礼物柜</span>
          </button>
          <button onClick={() => setCurrentApp('wallet')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#e3f2fd] rounded-[18px] flex items-center justify-center text-[#64b5f6] shadow-sm border border-white">
              <Wallet size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">钱包</span>
          </button>
          <button onClick={() => setCurrentApp('browser')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#f3e5f5] rounded-[18px] flex items-center justify-center text-[#ba68c8] shadow-sm border border-white">
              <Search size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">浏览器</span>
          </button>
          <button onClick={() => setCurrentApp('taptap')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#e0f2f1] rounded-[18px] flex items-center justify-center text-[#4db6ac] shadow-sm border border-white">
              <Gamepad2 size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">TapTap</span>
          </button>
        </div>
      </div>
      
      {/* Dock */}
      <div className="px-4 pb-6 pt-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-[28px] p-4 flex justify-around shadow-sm border border-white/50">
          <button onClick={() => setCurrentApp('wechat')} className="w-12 h-12 bg-[#e8f5e9] rounded-[18px] flex items-center justify-center text-[#81c784] shadow-sm border border-white active:scale-95 transition-transform">
            <MessageCircle size={24} strokeWidth={2.5} />
          </button>
          <button onClick={() => setCurrentApp('browser')} className="w-12 h-12 bg-[#f3e5f5] rounded-[18px] flex items-center justify-center text-[#ba68c8] shadow-sm border border-white active:scale-95 transition-transform">
            <Search size={24} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setIsChangingPasscode(true)} 
            className="w-12 h-12 bg-slate-100 rounded-[18px] flex items-center justify-center text-slate-500 shadow-sm border border-white active:scale-95 transition-transform"
          >
            <SettingsIcon size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isChangingPasscode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-xs space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-slate-800">修改手机密码</h3>
                <p className="text-xs text-slate-500">请输入4位新密码</p>
              </div>
              
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={cn(
                    "w-3 h-3 rounded-full",
                    newPasscode.length > i ? "bg-slate-800" : "bg-slate-200"
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      if (num === 'C') setNewPasscode('');
                      else if (num === 'OK') handleUpdatePasscode();
                      else if (typeof num === 'number' && newPasscode.length < 4) setNewPasscode(p => p + num);
                    }}
                    className={cn(
                      "h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all active:scale-90",
                      num === 'OK' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setIsChangingPasscode(false)}
                className="w-full py-3 text-slate-400 text-xs font-medium"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const [viewingWechatContact, setViewingWechatContact] = useState<string | null>(null);

  const renderWeChat = () => {
    if (viewingWechatContact) {
      const contact = wechatData?.contacts?.find((c: any) => c.id === viewingWechatContact);
      const history = wechatData?.chatHistory?.[viewingWechatContact] || [];
      
      return (
        <AppLayout 
          className="bg-[#ededed]"
          noPadding
          footer={
            <div className="bg-[#f7f7f7] border-t border-slate-200 px-3 py-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-slate-400 flex items-center justify-center text-slate-600">
                <Mic size={16} />
              </div>
              <div className="flex-1 h-9 bg-white rounded-md border border-slate-200"></div>
              <Smile size={24} className="text-slate-600" />
              <PlusCircle size={24} className="text-slate-600" />
            </div>
          }
        >
          <div className="p-3 space-y-4 relative min-h-full chat-messages-container">
            {history.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="text-[10px] text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
                  暂无聊天记录
                </div>
              </div>
            ) : (
              history.map((msg: any, i: number) => (
                <div key={i} className={cn("flex items-start gap-2.5", msg.sender === 'me' ? "flex-row-reverse" : "")}>
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-white shadow-sm">
                    <img 
                      src={msg.sender === 'me' ? selectedFriend?.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${contact?.name}&backgroundColor=b6e3f4`} 
                      className="w-full h-full object-cover" 
                      alt="avatar"
                    />
                  </div>
                  <div 
                    className={cn(
                      "max-w-[70%] p-2.5 rounded-lg text-[13px] leading-relaxed relative shadow-sm select-none",
                      msg.sender === 'me' 
                        ? "bg-[#95ec69] text-black rounded-tr-none after:content-[''] after:absolute after:top-3 after:-right-1.5 after:border-4 after:border-transparent after:border-l-[#95ec69]" 
                        : "bg-white text-black rounded-tl-none after:content-[''] after:absolute after:top-3 after:-left-1.5 after:border-4 after:border-transparent after:border-r-white"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout 
        className="bg-white"
        noPadding
        footer={
          <div className="bg-[#f7f7f7] border-t border-slate-200 flex justify-around py-1.5">
            <div className="flex flex-col items-center gap-0.5 text-[#07c160]">
              <MessageCircle size={22} fill="currentColor" />
              <span className="text-[10px] font-medium">微信</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-slate-500">
              <Users size={22} />
              <span className="text-[10px] font-medium">通讯录</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-slate-500">
              <Compass size={22} />
              <span className="text-[10px] font-medium">发现</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-slate-500">
              <User size={22} />
              <span className="text-[10px] font-medium">我</span>
            </div>
          </div>
        }
      >
        {wechatData?.contacts?.map((contact: any) => (
          <button 
            key={contact.id}
            onClick={() => setViewingWechatContact(contact.id)}
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 active:bg-slate-100 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-slate-100">
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}&backgroundColor=b6e3f4`} 
                className="w-full h-full object-cover" 
                alt={contact.name}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-[15px] text-slate-800 truncate">{contact.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{contact.time}</span>
              </div>
              <p className="text-[13px] text-slate-400 truncate">{contact.lastMessage}</p>
            </div>
          </button>
        ))}
        
        {!wechatData && (
          <div className="flex flex-col items-center justify-center text-slate-300 py-32">
            <MessageCircle size={64} strokeWidth={1} className="opacity-20 mb-4" />
            <p className="text-sm font-medium opacity-40">暂无消息</p>
            <p className="text-[10px] opacity-30 mt-1">点击右上角刷新获取数据</p>
          </div>
        )}
      </AppLayout>
    );
  };

  const renderMemo = () => (
    <AppLayout>
      <div className="space-y-4">
        {memoData?.memos?.map((memo: any) => (
          <div key={memo.id} className="bg-white rounded-2xl p-5 shadow-sm border border-yellow-50">
            <div className="text-[10px] text-slate-400 mb-3">{memo.date}</div>
            <h3 className="font-bold text-slate-700 mb-3 text-lg">{memo.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed tracking-wide whitespace-pre-wrap">
              {memo.content}
            </p>
          </div>
        ))}
        {!memoData && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
            <FileText size={48} className="opacity-30" />
            <p className="text-sm">点击右上角刷新获取备忘录</p>
          </div>
        )}
      </div>
    </AppLayout>
  );

  const renderGifts = () => {
    // Combine AI generated gifts with real received gifts
    const aiGifts = giftsData?.gifts || [];
    const realGifts = gifts.filter(g => g.friendId === selectedFriend?.id);
    
    // Convert realGifts to the same format as aiGifts if needed, but they are already similar
    const allGifts = [...realGifts, ...aiGifts];
    
    return (
      <AppLayout>
        {allGifts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
            <Gift size={48} className="opacity-30" />
            <p className="text-sm">还没有收到礼物哦</p>
            <p className="text-[10px] opacity-60">点击右上角刷新获取数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {allGifts.map((gift: any) => (
              <div key={gift.id} className="bg-white/80 backdrop-blur-md rounded-[20px] p-3 shadow-sm border border-white flex flex-col">
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3">
                  <img src={gift.image || gift.coverUrl} className="w-full h-full object-cover" alt={gift.name} />
                </div>
                <h4 className="font-bold text-xs text-slate-700 mb-1 line-clamp-1">{gift.name}</h4>
                <p className="text-[9px] text-slate-400 mb-2">
                  {new Date(gift.timestamp || gift.date || gift.receivedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-auto bg-blue-50/50 p-2 rounded-xl">
                  <p className="text-[10px] text-blue-600 italic line-clamp-3">"{gift.characterReaction || gift.thought || gift.characterThoughts}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>
    );
  };

  const [viewingBrowserApp, setViewingBrowserApp] = useState<string | null>(null);

  const renderBrowser = () => {
    if (viewingBrowserApp && browserData?.platforms?.[viewingBrowserApp]) {
      const appContent = browserData.platforms[viewingBrowserApp];
      return (
        <AppLayout>
          <div className="space-y-4">
            {appContent.browsing_history?.map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50">
                <h4 className="font-bold text-slate-700 mb-2">{item.title || item.content}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.up_user || item.author || item.description}</p>
              </div>
            ))}
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout noPadding>
        <div className="px-4 py-3">
          <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl px-4 py-2.5 flex items-center gap-2 text-slate-400 shadow-sm">
            <Search size={16} />
            <span className="text-xs">搜索或输入网址</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-slate-700 text-sm mb-4">最近常看</h3>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {Object.keys(browserData?.platforms || { 'bilibili': {}, 'zhihu': {}, 'weibo': {}, 'xiaohongshu': {} }).map((site, i) => (
              <button 
                key={i} 
                onClick={() => setViewingBrowserApp(site)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
                  <Globe size={20} />
                </div>
                <span className="text-[10px] text-slate-500 capitalize">{site}</span>
              </button>
            ))}
          </div>
          <h3 className="font-bold text-slate-700 text-sm mb-4 bg-white/50 px-3 py-1.5 rounded-lg inline-block">历史记录</h3>
          <div className="space-y-2">
            {browserData?.history?.map((item: string, i: number) => (
              <div key={i} className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl shadow-sm">{item}</div>
            ))}
            {(!browserData || !browserData.history || browserData.history.length === 0) && (
              <div className="text-center text-slate-400 text-[10px] py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Search size={24} className="mx-auto mb-2 opacity-20" />
                <p>暂无浏览历史</p>
                <p className="mt-1 opacity-60 italic">点击右上角刷新让角色生成内容</p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  };

  const renderWallet = () => (
    <AppLayout>
      <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-6 rounded-[24px] shadow-md mb-4">
        <div className="text-blue-100 text-xs mb-2">总资产 (元)</div>
        <div className="text-3xl font-bold tracking-tight">{walletData?.balance || '8,432.50'}</div>
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm p-4 mb-4 flex justify-around border border-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Search size={18} />
          </div>
          <span className="text-[10px] text-slate-600">收付款</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <span className="text-[10px] text-slate-600">零钱</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center">
            <MessageCircle size={18} />
          </div>
          <span className="text-[10px] text-slate-600">银行卡</span>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm overflow-hidden border border-white">
        <div className="p-4 border-b border-slate-50 text-xs font-bold text-slate-700">最近账单</div>
        {walletData?.bills?.map((bill: any, i: number) => (
          <div key={i} className="p-4 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bill.type === 'in' ? "bg-blue-50" : "bg-slate-100")}>
                {bill.type === 'in' ? <Wallet size={16} className="text-blue-500" /> : <ShoppingBag size={16} className="text-slate-500" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">{bill.title}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{bill.time}</div>
              </div>
            </div>
            <div className={cn("font-bold text-sm", bill.type === 'in' ? "text-blue-500" : "text-slate-700")}>
              {bill.type === 'in' ? '+' : '-'}{bill.amount}
            </div>
          </div>
        ))}
        {(!walletData || !walletData.bills || walletData.bills.length === 0) && (
          <div className="text-center text-slate-400 text-[10px] py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200">
            <Wallet size={24} className="mx-auto mb-2 opacity-20" />
            <p>暂无交易记录</p>
            <p className="mt-1 opacity-60 italic">点击右上角刷新获取数据</p>
          </div>
        )}
      </div>
    </AppLayout>
  );

  const renderTaptap = () => {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-700 text-sm mb-4">最近在玩</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {taptapData?.games?.map((game: any, i: number) => (
                <div key={i} className="min-w-[72px] flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-white rounded-[18px] shadow-sm overflow-hidden border border-white flex items-center justify-center text-slate-400">
                    <Gamepad2 size={24} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-16 text-center">{game.name}</span>
                </div>
              ))}
              {(!taptapData || !taptapData.games || taptapData.games.length === 0) && (
                <div className="text-[10px] text-slate-400 py-4 italic">暂无游戏数据，点击刷新</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 text-sm mb-4">游戏动态</h3>
            <div className="space-y-4">
              {taptapData?.game_updates?.map((post: any, i: number) => (
                <div key={i} className="bg-white/80 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-white">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      <img src={selectedFriend?.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{selectedFriend?.name}</div>
                      <div className="text-[9px] text-slate-400 mb-2">{post.timestamp}</div>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!taptapData || !taptapData.game_updates || taptapData.game_updates.length === 0) && (
                <div className="text-center text-slate-400 text-[10px] py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                  <Gamepad2 size={24} className="mx-auto mb-2 opacity-20" />
                  <p>暂无游戏动态</p>
                  <p className="mt-1 opacity-60 italic">点击右上角刷新让角色生成内容</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  };

  const renderPlaceholder = (title: string, color: string) => (
    <div className={`flex-1 flex flex-col items-center justify-center ${color} bg-opacity-10`}>
      <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
        {title === '浏览器' && <Search size={40} />}
        {title === '钱包' && <Wallet size={40} />}
        {title === 'TapTap' && <Gamepad2 size={40} />}
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-sm text-slate-500">该应用暂无内容</p>
    </div>
  );

  const renderAppContent = () => {
    switch (currentApp) {
      case 'home': return renderHomeScreen();
      case 'wechat': return renderWeChat();
      case 'memo': return renderMemo();
      case 'gifts': return renderGifts();
      case 'browser': return renderBrowser();
      case 'wallet': return renderWallet();
      case 'taptap': return renderTaptap();
    }
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col font-sans transition-all duration-500",
      isRainy ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-50"
    )}>
      {/* Main Top Bar (Only visible when NOT looking at a friend's phone) */}
      {!selectedFriend && (
        <div className={cn(
          "flex items-center justify-between px-4 py-3 sticky top-0 z-10 transition-all duration-300",
          isRainy ? "bg-white/5 backdrop-blur-xl border-b border-white/10" : "bg-white border-b border-slate-100"
        )}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={cn(
              "p-2 -ml-2 transition-colors",
              isRainy ? "text-white/60 hover:text-white" : "text-slate-600 hover:bg-slate-100 rounded-full"
            )}>
              <ChevronLeft size={24} />
            </button>
            <span className="font-bold text-slate-800">查手机</span>
          </div>
        </div>
      )}

      {!selectedFriend ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
            <ShieldAlert className="text-blue-500 shrink-0" size={20} />
            <p className="text-xs text-blue-700 leading-relaxed">
              提示：此功能仅供角色扮演使用。你可以“偷看”好友的手机内容，包括备忘录、聊天记录等私密信息。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {friends.map(friend => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
              >
                <div className="relative">
                  <img 
                    src={friend.avatar} 
                    className="w-16 h-16 rounded-2xl object-cover group-hover:scale-105 transition-transform" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Smartphone size={12} className="text-slate-400" />
                  </div>
                </div>
                <span className="font-bold text-sm">{friend.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-200/50 backdrop-blur-sm relative">
          {/* Close Button for Phone View */}
          <button 
            onClick={() => {
              setSelectedFriend(null);
              setIsUnlocked(false);
              setPasscode('');
              setCurrentApp('home');
            }}
            className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-600 shadow-lg hover:bg-white transition-colors z-50"
          >
            <X size={20} />
          </button>

          {/* iOS Phone Frame */}
          <div className="w-full max-w-[320px] aspect-[9/19.5] bg-[#f2f4f7] rounded-[48px] shadow-2xl border-[12px] border-slate-800 overflow-hidden relative flex flex-col">
            
            {/* iOS Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-50 flex items-center justify-center">
              <div className="w-16 h-1.5 bg-slate-900 rounded-full opacity-50"></div>
            </div>

            {/* iOS Status Bar (Single Top Bar for all apps) */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 text-slate-800 z-40 relative">
              <span className="text-[11px] font-medium pl-2">{currentTime}</span>
              <div className="flex items-center gap-1.5 pr-1">
                <Signal size={12} strokeWidth={3} />
                <Wifi size={12} strokeWidth={3} />
                <Battery size={14} strokeWidth={2.5} />
              </div>
            </div>

            {/* App Navigation Bar (If not on home screen) */}
            {isUnlocked && currentApp !== 'home' && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[#f2f4f7]/80 backdrop-blur-md z-30 relative border-b border-white/20">
                  <button 
                    onClick={() => {
                      if (currentApp === 'wechat' && viewingWechatContact) {
                        setViewingWechatContact(null);
                      } else if (currentApp === 'browser' && viewingBrowserApp) {
                        setViewingBrowserApp(null);
                      } else {
                        setCurrentApp('home');
                      }
                    }} 
                    className="p-1 text-slate-600 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-bold text-sm text-slate-700">
                    {(() => {
                      if (currentApp === 'wechat') {
                        if (viewingWechatContact) {
                          const contact = wechatData?.contacts?.find((c: any) => c.id === viewingWechatContact);
                          return contact?.name || '聊天';
                        }
                        return '微信';
                      }
                      if (currentApp === 'browser' && viewingBrowserApp) return viewingBrowserApp;
                      
                      const labels: Record<string, string> = {
                        'memo': '备忘录',
                        'gifts': '礼物柜',
                        'wallet': '钱包',
                        'browser': '浏览器',
                        'taptap': 'TapTap'
                      };
                      return labels[currentApp] || '手机';
                    })()}
                  </span>
                  <div className="w-6 flex justify-end">
                    {['wechat', 'memo', 'browser', 'taptap', 'gifts', 'wallet'].includes(currentApp) && (
                      <button 
                        onClick={() => generateAppData().catch(console.error)} 
                        disabled={isRefreshing}
                        className="text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-colors"
                      >
                        {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      </button>
                    )}
                  </div>
                </div>
                {refreshError && (
                  <div className="px-4 py-1 bg-red-100 text-red-600 text-[10px] text-center">
                    {refreshError}
                  </div>
                )}
              </div>
            )}

            {/* Phone Content */}
            <div 
              className="flex-1 z-20 overflow-hidden flex flex-col"
              style={{
                height: '100%'
              }}
            >
              {isUnlocked ? renderAppContent() : (
                <div 
                  className="h-full overflow-y-auto custom-scrollbar p-4"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    overflowAnchor: 'none',
                    overscrollBehavior: 'none',
                    touchAction: 'pan-y'
                  }}
                >
                  {renderPasscode()}
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-800/20 rounded-full z-50"></div>
          </div>
        </div>
      )}
    </div>
  );
}
