import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronDown, Lock, Search, MessageCircle, FileText, Gift, Wallet, Gamepad2, X, Settings as SettingsIcon, Battery, Wifi, Signal, RefreshCw, Users, Compass, User, Mic, Smile, PlusCircle, Globe, ShoppingBag, ShieldAlert, Smartphone, Loader2, History, Sparkles } from 'lucide-react';
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

type PhoneAppType = 'home' | 'wechat' | 'memo' | 'browser' | 'gifts' | 'wallet' | 'taptap' | 'future' | 'past';

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
  const { friends, user, chats, addMessage } = useFriends();
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
  const [futureData, setFutureData] = useState<any>(null);
  const [pastData, setPastData] = useState<any>(null);
  const [expandedFutureStages, setExpandedFutureStages] = useState<Record<number, boolean>>({ 0: true });
  const [expandedBillIndex, setExpandedBillIndex] = useState<number | null>(null);
  const [viewingBankCards, setViewingBankCards] = useState<boolean>(false);
  const [viewingAssets, setViewingAssets] = useState<boolean>(false);
  const [viewingSearchItem, setViewingSearchItem] = useState<any | null>(null);
  const [expandedBrowserItems, setExpandedBrowserItems] = useState<Record<string, boolean>>({});
  const [viewingGiftItem, setViewingGiftItem] = useState<any | null>(null);

  const isRainy = settings.themeId === 'rainy-cat';

  useEffect(() => {
    if (selectedFriend) {
      const keys = ['wechat', 'memo', 'browser', 'taptap', 'gifts', 'wallet', 'future', 'past'];
      const setters = [setWechatData, setMemoData, setBrowserData, setTaptapData, setGiftsData, setWalletData, setFutureData, setPastData];
      
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
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户或群聊的聊天记录：
${chatHistory}

要求：
1. 必须严格参考上述与用户的真实聊天记录及你的角色人设，生成浏览器首页的“日常搜索记录” history（**必须生成至少 6 条**对象，每个对象包含 keyword（搜索词）、detail（该搜索的详细结果内容或说明，至少100字）、remark（你为什么搜这个的内心备注/碎碎念，20字以内））。
2. 为各大平台（bilibili、zhihu、weibo、xiaohongshu）生成浏览与推荐内容。**每一个平台必须严格生成至少 6 条**高质、符合人设和聊天背景的记录。
3. bilibili 的每条记录包含 title（视频标题）、up_user（UP主）、detail（视频详细内容介绍，至少100字）和 muttering（你对这个视频的碎碎念，20字以内）。
4. zhihu 的每条记录包含 title（问题标题）、author（回答者/话题）、detail（问题与回答详细介绍，至少100字）和 muttering（你对这个问题的碎碎念，20字以内）。
5. weibo 的每条记录包含 content（微博正文，至少100字）、author（博主）、detail（微博背景与讨论详情，至少100字）和 muttering（碎碎念，20字以内）。
6. xiaohongshu 的每条记录包含 title（笔记标题）、description（笔记正文，至少100字）、detail（笔记详细攻略或心流分享，至少100字）和 muttering（碎碎念，20字以内）。
7. 返回合法的 JSON 格式。`;
        schema = {
          type: "object",
          properties: {
            history: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  detail: { type: "string" },
                  remark: { type: "string" }
                }
              }
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
                          up_user: { type: "string" },
                          detail: { type: "string" },
                          muttering: { type: "string" }
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
                          author: { type: "string" },
                          detail: { type: "string" },
                          muttering: { type: "string" }
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
                          author: { type: "string" },
                          detail: { type: "string" },
                          muttering: { type: "string" }
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
                          description: { type: "string" },
                          detail: { type: "string" },
                          muttering: { type: "string" }
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
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户或群聊的聊天记录：
${chatHistory}

要求：
1. 必须严格参考上述与用户的真实聊天记录及你的角色人设，生成**至少 4 个**最近在玩的游戏（包含 name（游戏名称）、genre（游戏类型）、playtime（游玩时长，如“已游玩 142 小时”）和 thoughts（你对这个游戏的游玩感受与心路历程，至少80字））。
2. 生成**至少 4 条**TapTap游戏动态/动态长文/深度测评（包含 game_name（游戏名称）、timestamp（发表时间）、content（动态内容/深度测评正文，至少100字）、muttering（你对这个游戏的真实碎碎念或吐槽，20字以内））。
3. 返回合法的 JSON 格式。`;
        schema = {
          type: "object",
          properties: {
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  genre: { type: "string" },
                  playtime: { type: "string" },
                  thoughts: { type: "string" }
                }
              }
            },
            game_updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  game_name: { type: "string" },
                  timestamp: { type: "string" },
                  content: { type: "string" },
                  muttering: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'wallet') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户或群聊的聊天记录：
${chatHistory}

要求：
1. 根据你的职业和身份背景（工作年限、社会地位等），生成非常合理的钱包总资产余额（例如工作几年的成熟职场人或精英，余额应在数万到数十万不等，如 188,500.00）。
2. 生成**至少 8 条**最近账单记录。**必须严格参考上述与用户的真实聊天记录**，将里面涉及的资金往来（例如：给用户发红包、在线上还花呗、转账买奶茶、请客吃饭等）如实同步生成到账单中，所有时间戳必须是 2026 年 7 月。
3. 每条账单必须包含该笔消费或转账时你的**内心碎碎念/吐槽（约50字）**（字段名: inner_thought）。
4. 生成**恰好 3 张不同银行的银行卡**（如中国银行、招商银行、工商银行等，绝对不能重复）。每张卡需有 bank_name、card_number、balance、以及卡片用途备注 purpose（例如：“养老婆专属基金”、“房贷与日常储蓄账户”、“投资理财与闲置资金”）。
5. 生成角色的**房产资产列表**（properties，包含名称 name、估值 value、买房/持有用途 purpose）和**车辆资产列表**（vehicles，包含型号 model、估值 value、买车/持有用途 purpose），须符合角色人设。
6. 返回合法的 JSON 格式。`;
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
                  type: { type: "string", enum: ["in", "out"] },
                  inner_thought: { type: "string" }
                }
              }
            },
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bank_name: { type: "string" },
                  card_number: { type: "string" },
                  balance: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            properties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            vehicles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model: { type: "string" },
                  value: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'gifts') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户的聊天记录：
${chatHistory}

要求：
1. 必须根据你的角色人设和聊天背景，生成**至少 6 件**收到的礼物记录。
2. **绝对不能虚构用户（${user.name}）赠送的礼物**。所有生成的礼物来源（from）必须是“朋友赠送”、“粉丝寄送”、“品牌方赠礼”或其他非用户来源。
3. 每件礼物必须包含：
   - id: 唯一字符串
   - name: 礼物名称
   - description: 礼物的外观与详细文字描述（如外观形态、材质、包装等，代替图片显示）
   - from: 礼物来源（如 "朋友赠送"、"粉丝寄送" 等）
   - thought: 你对这件礼物的真实感想与内心独白（至少40字）
   - date: 收到时间（2026年7月内的具体日期或时间）
4. 返回合法的 JSON 格式。`;
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
                  description: { type: "string" },
                  from: { type: "string" },
                  thought: { type: "string" },
                  date: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'future') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户或群聊的聊天记录：
${chatHistory}

要求：
1. 深度分析角色的人设、年龄与当前生活状态，生成角色未来的人生阶段规划（stages，至少 4-5 个阶段，例如：25-35岁、35-45岁等，按10年或合理区间划分）。
2. 每个阶段需包含：
   - range (时间段，如 "25-35岁")
   - title (阶段核心目标与主题，如 "事业冲刺与组建温馨家庭")
   - goals (数组：具体想做的事，至少3条，如["在行业内晋升为核心骨干", "与${user.name}结婚并且购置爱巢", "每年带家人旅行一次"])
   - thought (内心独白与原因，约80字，深度表达为什么在这个阶段有这样的想法和规划)。
3. 返回合法的 JSON 格式。`;
        schema = {
          type: "object",
          properties: {
            stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  range: { type: "string" },
                  title: { type: "string" },
                  goals: { type: "array", items: { type: "string" } },
                  thought: { type: "string" }
                }
              }
            }
          }
        };
      } else if (currentApp === 'past') {
        prompt = `你现在是 ${selectedFriend.name}，你正在使用你的真实手机。当前真实时间是2026年7月。
角色设定：${selectedFriend.persona}
用户昵称：${user.name}
近期与用户或群聊的聊天记录：
${chatHistory}

要求：
1. 结合角色人设、性格背景，生成角色过去成长阶段中遇到的**至少 6 条**核心事件、难忘回忆或者出丑/有趣的故事（events）。
2. **每一条事件中必须自然融入角色自己的名字（${selectedFriend.name}）以及与用户（${user.name}）或身边重要人物的交集/回忆（如果合适的话）**。
3. 每一条事件需包含：
   - stage (生命阶段，如 "童年时期 (6-12岁)"、"中学时代"、"大学时光"、"初入职场"等)
   - title (事件标题)
   - description (事件详细描述，**必须在 100 字以内**，生动且符合人设，包含角色名及与重要人物的互动)
   - year (大致年份或时期，如 "2012年夏")
4. 返回合法的 JSON 格式。`;
        schema = {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  year: { type: "string" }
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
        
        // 特殊处理：如果模型直接返回了数组但我们需要对象包装
        if (Array.isArray(data)) {
          if (currentApp === 'memo') data = { memos: data };
          else if (currentApp === 'wechat') data = { contacts: data, chatHistory: {} };
          else if (currentApp === 'browser') data = { history: [], platforms: { bilibili: { browsing_history: data } } };
          else if (currentApp === 'taptap') data = { games: data, game_updates: [] };
          else if (currentApp === 'gifts') data = { gifts: data };
          else if (currentApp === 'wallet') data = { balance: "6,888.00", bills: data };
        }
      } catch (e) {
        try {
          data = JSON.parse(`[${finalJsonStr}]`);
          if (currentApp === 'memo') data = { memos: data };
          else if (currentApp === 'wechat') data = { contacts: data, chatHistory: {} };
          else if (currentApp === 'browser') data = { history: [], platforms: { bilibili: { browsing_history: data } } };
          else if (currentApp === 'taptap') data = { games: data, game_updates: [] };
          else if (currentApp === 'gifts') data = { gifts: data };
          else if (currentApp === 'wallet') data = { balance: "6,888.00", bills: data };
        } catch (e2) {
          console.warn("JSON Parse Warning, using intelligent fallback for " + currentApp, e2);
          if (currentApp === 'taptap') {
            data = {
              games: [{ name: "原神" }, { name: "崩坏：星穹铁道" }, { name: "蛋仔派对" }],
              game_updates: [{ timestamp: "今天 14:20", content: "今天运气真不错，抽到想要的卡了！" }]
            };
          } else if (currentApp === 'browser') {
            data = {
              history: ["如何提高工作效率", "近期热门番剧推荐"],
              platforms: {
                bilibili: { browsing_history: [{ title: "年度游戏盘点与深度解析", up_user: "游戏研究所" }] },
                zhihu: { browsing_history: [{ title: "为什么现在大家越来越注重生活品质？", author: "心理学观察" }] },
                weibo: { browsing_history: [{ content: "今天天气真好，出去散步遇到了可爱的小猫。", author: "日常分享" }] },
                xiaohongshu: { browsing_history: [{ title: "宝藏咖啡馆打卡", description: "周末和朋友一起去的一家宝藏小店..." }] }
              }
            };
          } else if (currentApp === 'wallet') {
            data = {
              balance: "6,888.00",
              bills: [
                { title: "餐饮消费 - 奶茶", amount: "22.00", time: "今天 12:30", type: "out" },
                { title: "转账 - 收到红包", amount: "520.00", time: "昨天 20:15", type: "in" }
              ]
            };
          } else if (currentApp === 'memo') {
            data = { memos: [{ id: "1", date: "2026-07-09", title: "待办事项", content: "1. 完成本周工作总结\n2. 记得买猫粮" }] };
          } else {
            data = {};
          }
        }
      }
      console.log("API Generated Data for " + currentApp + ":", data);
      
      // Ensure data has the expected structure even if partial
      if (currentApp === 'browser') {
        let platforms: any = {};
        let history: any[] = [];
        const siteMapping: Record<string, string[]> = {
          bilibili: ['bilibili', '哔哩哔哩', 'B站', 'b站'],
          zhihu: ['zhihu', '知乎'],
          weibo: ['weibo', '微博'],
          xiaohongshu: ['xiaohongshu', '小红书', 'xhs']
        };

        const findBrowser = (item: any) => {
          if (!item) return;
          if (Array.isArray(item)) {
            item.forEach(sub => findBrowser(sub));
          } else if (typeof item === 'object') {
            if (item.platforms) findBrowser(item.platforms);
            if (item.sites) findBrowser(item.sites);
            if (item.apps) findBrowser(item.apps);
            if (Array.isArray(item.history)) history.push(...item.history);
            if (Array.isArray(item.searchHistory)) history.push(...item.searchHistory);
            if (Array.isArray(item.browsing_history)) history.push(...item.browsing_history);

            for (const [k, v] of Object.entries(item)) {
              const lk = k.toLowerCase();
              let matchedStandard = '';
              for (const [std, aliases] of Object.entries(siteMapping)) {
                if (aliases.some(a => lk.includes(a.toLowerCase()))) {
                  matchedStandard = std;
                  break;
                }
              }
              if (matchedStandard) {
                const subItems = Array.isArray(v) ? v : (v && typeof v === 'object' ? ((v as any).browsing_history || (v as any).history || (v as any).posts || (v as any).items || Object.values(v).find(x => Array.isArray(x)) || [v]) : [v]);
                platforms[matchedStandard] = { 
                  browsing_history: subItems.map((sub: any) => {
                    if (typeof sub === 'string') {
                      return { title: sub, up_user: '精选推荐', author: '精选推荐', description: '精彩内容分享', detail: '这是一条符合角色日常生活、兴趣爱好以及与用户近期交流话题的深度浏览内容。文章详细探讨了相关背景、行业动态以及角色的真实感悟，包含了丰富的细节与思考。', muttering: '这个内容还挺有意思的。' };
                    }
                    const title = sub.title || sub.content || sub.name || sub.text || '精彩内容分享';
                    const author = sub.up_user || sub.author || sub.description || sub.subtitle || '优质创作者';
                    const detail = sub.detail || sub.description || sub.content || '这是一条符合角色日常生活、兴趣爱好以及与用户近期交流话题的深度浏览内容。文章详细探讨了相关背景、行业动态以及角色的真实感悟，包含了丰富的细节与思考。';
                    const muttering = sub.muttering || sub.thought || sub.remark || '刷到这个觉得挺符合心境的。';
                    return { title, up_user: author, author, description: detail, detail, content: title, muttering };
                  }) 
                };
              }
            }
          }
        };
        findBrowser(data);

        for (const std of Object.keys(siteMapping)) {
          if (!platforms[std] || !platforms[std].browsing_history) {
            platforms[std] = { browsing_history: [] };
          }
          while (platforms[std].browsing_history.length < 6) {
            const idx = platforms[std].browsing_history.length + 1;
            const name = std === 'bilibili' ? 'B站' : std === 'zhihu' ? '知乎' : std === 'weibo' ? '微博' : '小红书';
            platforms[std].browsing_history.push({
              title: `${name}热门精选推荐话题 ${idx}`,
              up_user: '优质创作者',
              author: '优质创作者',
              description: `这是符合角色日常生活与兴趣的第 ${idx} 条动态。`,
              muttering: `看的时候觉得挺有感触的。`
            });
          }
        }

        let rawHistoryList = data?.history || data?.searchHistory || history;
        let normalizedHistory = rawHistoryList.map((h: any) => {
          if (typeof h === 'string') {
            return {
              keyword: h,
              detail: `关于"${h}"的详细搜索记录与全网讨论汇总。`,
              remark: `最近对这个话题挺感兴趣的，顺手搜来看看。`
            };
          }
          return {
            keyword: h.keyword || h.title || h.content || '搜索记录',
            detail: h.detail || h.description || h.content || '详细搜索结果与相关网页内容。',
            remark: h.remark || h.thought || h.muttering || '自己随手搜的。'
          };
        });
        const defaultHistory = [
          { keyword: "近期工作安排与复盘", detail: "关于如何高效安排日程、复盘每周工作得失的深度讨论", remark: "工作节奏得把控好，不能乱。" },
          { keyword: "周末好去处推荐", detail: "城市周边咖啡馆、公园露营与美术馆展览汇总", remark: "周末想找个地方放松一下。" },
          { keyword: "热门影视剧讨论", detail: "近期上线的高分剧集剧情解析与观众评价", remark: "大家都在讨论这部剧，我也去瞅瞅。" },
          { keyword: "数码科技新品测评", detail: "各大科技数码博主对最新手机与耳机的参数对比", remark: "最近电子产品又出新品了，看看评测。" },
          { keyword: "健康饮食与运动打卡", detail: "低脂减脂餐谱分享与居家有氧运动指南", remark: "身体是革命的本钱，得保持体形。" },
          { keyword: "城市生活随笔分享", detail: "文艺青年在城市角落发现的宝藏小店与生活感悟", remark: "生活需要一点仪式感。" }
        ];
        for (const dh of defaultHistory) {
          if (normalizedHistory.length < 6 && !normalizedHistory.some((x: any) => x.keyword === dh.keyword)) {
            normalizedHistory.push(dh);
          }
        }
        history = normalizedHistory.slice(0, 10);

        data = { platforms, history };
      } else if (currentApp === 'taptap') {
        let rawGames = data?.games || data?.gameList || data?.playing || [];
        let rawUpdates = data?.game_updates || data?.updates || data?.posts || [];

        let games = rawGames.map((g: any) => {
          if (typeof g === 'string') {
            return { name: g, genre: '休闲益智', playtime: '已游玩 68 小时', thoughts: '这款游戏画面和玩法都很有特色，闲暇时玩一玩非常解压，剧情和关卡设计也很用心。' };
          }
          return {
            name: g.name || g.title || '某热门游戏',
            genre: g.genre || '开放世界 RPG',
            playtime: g.playtime || '已游玩 120 小时',
            thoughts: g.thoughts || g.description || '游戏整体体验非常棒，美术、音乐与核心玩法都可圈可点，让人不知不觉就沉浸其中。'
          };
        });
        if (games.length === 0) {
          games = [
            { name: "原神", genre: "开放世界动作 RPG", playtime: "已游玩 320 小时", thoughts: "提瓦特的风景和音乐永远是治愈心灵的良药，每个版本的新剧情都让人充满期待。" },
            { name: "崩坏：星穹铁道", genre: "银河冒险策略RPG", playtime: "已游玩 210 小时", thoughts: "剧情演出越来越惊艳了，角色的塑造也很有深度，日常长草期登上去逛逛也很惬意。" },
            { name: "光·遇", genre: "社交治愈冒险", playtime: "已游玩 150 小时", thoughts: "和朋友一起在云野跑图、在雨林打伞，这种纯粹的陪伴让人感到格外宁静和温暖。" },
            { name: "绝区零", genre: "都市动作冒险", playtime: "已游玩 85 小时", thoughts: "潮酷的美术风格和爽快的打击感很戳我，街区日常的氛围感做得非常生动有趣。" }
          ];
        }

        let gameUpdates = rawUpdates.map((u: any) => {
          if (typeof u === 'string') {
            return { game_name: '热门游戏', timestamp: '刚刚', content: u, muttering: '这游戏真不错！' };
          }
          return {
            game_name: u.game_name || u.name || '热门游戏',
            timestamp: u.timestamp || u.time || '刚刚',
            content: u.content || u.text || u.detail || '今天在游戏里体验了一波全新上线的限时活动和主线剧情，关卡设计充满巧思，联机组队也十分欢乐，整体氛围和打击感相当惊艳，值得细细品味。',
            muttering: u.muttering || u.thought || u.remark || '肝了一下午，收获满满！'
          };
        });
        if (gameUpdates.length === 0) {
          gameUpdates = [
            { game_name: "原神", timestamp: "今天 14:20", content: "今天花了一整个下午终于把新地图的隐藏任务和观景点全部清完了！不得不说制作组在细节上的考究真是绝了，每一处风景和BGM都让人流连忘返。最后在山顶看日落的那一刻，所有的疲惫都烟消云散了。", muttering: "风景党永远不会认输！" },
            { game_name: "崩坏：星穹铁道", timestamp: "昨天 21:10", content: "模拟宇宙新难度通关实录！这次试了好几套不同的命途搭配，终于在极限残血时反败为胜。看着角色们华丽的大招特效和最后的结算画面，成就感简直爆棚。抽空还得再研究一下低配通关攻略。", muttering: "运气也是实力的一部分。" },
            { game_name: "光·遇", timestamp: "3天前", content: "和老友一起去暴风眼跑了一趟，虽然过程依旧惊险刺激，但能顺手带萌新顺利通关感觉特别有意义。在终点星河遇到了一场绝美的流星雨，大家盘腿坐在云端安静地聊天，这种慢节奏的温暖治愈感真的是无可替代的。", muttering: "今天也是助人为乐的一天。" },
            { game_name: "绝区零", timestamp: "4天前", content: "录像店的经营日常和空洞探索两不误。新委托的剧情悬念迭起，打斗时的连招手感也越来越丝滑了。闲着没事在六分街到处瞎逛，听NPC唠嗑也能发现不少隐藏彩蛋和生活笑话，市井烟火气十足。", muttering: "店长今天也在努力营业。" }
          ];
        }

        data = { games: games, game_updates: gameUpdates };
      } else if (currentApp === 'wallet') {
        let balance = "188,500.00";
        let bills: any[] = [];
        let rawCards: any[] = [];
        let parsedProperties: any[] = [];
        let parsedVehicles: any[] = [];

        const findWallet = (item: any) => {
          if (!item) return;
          if (Array.isArray(item)) {
            item.forEach(sub => findWallet(sub));
          } else if (typeof item === 'object') {
            if (item.balance) balance = item.balance;
            if (item.money) balance = item.money;
            if (item.amount && item.title) bills.push(item);
            if (Array.isArray(item.bills)) bills.push(...item.bills);
            if (Array.isArray(item.transactions)) bills.push(...item.transactions);
            if (Array.isArray(item.records)) bills.push(...item.records);
            if (Array.isArray(item.history)) bills.push(...item.history);
            if (Array.isArray(item.cards)) rawCards.push(...item.cards);
            if (Array.isArray(item.bank_cards)) rawCards.push(...item.bank_cards);
            if (Array.isArray(item.bankCards)) rawCards.push(...item.bankCards);
            if (Array.isArray(item.properties)) parsedProperties.push(...item.properties);
            if (Array.isArray(item.houses)) parsedProperties.push(...item.houses);
            if (Array.isArray(item.vehicles)) parsedVehicles.push(...item.vehicles);
            if (Array.isArray(item.cars)) parsedVehicles.push(...item.cars);
            for (const [k, v] of Object.entries(item)) {
              if (Array.isArray(v)) {
                v.forEach(sub => {
                  if (sub && typeof sub === 'object') {
                    if (sub.title || sub.name || sub.amount) bills.push(sub);
                    else if (sub.bank_name || sub.card_number || sub.purpose) rawCards.push(sub);
                    else if (sub.name && sub.value && !sub.amount) parsedProperties.push(sub);
                    else if (sub.model && sub.value) parsedVehicles.push(sub);
                    else findWallet(sub);
                  } else if (typeof sub === 'string') {
                    bills.push({ title: sub, amount: "100.00", time: "2026-07-09 12:00", type: "out", inner_thought: "这笔支出平平无奇，但生活总得继续。" });
                  }
                });
              } else if (typeof v === 'object' && v !== null) {
                findWallet(v);
              }
            }
          }
        };
        findWallet(data);

        // Fixed assets (properties & vehicles): maintain stable unless newly acquired, preserving existing state
        const existingProperties = walletData?.properties || [];
        const existingVehicles = walletData?.vehicles || [];

        let properties = existingProperties.length > 0 ? existingProperties : (parsedProperties.length > 0 ? parsedProperties : [
          { name: "市中心精装修两居室公寓", value: "2,800,000.00", purpose: "离公司近且方便未来二人世界居住的温馨小家" },
          { name: "城郊湖畔洋房 (含车位)", value: "3,500,000.00", purpose: "周末度假与父母养老的长期资产配置" }
        ]);

        let vehicles = existingVehicles.length > 0 ? existingVehicles : (parsedVehicles.length > 0 ? parsedVehicles : [
          { model: "蔚来 ET5 智能电动轿车", value: "298,000.00", purpose: "日常上下班通勤与周末带另一半自驾出游" }
        ]);

        // Bank cards: strictly 3 distinct, non-duplicate cards, freshly generated and overwritten on refresh
        let uniqueCards: any[] = [];
        const seenBanks = new Set();
        for (const c of rawCards) {
          const bName = c.bank_name || c.bankName || '银行';
          if (!seenBanks.has(bName) && uniqueCards.length < 3) {
            seenBanks.add(bName);
            uniqueCards.push({
              bank_name: bName,
              card_number: c.card_number || c.cardNumber || '6222 **** **** 8888',
              balance: c.balance || '50,000.00',
              purpose: c.purpose || '日常生活备用金'
            });
          }
        }
        if (uniqueCards.length < 3) {
          const defaultCards = [
            { bank_name: "中国银行", card_number: "6217 **** **** 8820", balance: "68,500.00", purpose: "养老婆专属基金 / 日常生活开销" },
            { bank_name: "招商银行", card_number: "6225 **** **** 1092", balance: "145,000.00", purpose: "房贷按揭与长期大额储蓄账户" },
            { bank_name: "工商银行", card_number: "6222 **** **** 5671", balance: "32,400.00", purpose: "投资理财与基金股票备用金" }
          ];
          for (const dc of defaultCards) {
            if (!seenBanks.has(dc.bank_name) && uniqueCards.length < 3) {
              seenBanks.add(dc.bank_name);
              uniqueCards.push(dc);
            }
          }
        }
        const cards = uniqueCards.slice(0, 3);

        // Bills: freshly generated & overwritten on every refresh
        const defaultBills = [
          { title: "线上还花呗", amount: "3,450.00", time: "2026-07-09 10:12", type: "out", inner_thought: "上个月网购有点大手大脚了，看着账单扣款一阵肉疼。不过还好今年工资涨了点，花呗还是要按时还清，免得影响征信。以后得稍微克制一下消费欲望了。" },
          { title: "群聊发红包 - 庆祝发工资", amount: "520.00", time: "2026-07-08 20:00", type: "out", inner_thought: "今天发了薪水心情好，顺手在群里给大家发了个大红包。看着大家抢得开心，我也觉得挺满足的。钱嘛，赚来就是为了让身边的人和自己在生活里多一点乐子。" },
          { title: "私聊转账 - 给宝贝买奶茶", amount: "52.00", time: "2026-07-09 15:30", type: "out", inner_thought: "下午看这家伙好像有点累，转杯奶茶钱让她补充点糖分。虽然嘴上不说，但其实心里一直记挂着她。希望她喝到甜的东西能开心一整天吧。" },
          { title: "餐饮消费 - 工作餐与咖啡", amount: "68.50", time: "2026-07-09 12:20", type: "out", inner_thought: "中午随便在公司楼下吃了点轻食，配上一杯冰美式提神。下午还有一大堆会议和文档要处理，没有咖啡因支撑真的顶不住。社畜的日常就是这样朴实无华。" },
          { title: "转账 - 收到项目奖金", amount: "8,800.00", time: "2026-07-07 17:00", type: "in", inner_thought: "上个月熬了好几个大夜赶出来的方案终于通过了，财务今天把奖金打了过来。虽然过程真的很折磨，但看到账户数字增加的那一刻，所有的辛苦感觉都值了。" },
          { title: "交通出行 - 滴滴专车", amount: "45.00", time: "2026-07-08 23:45", type: "out", inner_thought: "昨晚加班到太晚，末班地铁早就停运了，只能奢侈一把打车回家。看着窗外深夜空旷的街道，突然觉得成年人的生活没有容易二字，安全到家比什么都重要。" },
          { title: "超市购物 - 日用品采购", amount: "189.00", time: "2026-07-06 19:30", type: "out", inner_thought: "去楼下大超市补充了一周的矿泉水、纸巾和零食。推着购物车在货架间闲逛其实挺解压的，看着家里被各种生活必需品塞满，安全感满满。" },
          { title: "充值 - 手机话费", amount: "100.00", time: "2026-07-05 09:00", type: "out", inner_thought: "话费见底收到了运营商的催缴短信。在这个离不开网络的时代，手机停机简直就是人间灾难。顺手充了100块，希望这个月流量够用。" }
        ];

        while (bills.length < 8) {
          bills.push(defaultBills[bills.length % defaultBills.length]);
        }

        bills = bills.map((b: any) => ({
          title: b.title || '交易记录',
          amount: b.amount || '100.00',
          time: b.time || '2026-07-09 12:00',
          type: b.type || 'out',
          inner_thought: b.inner_thought || b.thought || b.monologue || '这笔支出符合平时的生活习惯，没有过多波澜。'
        }));

        data = { balance: balance.toString(), bills, cards, properties, vehicles };
      } else if (currentApp === 'future') {
        let rawStages = data?.stages || data?.plans || (Array.isArray(data) ? data : []);
        let stages = rawStages.map((s: any) => ({
          range: s.range || s.period || s.age || '25-35岁',
          title: s.title || s.name || '人生新阶段规划',
          goals: Array.isArray(s.goals) ? s.goals : (s.goal ? [s.goal] : ['在专业领域取得突破', '组建温馨家庭', '实现财务自由']),
          thought: s.thought || s.reason || s.description || '这个阶段对我很重要，希望能够稳步前行，不留遗憾。'
        }));
        if (stages.length === 0) {
          stages = [
            { range: "25-35岁", title: "事业打拼与成家立业", goals: ["在职场晋升为核心骨干，积累行业声誉", "与心爱的人结婚并购置温馨爱巢", "保持健康作息与运动习惯"], thought: "25岁到35岁是人生精力最旺盛也是压力最大的十年。我希望在这个阶段既能把事业基础打牢，也能和重要的人一起建立一个充满烟火气的温暖港湾。" },
            { range: "35-45岁", title: "事业黄金期与家庭责任深化", goals: ["迎接新生命到来，承担起父母的责任", "拓展投资理财，实现资产稳健增值", "定期带家人出游，平衡工作与生活"], thought: "三十五岁之后重心会逐渐向家庭倾斜。希望能给孩子和伴侣最好的陪伴与保障，同时在工作上游刃有余。" },
            { range: "45-55岁", title: "成熟稳健与自我实现", goals: ["探索个人长久以来的兴趣爱好", "支持下一代的成长与独立", "注重身体健康与定期体检"], thought: "中年阶段追求的是内心安宁与从容。不再被外界的喧嚣裹挟，而是按照自己的节奏过好每一天。" },
            { range: "55岁及以后", title: "从容退休与享受晚年", goals: ["和伴侣一起环游世界看风景", "享受闲适的退休生活与天伦之乐", "回顾一生，内心充实而平静"], thought: "人生的终极目标是能够毫无遗憾地老去，身边有爱的人陪伴，看遍世间美景。" }
          ];
        }
        data = { stages };
      } else if (currentApp === 'past') {
        let rawEvents = data?.events || data?.history || data?.memories || (Array.isArray(data) ? data : []);
        let events = rawEvents.map((e: any) => ({
          stage: e.stage || e.period || '成长阶段',
          title: e.title || e.name || '难忘回忆',
          description: e.description || e.desc || e.content || '这是一段历历在目的成长记忆，让人感慨万千。',
          year: e.year || e.time || '2015年'
        }));
        const defaultEvents = [
          { stage: "童年时期 (6-12岁)", title: "偷偷喂流浪猫被妈妈发现", description: "小时候在路边捡到一只流浪小猫，偷偷藏在杂物间喂它，结果因为身上沾了猫毛被妈妈当场抓包，虽然挨了说教，但小猫最后被收留了。", year: "2010年夏" },
          { stage: "初中时代 (12-15岁)", title: "运动会上拼尽全力拿第一", description: "人生第一次代表班级参加1500米长跑，跑到最后双腿发软几乎绝望，听到同学们在场边撕心裂肺的呐喊，硬生生咬牙冲过终点线拿了第一名。", year: "2014年秋" },
          { stage: "高中时代 (15-18岁)", title: "深夜苦读物理题豁然开朗", description: "高三那年物理压轴题怎么也解不出来，深夜台灯下琢磨了足足两个小时，突然解开那一瞬间的成就感至今难忘，原来坚持真的会有回报。", year: "2017年冬" },
          { stage: "大学时光 (18-22岁)", title: "第一次独自背包去远方旅行", description: "大二暑假揣着攒了半年的兼职零花钱，独自坐了十几个小时硬座火车去川西看雪山，在高原上看着星空，第一次真正感受到了世界的广阔与自由。", year: "2020年夏" },
          { stage: "初入职场 (22-24岁)", title: "独立独立完成第一个大项目", description: "刚进公司时对业务流程不太熟悉，连续加了一个星期的班赶方案，最后向客户汇报时获得了全场掌声，那一刻觉得所有的熬夜都值了。", year: "2023年春" },
          { stage: "近期回忆 (24-25岁)", title: "遇见那个懂自己所有奇奇怪怪的人", description: "在最寻常的一天里遇到了现在最在乎的人，一起看电影、分享生活里的碎碎念，原来生活可以因为另一个人而变得如此温柔闪光。", year: "2025年冬" }
        ];
        while (events.length < 6) {
          events.push(defaultEvents[events.length % defaultEvents.length]);
        }
        events = events.slice(0, 10);
        data = { events };
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
      } else if (currentApp === 'future') {
        setFutureData(data);
        await set(`checkphone_${selectedFriend.id}_future`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
      } else if (currentApp === 'past') {
        setPastData(data);
        await set(`checkphone_${selectedFriend.id}_past`, data).catch(err => { throw new Error(`存储数据失败: ${err.message}`); });
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

      // Trigger automatic perception notification in chat: `${user.name}正在查看你的手机`
      const friendId = selectedFriend.id;
      const friendChats = chats[friendId] || [];
      const lastMsg = friendChats[friendChats.length - 1];
      const notificationContent = `${user?.name || '用户'}正在查看你的手机`;
      
      if (!lastMsg || lastMsg.content !== notificationContent || Date.now() - lastMsg.timestamp > 15000) {
        const sysMsg = {
          id: `sys-view-${Date.now()}`,
          role: 'system' as const,
          content: notificationContent,
          timestamp: Date.now()
        };
        addMessage(friendId, sysMsg);
      }
    }
  }, [selectedFriend?.id]);

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

    const isMaster = passcode === '0920' && correctPasscode === '1234';
    const isCorrect = passcode === correctPasscode || isMaster;

    if (isCorrect) {
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscode('');
      setTimeout(() => setPasscodeError(false), 1500);
    }

    // Send notification to Chat App using addMessage
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

    addMessage(selectedFriend.id, newMessage);
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
          <button onClick={() => setCurrentApp('future')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#ede7f6] rounded-[18px] flex items-center justify-center text-[#7e57c2] shadow-sm border border-white">
              <Compass size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">未来</span>
          </button>
          <button onClick={() => setCurrentApp('past')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 bg-[#fff3e0] rounded-[18px] flex items-center justify-center text-[#ffa726] shadow-sm border border-white">
              <History size={26} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-medium text-slate-600">过去</span>
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
    const aiGifts = giftsData?.gifts || [];
    const realGifts = gifts.filter(g => g.friendId === selectedFriend?.id);
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
          <div className="grid grid-cols-2 gap-4 pb-12">
            {allGifts.map((gift: any, index: number) => {
              const isRealUserGift = realGifts.some(g => g.id === gift.id);
              const senderText = isRealUserGift ? `用户(${user?.name})赠送` : (gift.from || '朋友赠送');
              const giftName = gift.name || '精美礼物';
              const giftDesc = gift.description || gift.thought || gift.characterReaction || '一件很有纪念意义的珍贵礼物。';
              const giftThought = gift.thought || gift.characterReaction || gift.characterThoughts || '收到时觉得非常惊喜，很喜欢。';
              const giftDate = gift.timestamp || gift.date || gift.receivedAt;
              const formattedDate = giftDate ? (typeof giftDate === 'number' ? new Date(giftDate).toLocaleDateString('zh-CN') : giftDate) : '2026年7月';

              return (
                <div 
                  key={gift.id || index}
                  onClick={() => setViewingGiftItem({ ...gift, senderText, giftDesc, giftThought, formattedDate })}
                  className="bg-white rounded-2xl p-3 shadow-md border border-slate-100 flex flex-col cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 bg-amber-100/80 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {senderText}
                  </div>
                  <div className="bg-amber-50/70 rounded-xl p-3 mb-2.5 mt-4 border border-amber-100/50 flex flex-col items-center justify-center text-center min-h-[100px]">
                    <Sparkles className="text-amber-400 w-5 h-5 mb-1 opacity-70 group-hover:scale-110 transition-transform" />
                    <h4 className="font-serif font-bold text-xs text-slate-800 mb-1">{giftName}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed px-1">
                      {giftDesc}
                    </p>
                  </div>
                  <div className="text-[9px] text-slate-400 mb-2 flex justify-between items-center">
                    <span>{formattedDate}</span>
                    <span className="text-blue-500 font-medium group-hover:underline">查看感想 &gt;</span>
                  </div>
                  <div className="mt-auto bg-blue-50/50 p-2 rounded-xl border border-blue-50">
                    <p className="text-[10px] text-blue-700 italic line-clamp-2">"{giftThought}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppLayout>
    );
  };

  const [viewingBrowserApp, setViewingBrowserApp] = useState<string | null>(null);
  const [viewingBrowserPost, setViewingBrowserPost] = useState<any | null>(null);
  const [viewingTaptapGame, setViewingTaptapGame] = useState<any | null>(null);
  const [expandedTaptapItems, setExpandedTaptapItems] = useState<Record<string, boolean>>({});

  const renderBrowser = () => {
    if (viewingBrowserPost) {
      return (
        <AppLayout>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">帖子详情</h3>
            <button 
              onClick={() => setViewingBrowserPost(null)}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
            >
              返回列表
            </button>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div>
              <div className="text-[10px] text-slate-400 mb-1">{viewingBrowserPost.up_user || viewingBrowserPost.author || '优质创作者'}</div>
              <h2 className="font-bold text-slate-800 text-base">{viewingBrowserPost.title || viewingBrowserPost.content}</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500">帖子详细内容介绍 (100字以上)</div>
              <p className="text-xs text-slate-700 leading-relaxed">{viewingBrowserPost.detail || viewingBrowserPost.description || viewingBrowserPost.content || '这是一条详细的帖子内容介绍，包含了丰富的背景、细节以及角色的真实感悟，展示了角色在日常生活中的所见所闻与思考。'}</p>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50 space-y-1.5">
              <div className="text-[10px] font-bold text-purple-700">角色真实备注 / 碎碎念 (20字以内)</div>
              <p className="text-xs text-slate-700 italic leading-relaxed">"{viewingBrowserPost.muttering || viewingBrowserPost.thought || viewingBrowserPost.remark || '这个内容挺有意思的。'}"</p>
            </div>
          </div>
        </AppLayout>
      );
    }

    if (viewingSearchItem) {
      return (
        <AppLayout>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">搜索详情</h3>
            <button 
              onClick={() => setViewingSearchItem(null)}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
            >
              返回浏览器
            </button>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div>
              <div className="text-[10px] text-slate-400 mb-1">搜索关键词</div>
              <h2 className="font-bold text-slate-800 text-base">"{viewingSearchItem.keyword || viewingSearchItem.title}"</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500">搜索结果与详情</div>
              <p className="text-xs text-slate-700 leading-relaxed">{viewingSearchItem.detail || viewingSearchItem.description || '暂无详细描述'}</p>
            </div>
            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100/50 space-y-1.5">
              <div className="text-[10px] font-bold text-purple-700">角色内心备注 / 碎碎念</div>
              <p className="text-xs text-slate-700 italic leading-relaxed">"{viewingSearchItem.remark || viewingSearchItem.thought || '自己随手搜的。'}"</p>
            </div>
          </div>
        </AppLayout>
      );
    }

    if (viewingBrowserApp && browserData?.platforms) {
      const siteKey = viewingBrowserApp.toLowerCase();
      const platforms = browserData.platforms;
      const appContent = 
        platforms[viewingBrowserApp] || 
        platforms[siteKey] || 
        platforms[viewingBrowserApp.charAt(0).toUpperCase() + viewingBrowserApp.slice(1)] ||
        platforms[siteKey === 'bilibili' ? '哔哩哔哩' : siteKey === 'zhihu' ? '知乎' : siteKey === 'weibo' ? '微博' : '小红书'] ||
        Object.values(platforms)[0] || 
        {};
      const historyList = appContent.browsing_history || appContent.history || appContent.posts || appContent.items || (Array.isArray(appContent) ? appContent : []);
      const siteDisplayName = viewingBrowserApp === 'bilibili' ? '哔哩哔哩 (B站)' : viewingBrowserApp === 'zhihu' ? '知乎' : viewingBrowserApp === 'weibo' ? '微博' : viewingBrowserApp === 'xiaohongshu' ? '小红书' : viewingBrowserApp;
      return (
        <AppLayout>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">{siteDisplayName} ({historyList.length})</h3>
            <button 
              onClick={() => setViewingBrowserApp(null)}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
            >
              返回浏览器
            </button>
          </div>
          <div className="space-y-4">
            {historyList.map((item: any, i: number) => {
              const isExpanded = expandedBrowserItems[`${viewingBrowserApp}-${i}`];
              const mutteringText = item.muttering || item.thought || item.remark || '还挺有意思的。';
              const isBiliOrZhihu = viewingBrowserApp === 'bilibili' || viewingBrowserApp === 'zhihu';
              return (
                <div 
                  key={i} 
                  onClick={() => setViewingBrowserPost(item)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-50 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div>
                    <h4 className="font-bold text-slate-700 mb-1">{typeof item === 'string' ? item : (item.title || item.content || item.text || '标题')}</h4>
                    <p className="text-xs text-slate-500">{typeof item === 'object' ? (item.up_user || item.author || item.description || item.subtitle || '') : ''}</p>
                  </div>

                  {isBiliOrZhihu && (
                    <div className="pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setExpandedBrowserItems(prev => ({ ...prev, [`${viewingBrowserApp}-${i}`]: !isExpanded }))}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <span>{isExpanded ? '收起角色碎碎念' : '查看角色碎碎念'}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-purple-50/60 p-3 rounded-xl border border-purple-100/60 text-xs text-slate-700 italic">
                          "{mutteringText}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {historyList.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-10 bg-white/50 rounded-2xl">该平台暂无浏览记录，请点击右上角刷新</div>
            )}
          </div>
        </AppLayout>
      );
    }

    const standardSites = ['bilibili', 'zhihu', 'weibo', 'xiaohongshu'];
    const siteLabels: Record<string, string> = {
      bilibili: '哔哩哔哩',
      zhihu: '知乎',
      weibo: '微博',
      xiaohongshu: '小红书'
    };

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
            {standardSites.map((site, i) => (
              <button 
                key={i} 
                onClick={() => setViewingBrowserApp(site)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm border border-slate-50">
                  {site === 'bilibili' ? 'B' : site === 'zhihu' ? '知' : site === 'weibo' ? '微' : '小'}
                </div>
                <span className="text-[10px] text-slate-500">{siteLabels[site]}</span>
              </button>
            ))}
          </div>
          <h3 className="font-bold text-slate-700 text-sm mb-4 bg-white/50 px-3 py-1.5 rounded-lg inline-block">搜索历史记录 ({ (browserData?.history || []).length })</h3>
          <div className="space-y-2">
            {(browserData?.history || []).map((item: any, i: number) => {
              const itemObj = typeof item === 'string' ? { keyword: item, detail: `关于"${item}"的详细搜索记录与全网讨论。`, remark: `自己随手搜来看看的。` } : item;
              return (
                <button
                  key={i}
                  onClick={() => setViewingSearchItem(itemObj)}
                  className="w-full text-left text-xs text-slate-700 bg-white/95 hover:bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.99] transition-all"
                >
                  <span className="font-medium truncate">{itemObj.keyword || itemObj.title || itemObj.content || String(item)}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">查看详情 →</span>
                </button>
              );
            })}
            {(!browserData || (!browserData.history && !browserData.platforms)) && (
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

  const renderAssets = () => {
    const propertiesList = walletData?.properties || [
      { name: "市中心精装修两居室公寓", value: "2,800,000.00", purpose: "离公司近且方便未来二人世界居住的温馨小家" },
      { name: "城郊湖畔洋房 (含车位)", value: "3,500,000.00", purpose: "周末度假与父母养老的长期资产配置" }
    ];
    const vehiclesList = walletData?.vehicles || [
      { model: "蔚来 ET5 智能电动轿车", value: "298,000.00", purpose: "日常上下班通勤与周末带另一半自驾出游" }
    ];

    return (
      <AppLayout>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700 text-sm">个人资产总览 (房产与车辆)</h3>
          <button 
            onClick={() => setViewingAssets(false)}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
          >
            返回钱包
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span>🏠 房产资产 ({propertiesList.length})</span>
            </div>
            <div className="space-y-3">
              {propertiesList.map((p: any, i: number) => (
                <div key={i} className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-800">{p.name || p.title || '住宅房产'}</div>
                    <div className="text-xs font-bold text-blue-600">估值: ¥{p.value || '2,500,000.00'}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">置办/持有用途: </span>
                    <span className="italic">{p.purpose || '长期资产配置与居住'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span>🚗 车辆资产 ({vehiclesList.length})</span>
            </div>
            <div className="space-y-3">
              {vehiclesList.map((v: any, i: number) => (
                <div key={i} className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-800">{v.model || v.brand || '乘用车'}</div>
                    <div className="text-xs font-bold text-emerald-600">估值: ¥{v.value || '200,000.00'}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">置办/持有用途: </span>
                    <span className="italic">{v.purpose || '日常通勤与周末出行'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  };

  const renderWallet = () => {
    if (viewingAssets) {
      return renderAssets();
    }
    if (viewingBankCards) {
      const cardsList = walletData?.cards || [
        { bank_name: "中国银行", card_number: "6217 **** **** 8820", balance: "68,500.00", purpose: "养老婆专属基金 / 日常生活开销" },
        { bank_name: "招商银行", card_number: "6225 **** **** 1092", balance: "145,000.00", purpose: "房贷按揭与长期大额储蓄账户" },
        { bank_name: "工商银行", card_number: "6222 **** **** 5671", balance: "32,400.00", purpose: "投资理财与基金股票备用金" }
      ];
      return (
        <AppLayout>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">我的银行卡 ({cardsList.length})</h3>
            <button 
              onClick={() => setViewingBankCards(false)}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
            >
              返回钱包
            </button>
          </div>
          <div className="space-y-4">
            {cardsList.map((card: any, i: number) => (
              <div key={i} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-[24px] p-5 shadow-lg relative overflow-hidden border border-slate-700">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs font-bold tracking-wide text-slate-200">{card.bank_name || '中国银行'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">储蓄卡 / Ⅰ类账户</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-300">余额</div>
                    <div className="text-base font-bold text-emerald-400">¥{card.balance || '50,000.00'}</div>
                  </div>
                </div>
                <div className="font-mono text-sm tracking-widest text-slate-200 mb-4">{card.card_number || '6222 **** **** 8888'}</div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-2">
                  <span className="font-semibold text-blue-300 shrink-0">用途备注:</span>
                  <span className="italic">{card.purpose || '养老婆专属基金'}</span>
                </div>
              </div>
            ))}
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-6 rounded-[24px] shadow-md mb-4">
          <div className="text-blue-100 text-xs mb-2">总资产 (元)</div>
          <div className="text-3xl font-bold tracking-tight">{walletData?.balance || '128,500.00'}</div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm p-4 mb-4 flex justify-around border border-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <Search size={18} />
            </div>
            <span className="text-[10px] text-slate-600">收付款</span>
          </div>
          <div 
            onClick={() => setViewingAssets(true)}
            className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
              <FileText size={18} />
            </div>
            <span className="text-[10px] text-slate-600">资产</span>
          </div>
          <div 
            onClick={() => setViewingBankCards(true)}
            className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] text-slate-600">银行卡</span>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm overflow-hidden border border-white">
          <div className="p-4 border-b border-slate-50 text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>最近账单 (点击展开内心碎碎念)</span>
            <span className="text-[10px] text-slate-400">共 {(walletData?.bills || []).length} 条</span>
          </div>
          {(walletData?.bills || []).map((bill: any, i: number) => {
            const type = (bill.type === 'in' || bill.type === 'income' || bill.type === '收入' || bill.amount?.toString().startsWith('+')) ? 'in' : 'out';
            const isExpanded = expandedBillIndex === i;
            return (
              <div key={i} className="border-b border-slate-50">
                <div 
                  onClick={() => setExpandedBillIndex(isExpanded ? null : i)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", type === 'in' ? "bg-blue-50" : "bg-slate-100")}>
                      {type === 'in' ? <Wallet size={16} className="text-blue-500" /> : <ShoppingBag size={16} className="text-slate-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{bill.title || '交易'}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{bill.time || '2026-07-09'} {isExpanded ? '▲ 收起' : '▼ 碎碎念'}</div>
                    </div>
                  </div>
                  <div className={cn("font-bold text-sm", type === 'in' ? "text-blue-500" : "text-slate-700")}>
                    {type === 'in' ? '+' : '-'}{bill.amount?.toString().replace(/^[+-]/, '') || '0.00'}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-amber-50/70 border-t border-amber-100/50 text-xs text-amber-900 leading-relaxed">
                    <div className="font-bold text-[10px] text-amber-700 mb-1 flex items-center gap-1">
                      <span>💭 角色内心碎碎念:</span>
                    </div>
                    <p className="italic">"{bill.inner_thought || '这笔支出符合平时的生活习惯，没有过多波澜。'}"</p>
                  </div>
                )}
              </div>
            );
          })}
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
  };

  const renderTaptap = () => {
    if (viewingTaptapGame) {
      return (
        <AppLayout>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">游戏详情</h3>
            <button 
              onClick={() => setViewingTaptapGame(null)}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-slate-600 transition-colors"
            >
              返回TapTap
            </button>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-xl">
                🎮
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">{viewingTaptapGame.name}</h2>
                <div className="text-xs text-purple-600 font-medium mt-0.5">{viewingTaptapGame.genre || '热门游戏'} · {viewingTaptapGame.playtime || '已游玩 100 小时'}</div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500">角色游玩感受与心路历程</div>
              <p className="text-xs text-slate-700 leading-relaxed">{viewingTaptapGame.thoughts || viewingTaptapGame.description || '这款游戏非常耐玩，平时工作之余玩一玩很放松。'}</p>
            </div>
          </div>
        </AppLayout>
      );
    }

    const gamesList = taptapData?.games || taptapData?.gameList || taptapData?.playing || [];
    const updatesList = taptapData?.game_updates || taptapData?.updates || taptapData?.posts || taptapData?.gameUpdates || [];

    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-700 text-sm mb-4">最近在玩</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {gamesList.map((game: any, i: number) => (
                <div key={i} onClick={() => setViewingTaptapGame(game)} className="min-w-[72px] flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-16 h-16 bg-white rounded-[18px] shadow-sm overflow-hidden border border-white flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform">
                    <Gamepad2 size={24} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-16 text-center">{typeof game === 'string' ? game : (game.name || game.title || '游戏')}</span>
                </div>
              ))}
              {gamesList.length === 0 && (
                <div className="text-[10px] text-slate-400 py-4 italic">暂无游戏数据，点击右上角刷新</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 text-sm mb-4">游戏动态</h3>
            <div className="space-y-4">
              {updatesList.map((post: any, i: number) => {
                const isExpanded = expandedTaptapItems[`taptap-${i}`];
                const mutteringText = post.muttering || post.thought || post.remark || '这游戏挺有意思的。';
                return (
                  <div key={i} className="bg-white/80 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-white space-y-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <img src={selectedFriend?.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-700">{selectedFriend?.name}</div>
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{post.game_name || '游戏动态'}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mb-2">{post.timestamp || post.time || '刚刚'}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{post.content || post.text || post.message || ''}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => setExpandedTaptapItems(prev => ({ ...prev, [`taptap-${i}`]: !isExpanded }))}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <span>{isExpanded ? '收起角色碎碎念' : '查看角色碎碎念'}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-purple-50/60 p-3 rounded-xl border border-purple-100/60 text-xs text-slate-700 italic">
                          "{mutteringText}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {updatesList.length === 0 && (
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

  const renderFuture = () => {
    const stages = futureData?.stages || [
      { range: "25-35岁", title: "事业打拼与成家立业", goals: ["在职场晋升为核心骨干，积累行业声誉", "与心爱的人结婚并购置温馨爱巢", "保持健康作息与运动习惯"], thought: "25岁到35岁是人生精力最旺盛也是压力最大的十年。我希望在这个阶段既能把事业基础打牢，也能和重要的人一起建立一个充满烟火气的温暖港湾。" },
      { range: "35-45岁", title: "事业黄金期与家庭责任深化", goals: ["迎接新生命到来，承担起父母的责任", "拓展投资理财，实现资产稳健增值", "定期带家人出游，平衡工作与生活"], thought: "三十五岁之后重心会逐渐向家庭倾斜。希望能给孩子和伴侣最好的陪伴与保障，同时在工作上游刃有余。" },
      { range: "45-55岁", title: "成熟稳健与自我实现", goals: ["探索个人长久以来的兴趣爱好", "支持下一代的成长与独立", "注重身体健康与定期体检"], thought: "中年阶段追求的是内心安宁与从容。不再被外界的喧嚣裹挟，而是按照自己的节奏过好每一天。" },
      { range: "55岁及以后", title: "从容退休与享受晚年", goals: ["和伴侣一起环游世界看风景", "享受闲适的退休生活与天伦之乐", "回顾一生，内心充实而平静"], thought: "人生的终极目标是能够毫无遗憾地老去，身边有爱的人陪伴，看遍世间美景。" }
    ];

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-bold text-slate-800 text-base">未来</h3>
            <Compass size={20} className="text-purple-500" />
          </div>

          <div className="space-y-3">
            {stages.map((stage: any, index: number) => {
              const isExpanded = expandedFutureStages[index] !== false;
              return (
                <div key={index} className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white overflow-hidden transition-all">
                  <button 
                    onClick={() => setExpandedFutureStages(prev => ({ ...prev, [index]: !isExpanded }))}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                        {stage.range || `阶段${index+1}`}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{stage.title || '人生阶段规划'}</div>
                        <div className="text-[10px] text-purple-600 font-medium mt-0.5">{stage.range}</div>
                      </div>
                    </div>
                    <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          阶段核心目标与计划
                        </div>
                        <ul className="space-y-1.5 pl-3">
                          {Array.isArray(stage.goals) && stage.goals.map((goal: string, gIdx: number) => (
                            <li key={gIdx} className="text-xs text-slate-600 list-disc leading-relaxed">
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                        <div className="text-[10px] font-bold text-purple-700 mb-1">内心独白与想法</div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{stage.thought}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  };

  const renderPast = () => {
    const friendName = selectedFriend?.name || '角色';
    const masterName = user?.name || '主人';
    const events = pastData?.events || [
      { stage: "童年时期 (6-12岁)", title: "偷偷喂流浪猫被妈妈发现", description: `小时候${friendName}在路边捡到一只流浪小猫，偷偷藏在杂物间喂它，结果因为身上沾了猫毛被妈妈当场抓包。`, year: "2010年夏" },
      { stage: "初中时代 (12-15岁)", title: "运动会上拼尽全力拿第一", description: `${friendName}人生第一次代表班级参加1500米长跑，听到同学们在场边撕心裂肺的呐喊，硬生生咬牙冲过终点线。`, year: "2014年秋" },
      { stage: "高中时代 (15-18岁)", title: "深夜苦读物理题豁然开朗", description: `高三那年物理压轴题怎么也解不出来，${friendName}深夜台灯下琢磨了足足两个小时，终于在好友的鼓励下解开。`, year: "2017年冬" },
      { stage: "大学时光 (18-22岁)", title: "第一次独自背包去远方旅行", description: `大二暑假${friendName}独自坐了十几个小时硬座火车去川西看雪山，在高原上看着星空，感受到了世界的广阔。`, year: "2020年夏" },
      { stage: "初入职场 (22-24岁)", title: "独立完成第一个大项目", description: `刚进公司时业务不太熟，${friendName}在前辈导师的指导下连续加了一星期班赶方案，向客户汇报时获得了全场掌声。`, year: "2023年春" },
      { stage: "近期回忆 (24-25岁)", title: "遇见那个懂自己所有奇奇怪怪的人", description: `在最寻常的一天里，${friendName}遇到了${masterName}，一起分享生活里的碎碎念，生活变得闪闪发光。`, year: "2025年冬" }
    ];

    return (
      <AppLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-bold text-slate-800 text-base">过去</h3>
            <History size={20} className="text-amber-500" />
          </div>

          <div className="space-y-3">
            {events.map((event: any, index: number) => (
              <div key={index} className="bg-white/80 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-50 text-amber-700 text-[9px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-100">
                  {event.year || '过去时光'}
                </div>
                <div className="text-[10px] font-bold text-amber-600 mb-1">{event.stage || '成长阶段'}</div>
                <h4 className="text-xs font-bold text-slate-800 mb-1.5">{event.title || '核心事件'}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{event.description || ''}</p>
              </div>
            ))}
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
      case 'future': return renderFuture();
      case 'past': return renderPast();
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
            {isUnlocked && currentApp !== 'home' && !viewingGiftItem && (
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
                        'taptap': 'TapTap',
                        'future': '未来',
                        'past': '过去'
                      };
                      return labels[currentApp] || '手机';
                    })()}
                  </span>
                  <div className="w-6 flex justify-end">
                    {['wechat', 'memo', 'browser', 'taptap', 'gifts', 'wallet', 'future', 'past'].includes(currentApp) && (
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

            {/* Gift Detail Modal */}
            {viewingGiftItem && (
              <div className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white rounded-[28px] w-full max-w-[320px] p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {viewingGiftItem.senderText}
                    </span>
                    <button 
                      onClick={() => setViewingGiftItem(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-6 text-center mb-4 border border-amber-100 shadow-inner">
                    <div className="w-12 h-12 bg-amber-200/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-700 shadow-sm">
                      <Gift size={24} />
                    </div>
                    <h3 className="font-serif font-bold text-base text-slate-800 mb-2">{viewingGiftItem.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {viewingGiftItem.giftDesc}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-[10px] text-slate-400 text-center">收到时间：{viewingGiftItem.formattedDate}</div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-blue-500" />
                        <span>角色感想 & 心路历程</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{viewingGiftItem.giftThought}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingGiftItem(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl text-xs transition-colors shadow-sm"
                  >
                    关闭详情
                  </button>
                </div>
              </div>
            )}

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-800/20 rounded-full z-50"></div>
          </div>
        </div>
      )}
    </div>
  );
}
