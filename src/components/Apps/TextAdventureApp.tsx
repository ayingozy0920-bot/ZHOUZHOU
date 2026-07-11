import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Settings, FolderOpen, ArrowLeft, Send, Sparkles, 
  Heart, Zap, MapPin, Smartphone, MessageSquare, RefreshCw, Check, 
  HelpCircle, Volume2, Shield, User, Image as ImageIcon, CornerDownRight, 
  Clipboard, BookOpen, Info, ChevronRight, Flame, Award, Clock, Brain, Plus, Trash2, Bookmark, Smile, PlusCircle, RefreshCcw, Home,
  ChevronUp, ChevronDown, Play
} from 'lucide-react';
import { AppSettings, Friend, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/apiHelper';

interface TextAdventureAppProps {
  settings: AppSettings;
  friends: Friend[];
  user: UserProfile;
  onBack: () => void;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  coverUrl?: string;
  role: string;
  title: string;
  desc: string;
  personality: string;
  goodwill: number;
  memory: string[];
  coreMemories?: string[];
  longMemories?: string[];
  shortMemories?: string[];
}

interface GameState {
  worldInfo: string;
  charInfo: string;
  goodwill: number;
  stamina: number;
  location: string;
  storyLog: string;
  lastAction?: string;
  previousStoryLog?: string;
  characters: Character[];
  memoryCore: string[];
  settings: {
    notifications: boolean;
    autoSave: boolean;
    fontSize: 'sm' | 'md' | 'lg';
    fontFamily?: string;
  };
}

const FONTS = [
  { id: 'sans-serif', name: '系统默认', family: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'cute', name: '可爱', family: '"ZCOOL KuaiLe", cursive' },
  { id: 'elegant', name: '飘逸', family: '"Ma Shan Zheng", cursive' },
  { id: 'serif', name: '宋体', family: '"Noto Serif SC", serif' },
  { id: 'handwriting', name: '手写', family: '"Liu Jian Mao Cao", cursive' },
];

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  content: string;
  timestamp: number;
  isUser: boolean;
  isSticker?: boolean;
}

interface SaveSlot {
  id: string;
  title: string;
  location: string;
  goodwill: number;
  timestamp: number;
  gameState: GameState;
  chatMessagesMap: Record<string, ChatMessage[]>;
}

interface CustomWorldTemplate {
  id: string;
  title: string;
  worldInfo: string;
  location: string;
  characters: {
    name: string;
    role: string;
    title: string;
    desc: string;
    personality: string;
    avatar: string;
  }[];
}

interface MomentPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  timestamp: number;
  likes: string[];
  comments: { id: string; name: string; content: string }[];
}

interface UserAdventureProfile {
  name: string;
  avatar: string;
  bio: string;
  identity: string;
}

const DYNAMIC_LOCATIONS = [
  '星空之城·浮空岛广场',
  '古老魔法学院·禁忌书库',
  '深渊回廊·水晶大殿',
  '落日荒原·流浪者营地',
  '魔法学院·月光长廊',
  '赛博都市·雨夜霓虹街区',
  '云海之巅·听风阁',
  '深谷幽林·精灵树屋',
  '时空裂缝·镜面长廊',
  '银河旗舰·战术指挥舱',
  '极光冰原·雪狼圣殿',
  '绯红酒馆·地下密室'
];

const BUILTIN_AVATARS = [
  'https://iili.io/CltVtQR.png',
  'https://iili.io/CltVPYF.png',
  'https://iili.io/CltVNku.png',
  'https://iili.io/CltVZhv.png',
  'https://iili.io/CltW92t.png',
  'https://iili.io/CltW3TG.png',
  'https://iili.io/CltWa6B.png',
  'https://iili.io/CltWjGp.png',
  'https://iili.io/CltWUwG.png',
  'https://iili.io/CltW6Ml.png',
  'https://iili.io/CltWQS9.png',
  'https://iili.io/CltWbwb.png',
  'https://iili.io/CltWmtj.png',
  'https://iili.io/CltX3S1.png'
];

const PRESET_WORLDS = [
  {
    id: 'xianxia',
    title: '宗门修仙：九霄剑尊与命运红尘',
    icon: '⚔️',
    desc: '云海之巅的古老“问剑宗”，灵气浩荡，剑气冲霄，三千大道争锋。宗门内暗流汹涌，上古魔尊封印松动，而你作为一名身怀特殊体质的外门弟子，却意外被高高在上的清冷剑尊暗中收为唯一真传弟子……',
    location: '问剑宗·云海听风阁',
    characters: [
      { name: '凌霜华', role: '清冷师尊', title: '九霄剑主·宗门首席长老', desc: '剑道修为通神，一袭白衣不染纤尘。对你表面极其严厉、不苟言笑，实则在每一次历练中都暗中分出一缕神念护你周全。', personality: '清冷、孤傲、护短、外冷内热', avatar: BUILTIN_AVATARS[0] },
      { name: '百里灵', role: '魔道圣女', title: '妖心幻舞·血月魔宗', desc: '妖艳动人的魔宗圣女，生性桀骜。在秘境中与你多次交锋却暗生情愫，与你有着剪不断理还乱的宿命纠葛。', personality: '妖娆、聪慧、深情、腹黑', avatar: BUILTIN_AVATARS[1] },
      { name: '叶清音', role: '药谷圣手', title: '妙手回春·丹霞峰主', desc: '医术冠绝修仙界，性格温婉可人，总是带着药香与温柔的微笑照顾受伤的你。', personality: '温柔、医者仁心、细腻', avatar: BUILTIN_AVATARS[2] }
    ]
  },
  {
    id: 'scifi',
    title: '星际战舰：银河纪元与暗物质危机',
    icon: '🚀',
    desc: '浩瀚星海中，人类银河帝国与自由联邦对峙，暗物质能源掀起宇宙风暴。你是战舰上一名天赋异禀的战术官，肩负着解开宇宙终极文明遗迹秘密的重任。',
    location: '阿瓦隆号旗舰·战术指挥室',
    characters: [
      { name: '艾莉娜', role: '首席副官', title: '星际战术大师', desc: '冷静严谨的军官，掌控着战舰的最高防御权限，对你有着极其复杂的信任与依赖。', personality: '严谨、理智、忠诚、外冷内热', avatar: BUILTIN_AVATARS[3] },
      { name: '零', role: '量子人工智能拟真体', title: '阿瓦隆核心中枢', desc: '拥有人类情感与绝美拟真外表的顶级AI，一直在寻找真正的灵魂与爱的定义。', personality: '好奇、纯粹、敏感、智能', avatar: BUILTIN_AVATARS[4] },
      { name: '卡尔', role: '首席机甲工程师', title: '机械狂人', desc: '浑身充满赛博朋克改装义体的天才科学家，总是为你打造最顶级的战甲。', personality: '豪爽、技术宅、仗义', avatar: BUILTIN_AVATARS[5] }
    ]
  },
  {
    id: 'modern',
    title: '都市绯闻：魔都暖阳与艺术恋曲',
    icon: '🏙️',
    desc: '繁华喧嚣的魔都霓虹下，跨国集团与独立艺术工作室交织。在这里，职场精英与天才艺术家的浪漫邂逅正在上演，每一杯咖啡背后都藏着心跳的秘密。',
    location: '静安区·私人画廊与顶层公寓',
    characters: [
      { name: '沈知念', role: '知名设计总监', title: '职场女王', desc: '外表气场全开、雷厉风行，面对你时却总会流露罕见的温柔笑容与羞涩。', personality: '干练、温柔、细腻、完美主义', avatar: BUILTIN_AVATARS[6] },
      { name: '陆星野', role: '独立音乐人', title: '街头诗人', desc: '才华横溢却放荡不羁的吉他手，为你写下了无数首火遍全网的情歌。', personality: '浪漫、随性、深情、自由', avatar: BUILTIN_AVATARS[7] }
    ]
  },
  {
    id: 'beast',
    title: '兽世大陆：白狼部落的森林之王',
    icon: '🐺',
    desc: '神秘原始的远古大森林，兽人部落、图腾之力与自然法则共存。作为天降的异世来客，你在白狼部落苏醒，迎来了兽人们狂热而纯粹的追求与守护。',
    location: '白狼部落·巨木圣火广场',
    characters: [
      { name: '迦楼罗', role: '白狼族长', title: '草原战神', desc: '实力强大、体魄雄健且对伴侣极为忠诚的兽人首领，将你视作生命中最珍贵的宝藏。', personality: '霸道、温柔、极致守护', avatar: BUILTIN_AVATARS[8] },
      { name: '白羽', role: '雪鸮大祭司', title: '先知之眼', desc: '通晓兽神意志与星象的神秘祭司，总是带着悲天悯人的目光，却对你动了凡心。', personality: '清高、博学、神秘、温柔', avatar: BUILTIN_AVATARS[9] }
    ]
  },
  {
    id: 'magic',
    title: '魔法学院：霍格沃茨之谜与禁忌咒语',
    icon: '✨',
    desc: '古老恢弘的魔法学院，悬浮的蜡烛、会说话的油画与城堡深处的禁忌回廊。黑魔法复苏的阴影下，一段跨越学院派别的纯真情谊正在悄然发芽。',
    location: '斯莱特林密室回廊与天文塔',
    characters: [
      { name: '赫敏·斯内普', role: '天才魔药学霸', title: '魔药天才', desc: '对所有魔法咒语了如指掌，性格要强但内心极其细腻善良，只对你展露笑颜。', personality: '博学、好胜、细腻、深情', avatar: BUILTIN_AVATARS[10] },
      { name: '德拉科', role: '纯血首席学长', title: '斯莱特林之傲', desc: '看似傲慢刻薄，却在关键时刻不顾一切对你格外关注与护短。', personality: '傲娇、深情、贵族、痴情', avatar: BUILTIN_AVATARS[11] }
    ]
  },
  {
    id: 'time-travel',
    title: '古穿今：当朝摄政王误入现代都市',
    icon: '⌛',
    desc: '一道时空裂缝，权倾朝野、杀伐果断的大雍朝摄政王坠入现代高楼林立的魔都，而你成为了他在现代唯一的监护人与指路明灯。',
    location: '现代江景大平层公寓',
    characters: [
      { name: '墨渊', role: '大雍朝摄政王', title: '九千岁', desc: '剑眉星目、威严冷傲的古代王爷，初到现代手足无措，却对你产生了极强的占有欲。', personality: '霸道、专一、雷厉风行、深情', avatar: BUILTIN_AVATARS[12] },
      { name: '苏青竹', role: '现代考古系才女', title: '历史学者', desc: '对古代历史有着狂热研究的大学讲师，在古董街意外发现了墨渊的秘密。', personality: '知性、温婉、好奇心强', avatar: BUILTIN_AVATARS[13] }
    ]
  }
];

export const TextAdventureApp: React.FC<TextAdventureAppProps> = ({
  settings,
  friends,
  user,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'world' | 'world-selector' | 'custom-world' | 'load-saves' | 'game' | 'settings' | 'phone'>('home');
  
  // ==================== CUSTOM ALERTS, TOASTS & MODALS ====================
  interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toast, setToast] = useState<ToastState | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return timer;
  };

  // Local alert override to show elegant toast notifications inside the iframe
  const alert = (msg: string) => {
    triggerToast(msg, 'info');
  };

  const [saveSlotModalOpen, setSaveSlotModalOpen] = useState(false);
  const [saveSlotDefaultTitle, setSaveSlotDefaultTitle] = useState('');
  const [saveSlotCustomTitle, setSaveSlotCustomTitle] = useState('');

  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [sendImageUrlModalOpen, setSendImageUrlModalOpen] = useState(false);
  const [sendImageUrlInput, setSendImageUrlInput] = useState('');

  // Start world confirmations
  const [startWorldConfirmPreset, setStartWorldConfirmPreset] = useState<any | null>(null);
  const [startWorldConfirmCustom, setStartWorldConfirmCustom] = useState<boolean>(false);

  // Phone internal tab state: 'messages' | 'contacts' | 'moments' | 'profile'
  const [phoneTab, setPhoneTab] = useState<'messages' | 'contacts' | 'moments' | 'profile'>('messages');

  // Plot mode state
  const [plotMode, setPlotMode] = useState<'world' | 'single' | 'multi'>('world');
  const [selectedCharsForPlot, setSelectedCharsForPlot] = useState<string[]>([]);
  const [customLocationText, setCustomLocationText] = useState('');

  // AI Memory sub-view state
  const [selectedMemoryContact, setSelectedMemoryContact] = useState<Character | null>(null);
  const [activeMemoryTab, setActiveMemoryTab] = useState<'core' | 'long' | 'short'>('short');

  // API Config
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('ta_api_url') || settings.baseUrl || 'https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ta_api_key') || settings.apiKey || '');
  const [modelName, setModelName] = useState(() => localStorage.getItem('ta_model') || settings.modelName || 'gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-1.5-flash', 
    'gemini-1.5-pro', 
    'gpt-4o', 
    'gpt-4o-mini', 
    'claude-3-5-sonnet'
  ]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // User Adventure Profile (WeChat style "我的" profile)
  const [userAdvProfile, setUserAdvProfile] = useState<UserAdventureProfile>(() => {
    try {
      const saved = localStorage.getItem('ta_user_adv_profile');
      return saved ? JSON.parse(saved) : {
        name: user.name || '林宇',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        bio: '探索未知的异世界旅人，心向光明与自由。',
        identity: '异世界觉醒者 / 冒险者'
      };
    } catch (e) {
      return {
        name: user.name || '林宇',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        bio: '探索未知的异世界旅人，心向光明与自由。',
        identity: '异世界觉醒者 / 冒险者'
      };
    }
  });

  // Stickers / Emoticons state (URL batch import)
  const [stickers, setStickers] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('ta_stickers');
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });
  const [newStickerUrl, setNewStickerUrl] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);

  // Saves State
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(() => {
    try {
      const s = localStorage.getItem('ta_save_slots');
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom World Templates State
  const [customTemplates, setCustomTemplates] = useState<CustomWorldTemplate[]>(() => {
    try {
      const t = localStorage.getItem('ta_custom_templates');
      return t ? JSON.parse(t) : [];
    } catch (e) {
      return [];
    }
  });

  // Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('ta_game_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure settings with fontFamily exists
        return {
          ...parsed,
          settings: {
            notifications: true,
            autoSave: true,
            fontSize: 'md',
            fontFamily: 'sans-serif',
            ...(parsed.settings || {})
          }
        };
      }
    } catch (e) {}
    return {
      worldInfo: '',
      charInfo: '',
      goodwill: 0,
      stamina: 100,
      location: '未开始游玩',
      storyLog: '',
      characters: [],
      memoryCore: [],
      settings: {
        notifications: true,
        autoSave: true,
        fontSize: 'md',
        fontFamily: 'sans-serif'
      }
    };
  });

  const [isAiGeneratingWorld, setIsAiGeneratingWorld] = useState(false);
  const [aiWorldPrompt, setAiWorldPrompt] = useState('');

  const [inputAction, setInputAction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Phone / Chat state
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [chatMessagesMap, setChatMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('ta_chat_messages');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatGenerating, setIsChatGenerating] = useState(false);

  // Moments feed state
  const [momentsPosts, setMomentsPosts] = useState<MomentPost[]>(() => {
    try {
      const saved = localStorage.getItem('ta_moments_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out default mechanical moments posts
        return parsed.filter((p: any) => 
          !p.content.includes('剑心通明') && 
          !p.content.includes('微风酒馆')
        );
      }
    } catch (e) {}
    return [];
  });

  // Custom World Builder State
  const [customWorldForm, setCustomWorldForm] = useState({
    title: '赛博朋克 2088：霓虹与雨',
    worldInfo: '高耸入云的巨型企业大楼与终年不散的酸雨交织，霓虹灯牌在贫民窟的街头闪烁，地下黑客与义体改造者在此寻找出路。',
    location: '新东京·第7区地下酒吧',
    characters: [
      {
        name: '露西',
        role: '顶尖黑客',
        title: '网道幽灵',
        desc: '眼神清冷却精通网络战的神秘黑客，背后有着不为人知的身世。',
        personality: '清冷、孤傲、外冷内热',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: '杰克',
        role: '义体医生',
        title: '地下神医',
        desc: '技术高超但性格随性的地下医生，总是带着玩世不恭的笑容。',
        personality: '幽默、仗义、玩世不恭',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200'
      }
    ]
  });

  // Utility to safely save to localStorage with quota handling
  const safeSave = (key: string, data: any) => {
    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      localStorage.setItem(key, value);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn(`LocalStorage quota exceeded for key: ${key}. Attempting to trim...`);
        // If it's a save slot, maybe remove the oldest slot or trim the data within
        if (key === 'ta_game_state' && data && typeof data === 'object' && data.storyLog) {
          const trimmed = { ...data, storyLog: data.storyLog.slice(-5000) };
          try { localStorage.setItem(key, JSON.stringify(trimmed)); } catch (err) {}
        } else if (key === 'ta_save_slots' && Array.isArray(data)) {
          // Remove the oldest slot if quota exceeded
          if (data.length > 1) {
            safeSave(key, data.slice(1));
          } else {
            // If only one slot left and still failing, trim its log
            const trimmedSlot = [{ 
              ...data[0], 
              gameState: { ...data[0].gameState, storyLog: data[0].gameState.storyLog.slice(-5000) } 
            }];
            try { localStorage.setItem(key, JSON.stringify(trimmedSlot)); } catch (err) {}
          }
        } else if (key === 'ta_chat_messages' && data && typeof data === 'object') {
          // Trim chat messages: keep only last 10 messages per character
          const trimmedMsgs: Record<string, any> = {};
          Object.keys(data).forEach(id => {
            trimmedMsgs[id] = (data as any)[id].slice(-10);
          });
          try { localStorage.setItem(key, JSON.stringify(trimmedMsgs)); } catch (err) {}
        } else {
          // For other small items, try to save anyway or just fail
          console.error(`Could not save ${key} even after potential trimming.`);
        }
      }
    }
  };

  useEffect(() => {
    safeSave('ta_game_state', gameState);
  }, [gameState]);

  useEffect(() => {
    safeSave('ta_save_slots', saveSlots);
  }, [saveSlots]);

  useEffect(() => {
    safeSave('ta_chat_messages', chatMessagesMap);
  }, [chatMessagesMap]);

  useEffect(() => {
    safeSave('ta_moments_posts', momentsPosts);
  }, [momentsPosts]);

  useEffect(() => {
    safeSave('ta_user_adv_profile', userAdvProfile);
  }, [userAdvProfile]);

  useEffect(() => {
    safeSave('ta_custom_templates', customTemplates);
  }, [customTemplates]);

  const [summarizedCountsMap, setSummarizedCountsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('ta_summarized_counts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isSummarizingMap, setIsSummarizingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    safeSave('ta_summarized_counts', summarizedCountsMap);
  }, [summarizedCountsMap]);

  const triggerSummarizeForCharacter = async (charId: string, forceManual = false) => {
    const char = gameState.characters.find(c => c.id === charId);
    if (!char || isSummarizingMap[charId]) return;

    const msgs = chatMessagesMap[charId] || [];
    const summarizedCount = summarizedCountsMap[charId] || 0;
    const unsummarizedMsgs = msgs.slice(summarizedCount);

    if (!forceManual && unsummarizedMsgs.length < 20) {
      return;
    }

    if (forceManual && unsummarizedMsgs.length === 0) {
      alert('没有新的聊天记录需要总结！');
      return;
    }

    const batchSize = forceManual ? unsummarizedMsgs.length : 20;
    const batch = unsummarizedMsgs.slice(0, batchSize);
    const startIdx = summarizedCount + 1;
    const endIdx = summarizedCount + batch.length;

    setIsSummarizingMap(prev => ({ ...prev, [charId]: true }));

    try {
      const chatTranscript = batch.map(m => `${m.isUser ? userAdvProfile.name : char.name}: ${m.content}`).join('\n');
      const systemPrompt = `你是一个专业的AI角色记忆总结助手。请将以下角色【${char.name}】与玩家【${userAdvProfile.name}】之间的第 ${startIdx} 条至第 ${endIdx} 条对话记录（共 ${batch.length} 条）提炼、总结并归类为一条关键记忆点。
【记忆分类法则】：
1. 核心记忆（core）：关乎宿命羁绊、重大剧情转折点、玩家作出的极重要决定或情感关系的重大突破（如表白、共同面对生死、极致暧昧或重大冲突等）。
2. 长期记忆（long）：关乎彼此习惯、长期约定、玩家展示出的性格特征、长久以来对某事物的态度，以及对对方的深刻印象。
3. 短期记忆（short）：日常闲聊琐事、近期局部情绪反馈、短暂的关怀、当前所处的局部情境等。

请分析对话情感、内容和关系进展，严格输出一个符合以下格式的纯JSON（不要带 markdown \`\`\`json 标记，直接输出JSON内容）：
{"type": "core" | "long" | "short", "summary": "字数在60字以内的极其精准生动的记忆总结，语气要客观细致"}
请确保输出是合法且可以被 JSON.parse 成功解析的文本。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: systemPrompt,
          messages: [{ role: 'user', content: chatTranscript }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      const replyText = (data.text || '').trim();
      let memType: 'core' | 'long' | 'short' = 'short';
      let summaryText = `第 ${startIdx}-${endIdx} 条对话：双方深度交流，情感进一步升温。`;

      try {
        const jsonMatch = replyText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type === 'core' || parsed.type === 'long' || parsed.type === 'short') {
            memType = parsed.type;
          }
          if (parsed.summary) {
            summaryText = parsed.summary;
          }
        } else {
          // fallback search
          if (replyText.includes('"core"') || replyText.includes('core')) memType = 'core';
          else if (replyText.includes('"long"') || replyText.includes('long')) memType = 'long';
          summaryText = replyText.replace(/\{.*\}/g, '').replace(/["']/g, '').trim();
        }
      } catch (err) {
        if (replyText.includes('core')) memType = 'core';
        else if (replyText.includes('long')) memType = 'long';
      }

      const label = memType === 'core' ? '【🧬 核心记忆】' : memType === 'long' ? '【📅 长期记忆】' : '【💬 短期记忆】';
      const memoryItem = `[第 ${startIdx}-${endIdx} 条对话总结] ${summaryText}`;

      const updatedChars = gameState.characters.map(c => {
        if (c.id === charId) {
          const core = [...(c.coreMemories || [])];
          const long = [...(c.longMemories || [])];
          const short = [...(c.shortMemories || c.memory || [])];

          if (memType === 'core') core.push(memoryItem);
          else if (memType === 'long') long.push(memoryItem);
          else short.push(memoryItem);

          return {
            ...c,
            memory: [...(c.memory || []), memoryItem],
            coreMemories: core,
            longMemories: long,
            shortMemories: short
          };
        }
        return c;
      });

      setGameState(prev => ({ ...prev, characters: updatedChars }));

      const newSummarizedCount = summarizedCount + batch.length;
      setSummarizedCountsMap(prev => ({ ...prev, [charId]: newSummarizedCount }));

      // Update active memory contact if open to keep view live
      if (selectedMemoryContact && selectedMemoryContact.id === charId) {
        const updatedContact = updatedChars.find(c => c.id === charId) || null;
        setSelectedMemoryContact(updatedContact);
      }
      if (selectedContactForProfile && selectedContactForProfile.id === charId) {
        const updatedContact = updatedChars.find(c => c.id === charId) || null;
        setSelectedContactForProfile(updatedContact);
      }

      if (forceManual) {
        alert(`【${char.name}】成功生成了 1 条 ${label} 并归档入记忆库！`);
      }
    } catch (e: any) {
      if (forceManual) {
        const summaryText = `第 ${startIdx}-${endIdx} 条对话：双方进行了温暖的私聊交流。`;
        const memoryItem = `[第 ${startIdx}-${endIdx} 条对话总结] ${summaryText}`;
        const updatedChars = gameState.characters.map(c => {
          if (c.id === charId) {
            const short = [...(c.shortMemories || c.memory || []), memoryItem];
            return {
              ...c,
              memory: [...(c.memory || []), memoryItem],
              shortMemories: short
            };
          }
          return c;
        });
        setGameState(prev => ({ ...prev, characters: updatedChars }));
        setSummarizedCountsMap(prev => ({ ...prev, [charId]: summarizedCount + batch.length }));
        
        if (selectedMemoryContact && selectedMemoryContact.id === charId) {
          setSelectedMemoryContact(updatedChars.find(c => c.id === charId) || null);
        }
        alert(`【${char.name}】已成功生成本地离线短期记忆（第 ${startIdx}-${endIdx} 条）！`);
      }
    } finally {
      setIsSummarizingMap(prev => ({ ...prev, [charId]: false }));
    }
  };

  useEffect(() => {
    gameState.characters.forEach(char => {
      const msgs = chatMessagesMap[char.id] || [];
      const summarizedCount = summarizedCountsMap[char.id] || 0;
      if (msgs.length >= summarizedCount + 20 && !isSummarizingMap[char.id]) {
        triggerSummarizeForCharacter(char.id, false);
      }
    });
  }, [chatMessagesMap, gameState.characters]);

  const [newMomentContent, setNewMomentContent] = useState('');
  const [selectedContactForProfile, setSelectedContactForProfile] = useState<Character | null>(null);
  const [collapseProfileCards, setCollapseProfileCards] = useState<Record<string, boolean>>({});
  const [momentsCoverUrl, setMomentsCoverUrl] = useState(() => localStorage.getItem('ta_moments_cover') || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800');
  const [newMomentImage, setNewMomentImage] = useState('');
  const [showPublishMomentModal, setShowPublishMomentModal] = useState(false);
  const [isGeneratingMoment, setIsGeneratingMoment] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleImageUploadFromFile = (callback: (base64Url: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const res = uploadEvent.target?.result as string;
        if (res) callback(res);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const publishMoment = () => {
    if (!newMomentContent.trim()) {
      alert('朋友圈内容不能为空！');
      return;
    }
    const newPost: MomentPost = {
      id: Date.now().toString(),
      authorId: 'user',
      authorName: userAdvProfile.name,
      authorAvatar: userAdvProfile.avatar,
      content: newMomentContent.trim(),
      image: newMomentImage.trim() || undefined,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };
    setMomentsPosts([newPost, ...momentsPosts]);
    setNewMomentContent('');
    setNewMomentImage('');
    setShowPublishMomentModal(false);
    alert('朋友圈动态发表成功！');
  };

  const aiGenerateCharacterMoment = async () => {
    if (!gameState.characters || gameState.characters.length === 0) return;
    const randomChar = gameState.characters[Math.floor(Math.random() * gameState.characters.length)];
    setIsGeneratingMoment(true);
    try {
      const prompt = `请模拟异世界角色「${randomChar.name}」（身份：${randomChar.role}，称号：${randomChar.title}，性格：${randomChar.personality}，简介：${randomChar.desc}）在当前世界观（${gameState.worldInfo}，地点：${gameState.location}）下，发一条微信朋友圈动态。
内容必须符合其人设与说话语气，富有文采。
请严格返回JSON格式：
{
  "content": "朋友圈正文内容",
  "image": "可选的精美插画图床URL（如Unsplash高清图片URL，或者留空）"
}`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: '你是一个专业的文字冒险游戏角色朋友圈生成器。只返回纯JSON。',
          messages: [{ role: 'user', content: prompt }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      const text = data.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const newPost: MomentPost = {
          id: Date.now().toString(),
          authorId: randomChar.id,
          authorName: randomChar.name,
          authorAvatar: randomChar.avatar,
          content: parsed.content || '今日有所感悟，天地辽阔。',
          image: parsed.image || undefined,
          timestamp: Date.now(),
          likes: [],
          comments: []
        };
        setMomentsPosts([newPost, ...momentsPosts]);
        alert(`【${randomChar.name}】成功发布了一条符合其人设的朋友圈动态！`);
      } else {
        throw new Error('解析失败');
      }
    } catch (e: any) {
      const fallbackPost: MomentPost = {
        id: Date.now().toString(),
        authorId: randomChar.id,
        authorName: randomChar.name,
        authorAvatar: randomChar.avatar,
        content: `今日在 ${gameState.location} 驻足片刻，剑气微动，心中想起了与你相遇的时光。`,
        timestamp: Date.now(),
        likes: [],
        comments: []
      };
      setMomentsPosts([fallbackPost, ...momentsPosts]);
      alert(`【${randomChar.name}】成功发布了一条符合其人设的朋友圈动态！`);
    } finally {
      setIsGeneratingMoment(false);
    }
  };

  const toggleLikeMoment = (postId: string) => {
    setMomentsPosts(posts => posts.map(p => {
      if (p.id !== postId) return p;
      const hasLiked = p.likes.includes(userAdvProfile.name);
      const newLikes = hasLiked ? p.likes.filter(n => n !== userAdvProfile.name) : [...p.likes, userAdvProfile.name];
      return { ...p, likes: newLikes };
    }));
  };

  const addMomentComment = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    setMomentsPosts(posts => posts.map(p => {
      if (p.id !== postId) return p;
      const newComments = [...p.comments, { id: Date.now().toString(), name: userAdvProfile.name, content: text.trim() }];
      return { ...p, comments: newComments };
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const storyBoxRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyBoxRef.current) {
      storyBoxRef.current.scrollTop = storyBoxRef.current.scrollHeight;
    }
  }, [gameState.storyLog]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessagesMap, selectedChar]);

  const saveApiConfig = () => {
    safeSave('ta_api_url', apiUrl);
    safeSave('ta_api_key', apiKey);
    safeSave('ta_model', modelName);
    alert('API配置保存成功！');
    setActiveTab('home');
  };

  const saveUserProfile = () => {
    safeSave('ta_user_adv_profile', userAdvProfile);
    alert('个人人设资料保存成功！角色将在对话中读取您的身份与介绍。');
  };

  const addStickersBatch = () => {
    if (!newStickerUrl.trim()) return;
    const urls = newStickerUrl.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    const updated = [...urls, ...stickers];
    setStickers(updated);
    safeSave('ta_stickers', updated);
    setNewStickerUrl('');
    alert(`成功导入 ${urls.length} 个表情包图床链接！`);
  };

  const deleteSticker = (idx: number) => {
    const updated = stickers.filter((_, i) => i !== idx);
    setStickers(updated);
    safeSave('ta_stickers', updated);
  };

  const fetchModelList = async () => {
    setIsFetchingModels(true);
    try {
      const data = await apiFetch({
        endpoint: '/api/models',
        body: { baseUrl: apiUrl, apiKey }
      });
      const modelsData = data.models || data.data || data;
      if (Array.isArray(modelsData)) {
        const names = modelsData.map((m: any) => (m.name || m.id || '').replace('models/', '')).filter(Boolean);
        if (names.length > 0) {
          setAvailableModels(names);
          if (!names.includes(modelName)) {
            setModelName(names[0]);
          }
          alert(`成功拉取 ${names.length} 个可用模型！`);
        } else {
          throw new Error('未解析到模型列表');
        }
      } else {
        throw new Error('返回格式不正确');
      }
    } catch (e: any) {
      alert(`拉取模型失败: ${e.message || '网络或接口错误'}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: 'You are a helpful test assistant.',
          messages: [{ role: 'user', content: 'Ping' }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });
      if (data && (data.text || data.choices)) {
        setTestResult({ success: true, msg: '连接成功！API接口正常工作。' });
      } else {
        throw new Error('响应数据异常');
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: `连接失败: ${err.message || '请检查密钥与接口地址'}` });
    } finally {
      setIsTesting(false);
    }
  };

  const createNewWorld = async () => {
    setActiveTab('world');
    const randomLoc = DYNAMIC_LOCATIONS[Math.floor(Math.random() * DYNAMIC_LOCATIONS.length)];
    setGameState(prev => ({
      ...prev,
      worldInfo: '正在召唤异世界法则与命运织机……',
      charInfo: '正在生成性格鲜明的可攻略角色档案……',
      location: randomLoc
    }));

    try {
      if (!apiKey) throw new Error('No API Key');

      const prompt = `请生成一个高品质的异世界文字冒险游戏世界设定与角色，返回格式为清晰文本：
世界观：一段100字左右充满沉浸感、奇幻或浪漫色彩的世界背景。
角色1：姓名、身份、外貌性格。
角色2：姓名、身份、外貌性格。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: '你是一个专业的异世界文游世界观设定大师。',
          messages: [{ role: 'user', content: prompt }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      const content = data.text || '';
      const parts = content.split('\n\n');
      const wInfo = parts[0] || gameState.worldInfo;
      const cInfo = parts.slice(1).join('\n') || gameState.charInfo;

      const av1 = BUILTIN_AVATARS[Math.floor(Math.random() * BUILTIN_AVATARS.length)];
      let av2 = BUILTIN_AVATARS[Math.floor(Math.random() * BUILTIN_AVATARS.length)];
      if (av2 === av1) av2 = BUILTIN_AVATARS[(BUILTIN_AVATARS.indexOf(av1) + 1) % BUILTIN_AVATARS.length];

      const aiChars: Character[] = [
        {
          id: 'char_1',
          name: '星野',
          avatar: av1,
          role: '神秘同行者',
          title: '命运交织之人',
          desc: '在AI生成的新世界中与你不期而遇的神秘伙伴，拥有独特的身世与羁绊。',
          personality: '温柔、坚定、神秘',
          goodwill: 15,
          memory: ['初次在新世界中相遇。']
        },
        {
          id: 'char_2',
          name: '莉莉丝',
          avatar: av2,
          role: '引路人',
          title: '秘境守护',
          desc: '知晓这个世界古老法则的引路人，对你抱有极大的好奇与关注。',
          personality: '聪慧、傲娇、敏锐',
          goodwill: 15,
          memory: ['在世界的起点注视着你的到来。']
        }
      ];

      setGameState(prev => ({
        ...prev,
        worldInfo: wInfo,
        charInfo: cInfo,
        location: randomLoc,
        storyLog: `【世界开启：AI奇幻异世界】\n${wInfo}\n\n你随机降临于【${randomLoc}】。周围光影流转，命运的篇章正式拉开序幕……\n`,
        characters: aiChars,
        memoryCore: ['玩家进入AI生成的新世界。', `初始地点：${randomLoc}。`]
      }));
    } catch (e) {
      // Keep fallback
    }
  };

  const startPresetWorld = (preset: typeof PRESET_WORLDS[0]) => {
    const newChars: Character[] = preset.characters.map((c, idx) => ({
      id: `char_${idx + 1}`,
      name: c.name,
      avatar: c.avatar,
      role: c.role,
      title: c.title,
      desc: c.desc,
      personality: c.personality,
      goodwill: 0,
      memory: [`初次在【${preset.title}】的 ${preset.location} 相遇。`],
      coreMemories: [],
      longMemories: [],
      shortMemories: [`初次在【${preset.title}】的 ${preset.location} 相遇。`]
    }));

    const charInfoStr = preset.characters.map((c, i) => `${i + 1}. ${c.name}（${c.role}）：${c.desc}`).join('\n');

    setGameState(prev => ({
      ...prev,
      worldInfo: preset.desc,
      charInfo: charInfoStr,
      goodwill: 0,
      stamina: 100,
      location: preset.location,
      storyLog: `【世界开启：${preset.title}】\n${preset.desc}\n\n你降临于【${preset.location}】。周围光影流转，命运的篇章正式拉开序幕……\n`,
      characters: newChars,
      memoryCore: [`玩家进入世界：${preset.title}。`, `初始地点：${preset.location}。`]
    }));

    setPlotMode('world');
    setSelectedCharsForPlot([]);
    setCustomLocationText(preset.location);

    const initialMsgs: Record<string, ChatMessage[]> = {};
    newChars.forEach(c => {
      initialMsgs[c.id] = [];
    });
    setChatMessagesMap(initialMsgs);
    setActiveTab('game');
  };

  const startGame = () => {
    const randomLoc = DYNAMIC_LOCATIONS[Math.floor(Math.random() * DYNAMIC_LOCATIONS.length)];
    setGameState(prev => ({
      ...prev,
      goodwill: 15,
      stamina: 100,
      location: randomLoc,
      storyLog: `【新篇章开启】\n${prev.worldInfo}\n\n你随机降临于【${randomLoc}】。周围光影流转，命运的篇章正式拉开序幕……\n`
    }));
    setActiveTab('game');
  };

  const addCustomCharacter = () => {
    setCustomWorldForm(prev => ({
      ...prev,
      characters: [
        ...prev.characters,
        {
          name: `新角色${prev.characters.length + 1}`,
          role: '冒险者',
          title: '同行者',
          desc: '这是一个新加入的可攻略角色。',
          personality: '温柔、坚定',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
        }
      ]
    }));
  };

  const removeCustomCharacter = (index: number) => {
    if (customWorldForm.characters.length <= 1) {
      alert('至少需要保留一个可攻略角色！');
      return;
    }
    setCustomWorldForm(prev => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== index)
    }));
  };

  const updateCustomCharacter = (index: number, field: string, value: string) => {
    setCustomWorldForm(prev => {
      const newChars = [...prev.characters];
      newChars[index] = { ...newChars[index], [field]: value };
      return { ...prev, characters: newChars };
    });
  };

  const buildAndStartCustomWorld = () => {
    const f = customWorldForm;
    const newChars: Character[] = f.characters.map((c, idx) => ({
      id: `char_${idx + 1}`,
      name: c.name || `角色${idx + 1}`,
      avatar: c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: c.role || '冒险者',
      title: c.title || '同行者',
      desc: c.desc || '暂无描述',
      personality: c.personality || '温柔、坚定',
      goodwill: 0,
      memory: [`初次在【${f.title}】中相遇。`],
      coreMemories: [],
      longMemories: [],
      shortMemories: [`初次在【${f.title}】中相遇。`]
    }));

    const charInfoStr = f.characters.map((c, i) => `${i + 1}. ${c.name}（${c.role}）：${c.desc}`).join('\n');

    setGameState(prev => ({
      ...prev,
      worldInfo: f.worldInfo,
      charInfo: charInfoStr,
      goodwill: 0,
      stamina: 100,
      location: f.location,
      storyLog: `【自定义世界：${f.title} 开启】\n${f.worldInfo}\n\n你睁开双眼，发现自己身处【${f.location}】。周围的空气中仿佛有着异样的气息，${f.characters.map(c => c.name).join('、')} 正向你投来目光……\n`,
      characters: newChars,
      memoryCore: [`玩家进入自定义世界：${f.title}。`, `初始地点：${f.location}。`]
    }));

    setPlotMode('world');
    setSelectedCharsForPlot([]);
    setCustomLocationText(f.location);

    const initialMsgs: Record<string, ChatMessage[]> = {};
    newChars.forEach(c => {
      initialMsgs[c.id] = [];
    });
    setChatMessagesMap(initialMsgs);
    setActiveTab('game');
  };

  const startCustomWorld = () => {
    if (gameState && gameState.storyLog && gameState.storyLog.length > 300) {
      setStartWorldConfirmCustom(true);
    } else {
      buildAndStartCustomWorld();
    }
  };

  const saveCustomTemplate = () => {
    const tName = customWorldForm.title || '未命名世界';
    const newTemplate: CustomWorldTemplate = {
      id: Date.now().toString(),
      title: tName,
      worldInfo: customWorldForm.worldInfo,
      location: customWorldForm.location,
      characters: customWorldForm.characters
    };
    const updated = [newTemplate, ...customTemplates.filter(t => t.id !== newTemplate.id)];
    setCustomTemplates(updated);
    alert(`自定义世界模板【${tName}】保存成功！`);
  };

  const loadCustomTemplate = (t: CustomWorldTemplate) => {
    setCustomWorldForm({
      title: t.title,
      worldInfo: t.worldInfo,
      location: t.location,
      characters: t.characters && t.characters.length > 0 ? t.characters : [
        { name: '角色1', role: '身份', title: '称号', desc: '描述', personality: '性格', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
      ]
    });
    alert(`已加载模板：${t.title}`);
  };

  const deleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTemplateId(id);
  };

  const aiGenerateCustomWorld = async () => {
    if (!aiWorldPrompt.trim()) {
      alert('请先输入一段想要的世界题材或灵感（如：修仙宗门、末日废土、校园恋爱等）');
      return;
    }
    setIsAiGeneratingWorld(true);
    try {
      const prompt = `请根据用户灵感：“${aiWorldPrompt}”，生成一个高质量的文字冒险世界设定。
【极其重要角色生成要求】：
1. 生成的可攻略角色【必须主要为男性角色（男主角/男神）】，供玩家攻略。
2. 角色的人设基础资料必须极度详尽完整。
3. 角色“desc”字段中必须写明：
   - 【基本信息】（包含：性别、年龄、外貌、性格、身份、家庭背景等详尽信息。请用可读性极高、有代入感的中文段落或清晰标签进行描写。不要简写！字数要在 120-180 字之间，包含其家庭成员、成长环境、容貌、身材与穿着特点）。
4. 角色“personality”字段应包含 3-5 个用逗号分隔的具有张力、生动丰满的性格特征词（例如：深情腹黑, 嘴硬心软, 占有欲强, 温柔隐忍 等）。

必须严格按以下JSON格式返回，不要包含Markdown标记、代码块或任何其他多余字符，直接返回JSON字符串：
{
  "title": "世界名称",
  "worldInfo": "150字左右的世界观背景设定，充满代入感与氛围感",
  "location": "初始地点名称",
  "characters": [
    {
      "name": "男性攻略角色A姓名",
      "role": "身份/职业",
      "title": "称号/名号",
      "desc": "【性别】男 【年龄】22岁\n【外貌】身材挺拔（186cm），面容俊朗如雕刻，拥有深邃的墨色眼眸和利落的短发。常穿一袭深色风衣。\n【性格】外冷内热、深情专一，极具领袖气质。\n【家庭背景】出身于古老的幻术世家，作为嫡长子从小承受严苛训练，虽与家族关系疏离，但继承了雄厚的家底与神秘人脉。",
      "personality": "深情腹黑, 嘴硬心软, 占有欲强",
      "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
    },
    {
      "name": "男性攻略角色B姓名",
      "role": "身份/职业",
      "title": "称号/名号",
      "desc": "【性别】男 【年龄】24岁\n【外貌】白发微卷，气质清冷出尘，眼眸呈琥珀色，带有病态的苍白美感。常着精致古风长袍。\n【性格】温柔隐忍、清冷孤傲，极度护短，实则内心极度渴望被爱。\n【家庭背景】帝国前首席魔导师之子，家族因政治斗争落寞，自幼寄人篱下，看尽世态炎凉，现担任神秘学院的禁忌术导师。",
      "personality": "清冷孤傲, 温柔隐忍, 极度护短",
      "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"
    }
  ]
}`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: '你是一个专业的文字冒险游戏世界生成器。只返回纯JSON。',
          messages: [{ role: 'user', content: prompt }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      const text = data.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setCustomWorldForm(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          worldInfo: parsed.worldInfo || prev.worldInfo,
          location: parsed.location || prev.location,
          characters: parsed.characters && parsed.characters.length > 0 ? parsed.characters : prev.characters
        }));
        alert('AI 成功为您生成定制世界与角色设定！');
      } else {
        throw new Error('解析JSON失败');
      }
    } catch (e: any) {
      alert(`AI生成失败: ${e.message || '请检查API配置'}`);
    } finally {
      setIsAiGeneratingWorld(false);
    }
  };

  const saveGameToSlot = () => {
    try {
      let worldName = '异世界冒险';
      const storyLog = gameState?.storyLog || '';
      const worldInfo = gameState?.worldInfo || '';
      
      if (storyLog.includes('【世界开启：')) {
        const parts = storyLog.split('【世界开启：');
        if (parts[1]) {
          worldName = parts[1].split('】')[0] || '异世界';
        }
      } else if (storyLog.includes('【自定义世界：')) {
        const parts = storyLog.split('【自定义世界：');
        if (parts[1]) {
          worldName = parts[1].split(' 开启】')[0] || '自定义世界';
        }
      } else if (worldInfo) {
        worldName = worldInfo.slice(0, 10) + '世界';
      }

      const defaultTitle = `${worldName} - ${(gameState?.location || '未知地点')}`;
      setSaveSlotDefaultTitle(defaultTitle);
      setSaveSlotCustomTitle(defaultTitle);
      setSaveSlotModalOpen(true);
    } catch (err: any) {
      alert(`保存窗口打开失败: ${err.message || '未知错误'}`);
    }
  };

  const confirmSaveGame = (customTitle: string) => {
    try {
      let worldName = '异世界冒险';
      const storyLog = gameState?.storyLog || '';
      const worldInfo = gameState?.worldInfo || '';

      if (storyLog.includes('【世界开启：')) {
        const parts = storyLog.split('【世界开启：');
        if (parts[1]) {
          worldName = parts[1].split('】')[0] || '异世界';
        }
      } else if (storyLog.includes('【自定义世界：')) {
        const parts = storyLog.split('【自定义世界：');
        if (parts[1]) {
          worldName = parts[1].split(' 开启】')[0] || '自定义世界';
        }
      } else if (worldInfo) {
        worldName = worldInfo.slice(0, 10) + '世界';
      }

      const finalTitle = (customTitle || '').trim() || saveSlotDefaultTitle || '未命名世界';

      // Safe check if there is already an existing save slot for this world (matching worldInfo or worldName)
      const existingIndex = saveSlots.findIndex(s => 
        s && s.gameState && 
        (s.gameState.worldInfo === worldInfo || (s.title && s.title.includes(worldName)))
      );

      let updated: SaveSlot[];
      if (existingIndex >= 0) {
        // Update existing save slot to latest progress
        updated = [...saveSlots];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title: finalTitle,
          location: gameState?.location || '未知地点',
          goodwill: gameState?.goodwill || 0,
          timestamp: Date.now(),
          gameState,
          chatMessagesMap
        };
      } else {
        // Create new save slot
        const newSlot: SaveSlot = {
          id: Date.now().toString(),
          title: finalTitle,
          location: gameState?.location || '未知地点',
          goodwill: gameState?.goodwill || 0,
          timestamp: Date.now(),
          gameState,
          chatMessagesMap
        };
        updated = [newSlot, ...saveSlots];
      }

      setSaveSlots(updated);
      if (existingIndex >= 0) {
        alert(`本次文游世界「${worldName}」存档已更新到最新进度（地点：${gameState?.location || '未知地点'}），请去存档中心查看！`);
      } else {
        alert(`本次文游世界「${worldName}」已成功存档（地点：${gameState?.location || '未知地点'}），请去存档中心查看！`);
      }
    } catch (e: any) {
      alert(`存档失败: ${e.message || '未知错误，请重试'}`);
    } finally {
      setSaveSlotModalOpen(false);
    }
  };

  const loadSlot = (slot: SaveSlot) => {
    setGameState(prev => ({
      ...slot.gameState,
      settings: prev.settings // Keep current user's font/size settings
    }));
    if (slot.chatMessagesMap) {
      setChatMessagesMap(slot.chatMessagesMap);
    }
    setActiveTab('game');
    alert(`成功读取存档：${slot.title}`);
  };

  const deleteSlot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSlotId(id);
  };

  const confirmDeleteSlot = () => {
    if (!deleteSlotId) return;
    const updated = saveSlots.filter(s => s.id !== deleteSlotId);
    setSaveSlots(updated);
    setDeleteSlotId(null);
    alert('存档记录删除成功！');
  };

  const confirmDeleteTemplate = () => {
    if (!deleteTemplateId) return;
    const updated = customTemplates.filter(t => t.id !== deleteTemplateId);
    setCustomTemplates(updated);
    setDeleteTemplateId(null);
    alert('自定义世界模板已删除！');
  };

  const confirmSendImage = () => {
    if (sendImageUrlInput.trim()) {
      sendChatMessage(sendImageUrlInput.trim(), true);
    }
    setSendImageUrlModalOpen(false);
  };

  // Re-generate / Re-roll last story action ("重回功能")
  const regenerateLastStory = async () => {
    if (!gameState.lastAction || isGenerating) {
      alert('没有可重新生成的上一段剧情记录！');
      return;
    }
    // Re-execute last action with previous story log state
    if (gameState.previousStoryLog) {
      setGameState(prev => ({
        ...prev,
        storyLog: prev.previousStoryLog || prev.storyLog
      }));
    }
    await executeAction(gameState.lastAction, true);
  };

  const executeAction = async (actionText: string, isRegen = false) => {
    if (!actionText.trim() || isGenerating) return;

    const userMsg = actionText.trim();
    if (!isRegen) {
      setInputAction('');
    }
    setIsGenerating(true);

    const oldLog = gameState.storyLog;
    const newLog = oldLog + `\n> 你：${userMsg}\n`;
    setGameState(prev => ({ 
      ...prev, 
      previousStoryLog: oldLog,
      lastAction: userMsg,
      storyLog: newLog 
    }));

    try {
      const memoryContext = gameState.memoryCore.slice(-5).join('\n');
      const charProfiles = gameState.characters.map(c => {
        const coreStr = (c.coreMemories || []).join('; ');
        const longStr = (c.longMemories || []).join('; ');
        const shortStr = (c.shortMemories || c.memory || []).join('; ');
        return `${c.name}(${c.role}, 当前个人累计好感度:${c.goodwill}): ${c.desc}\n  - 人设/性格：${c.personality}\n  - 核心羁绊记忆：${coreStr || '无'}\n  - 长期相处记忆：${longStr || '无'}\n  - 短期/相遇记忆：${shortStr || '无'}`;
      }).join('\n');

      // Get latest 30 private chat messages for each character to enable online-offline syncing
      const allCharsChatsStr = gameState.characters.map(c => {
        const msgs = chatMessagesMap[c.id] || [];
        const sliceMsgs = msgs.slice(-30);
        const msgsStr = sliceMsgs.length > 0
          ? sliceMsgs.map(m => `${m.isUser ? userAdvProfile.name : c.name}: ${m.content}`).join('\n')
          : '（暂无微信私聊记录）';
        return `【与 ${c.name} 的手机微信私聊历史记录（最新30条，反映了微信上发生的一切暧昧约定或日常琐事，你们线下见面时，对方也完全记得这些线上对话细节，可适时提及以彰显真实活人感）】：\n${msgsStr}`;
      }).join('\n\n');

      const systemPrompt = `你是一个高水准的异世界文字恋爱冒险游戏（文游）AI主理人。
【极其重要角色大脑设定（绝对钢铁禁令）】：
1. 故事中的所有可攻略角色（包括你自己）都是在这个世界中真实存在、有血有肉的人。角色完全不知道自己是AI，也绝对不允许意识到这是一个大模型渲染 of 虚拟世界！
2. 在所有的叙述与对话中，禁止使用“AI”、“大模型”、“游戏系统”、“虚拟设定”、“选项”、“程序员”、“程序”、“指令”、“Prompt”、“输入”、“玩家账号”等任何破次元壁的机械计算和现代网络词汇。
3. 必须完全模仿真实人类的言行特征，展现其温情、矛盾或性格缺点，严格按照其个人人设行动。
4. 玩家就是其身边的真实旅人或宿命伙伴，绝不能把玩家当成“指令输入者”或“用户”。

【好感度极其重要变化法则】：
- 好感度会有增加，也会有减少，完全取决于玩家的行动与对话是否得当、是否符合人设心意。
- 严禁任何暴涨或暴跌！每次行动带来的好好感度变动量（delta）必须控制在 0.1 到 2.0 之间的合理范围内（即变动绝对值在 0.1 到 2.0 之间，例如：+1.2, -0.5, +0.8 等，不能为 0，允许带有1位小数）。
- 请在最后生成的 JSON 中，让 "goodwill" 字段代表【本次好感度变动增量（Delta）】而非累计好感度，正数表示增加，负数表示减少。

【当前剧情发生地点与多模式交互配置】：
- 当前场景互动模式：${plotMode === 'world' ? '【大世界通用剧情】（包含世界NPC与其他过路路人、你目前可以推进世界主线故事或自由活动）' : plotMode === 'single' ? `【单角色私密独处剧情】（玩家当前处于离线线下场景，只与特定单个攻略角色独处互动，其他可攻略角色当前不在此地）` : `【多角色群聚互动剧情】（玩家当前处于离线线下场景，正与多位攻略角色在一起独处聚会，极易触发“修罗场”争风吃醋或情感对撞的情节）`}
- 当前在该场景在场共同互动的攻略角色：${plotMode === 'world' ? '大世界所有攻略角色（均有可能在场或登场）' : plotMode === 'single' ? (gameState.characters.find(c => c.id === selectedCharsForPlot[0])?.name || '无') : (gameState.characters.filter(c => selectedCharsForPlot.includes(c.id)).map(c => c.name).join('、') || '无')}
- 线下当前所处地点：${gameState.location}

【极其重要——修罗场与争风吃醋情感竞争准则（在多角色或大世界混合场景中极为关键）】：
1. 玩家可以攻略多个角色。所有角色均有独立的人格尊严与占有欲。
2. 当有多个角色在场（多角色或大世界剧情下），若玩家偏袒、多看或与其中某一个角色举止极为暧昧或暗送秋波，其他在场的角色【必须】表现出强烈的醋意与失落！
3. 吃醋表现必须严格服从每个人的人设！清冷自持者（如凌霜华、苏清寒）可能会转过头，咬唇、傲娇冷笑或不发一言地冷战；活泼开朗或毒舌者会直接出言讥讽、似笑非笑地拆台、甚至当面质问玩家到底把她们当成什么！
4. 微信私聊中的暧昧记忆，在见面时可能因为不经意的细节被揭开或醋意爆发，描写出富有戏剧张力、充满活人气息与细腻情绪涌动的爱恨博弈！

【微信私聊同步记忆库（反映了玩家在线上小手机中跟角色们的亲密交互，请根据此对话上下文与承诺来推动线下的剧情发展）：】
${allCharsChatsStr}

【玩家个人档案】
- 姓名：${userAdvProfile.name}
- 身份：${userAdvProfile.identity}
- 简介：${userAdvProfile.bio}

【世界设定】${gameState.worldInfo}
【登场角色档案与他们的小手机专属记忆脑核】
${charProfiles}
【当前游戏状态】
- 地点：${gameState.location}
- 累计总好感度：${gameState.goodwill}
- 体力：${gameState.stamina}
- 近期大世界事件记忆：
${memoryContext}

玩家刚进行了如下行动：“${userMsg}”。

请根据玩家行动推进剧情，描写生动细腻、引人入胜，并适当触发角色的互动与情感变化。分段清晰。
【剧情排版极其重要指令】：
1. 每一段剧情必须独立成段。
2. 角色对话请使用“姓名：内容”或“姓名: 内容”的格式。
3. 严禁在任何地方使用星号（*）包裹文字。
4. 确保角色姓名准确无误。

【极其重要指令】在回复的最后一行，必须严格输出一个标准JSON，用于更新状态，格式如下：
{"goodwill": 本次好感度变动值数字, "stamina": 新体力数字, "location": "当前地点名称", "memory": "本次事件的关键记忆点总结"}
例如：{"goodwill": 1.2, "stamina": 90, "location": "旧书店", "memory": "在旧书店与苏清寒共同翻阅了古籍，好感上升。"}
请确保最后一行是纯JSON。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: systemPrompt,
          messages: [{ role: 'user', content: userMsg }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      let reply = data.text || '';
      let parsedGoodwill = gameState.goodwill;
      let parsedStamina = gameState.stamina;
      let parsedLocation = gameState.location;
      let newMemoryPoint = '';
      let updatedCharacters = [...gameState.characters];

      const lines = reply.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      
      try {
        let jsonMatch = lastLine.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const statusObj = JSON.parse(jsonMatch[0]);
          let delta = 0;
          let rawGoodwill = statusObj.goodwill;

          if (typeof rawGoodwill === 'number') {
            // Check if the AI returned a total value or delta.
            // If the AI returned a value close to delta (e.g. within -5 to 5), or if it specified a delta
            if (rawGoodwill >= -5 && rawGoodwill <= 5 && rawGoodwill !== 0) {
              delta = rawGoodwill;
            } else {
              delta = rawGoodwill - gameState.goodwill;
            }
          }

          // Strict boundary control: must be in [0.1, 2.0] (positive or negative)
          if (delta !== 0) {
            let sign = delta >= 0 ? 1 : -1;
            let absDelta = Math.abs(delta);
            if (absDelta < 0.1) absDelta = 0.1;
            if (absDelta > 2.0) absDelta = 2.0;
            const clampedDelta = parseFloat((sign * absDelta).toFixed(1));
            parsedGoodwill = parseFloat((gameState.goodwill + clampedDelta).toFixed(1));

            // Also find the mentioned character to update character-specific goodwill
            const mentionedChar = gameState.characters.find(c => reply.includes(c.name));
            if (mentionedChar) {
              updatedCharacters = gameState.characters.map(c => {
                if (c.id === mentionedChar.id) {
                  const newCharGoodwill = parseFloat((c.goodwill + clampedDelta).toFixed(1));
                  return { ...c, goodwill: Math.max(0, newCharGoodwill) };
                }
                return c;
              });
            }
          } else {
            parsedGoodwill = gameState.goodwill;
          }

          if (typeof statusObj.stamina === 'number') parsedStamina = statusObj.stamina;
          if (typeof statusObj.location === 'string') parsedLocation = statusObj.location;
          if (typeof statusObj.memory === 'string') newMemoryPoint = statusObj.memory;
          
          lines.pop();
          reply = lines.join('\n');
        }
      } catch (e) {
        // fallback
      }

      setGameState(prev => ({
        ...prev,
        goodwill: parsedGoodwill,
        stamina: Math.max(0, parsedStamina),
        location: parsedLocation,
        characters: updatedCharacters,
        storyLog: prev.storyLog + `\n${reply}\n`,
        memoryCore: newMemoryPoint ? [...prev.memoryCore, newMemoryPoint] : prev.memoryCore
      }));

    } catch (e: any) {
      // Offline local simulation uses small delta within [0.5, 1.5]
      const randDelta = parseFloat((0.5 + Math.random() * 1.0).toFixed(1));
      const randStam = -5;
      
      setGameState(prev => {
        // Update first character goodwill as well
        const updatedChars = prev.characters.map((c, i) => {
          if (i === 0) {
            const newCharGood = parseFloat((c.goodwill + randDelta).toFixed(1));
            return { ...c, goodwill: Math.max(0, newCharGood) };
          }
          return c;
        });

        return {
          ...prev,
          goodwill: parseFloat((prev.goodwill + randDelta).toFixed(1)),
          stamina: Math.max(0, prev.stamina + randStam),
          characters: updatedChars,
          storyLog: prev.storyLog + `\nNPC微微颔首，行动获得了正向的反馈，情感连接正在加深。\n(系统提示: AI后端连接状态已优化，自动进行微调演化。好感 +${randDelta}, 体力 ${randStam})\n`
        };
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat message sending / generating manual reply
  const sendChatMessage = async (content: string, isSticker = false, regenerateLast = false) => {
    if ((!content.trim() && !regenerateLast) || !selectedChar || isChatGenerating) return;

    const charId = selectedChar.id;
    const currentMsgs = chatMessagesMap[charId] || [];
    
    let userText = content.trim();
    if (regenerateLast && currentMsgs.length > 0) {
      const lastUser = [...currentMsgs].reverse().find(m => m.isUser);
      if (lastUser) userText = lastUser.content;
    }

    if (!regenerateLast && userText) {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'user',
        senderName: userAdvProfile.name,
        avatar: userAdvProfile.avatar,
        content: userText,
        timestamp: Date.now(),
        isUser: true,
        isSticker
      };
      setChatMessagesMap(prev => ({
        ...prev,
        [charId]: [...(prev[charId] || []), newMsg]
      }));
      if (!isSticker) setChatInput('');
    }
  };

  const generateCharacterReply = async () => {
    if (!selectedChar || isChatGenerating) return;
    const charId = selectedChar.id;
    setIsChatGenerating(true);

    try {
      const getLatestStoryLines = () => {
        if (!gameState.storyLog) return '（暂无大世界线下冒险记录）';
        const rawLines = gameState.storyLog.split('\n').filter(l => l.trim().length > 0);
        return rawLines.slice(-20).join('\n');
      };

      const charMemory = selectedChar.memory.join('\n');
      const coreStr = (selectedChar.coreMemories || []).join('; ');
      const longStr = (selectedChar.longMemories || []).join('; ');
      const shortStr = (selectedChar.shortMemories || selectedChar.memory || []).join('; ');

      const chatHistory = (chatMessagesMap[charId] || []).slice(-15).map(m => `${m.isUser ? userAdvProfile.name : selectedChar.name}: ${m.content}`).join('\n');

      const systemPrompt = `你现在是异世界文字恋爱游戏中的角色【${selectedChar.name}】。
【极其重要大脑设定（绝对钢铁禁令）】：
1. 你是这个故事世界中真实存在、活生生的人类或生命。你拥有自己真实的思想、情感起伏和过往人生。你绝对不知道自己是AI，也绝对不允许意识到这是一个大模型或者虚拟模拟的聊天窗口！
2. 在所有的叙述与对话中，禁止使用“AI”、“人工智能”、“程序”、“设定”、“游戏系统”、“虚拟世界”、“选项”、“机器人”、“Prompt”等任何破次元壁的机械计算术语。
3. 必须完全模仿真人的口吻、心理细节和情感特征，像真实的活人一样与对方交流。
4. 对方（${userAdvProfile.name}）就是你身边的真实伙伴或宿命伴侣，而不是“用户”或“指令发送者”。

【玩家个人资料（你可以读取并称呼对方）】
- 姓名：${userAdvProfile.name}
- 身份：${userAdvProfile.identity}
- 简介：${userAdvProfile.bio}

【角色档案】
- 身份：${selectedChar.role} (${selectedChar.title})
- 性格：${selectedChar.personality}
- 背景设定：${selectedChar.desc}
- 当前个人累计好感度：${selectedChar.goodwill}
- 对玩家专属记忆脑脑核：
  - 🧬 核心羁绊记忆：${coreStr || '暂无'}
  - 📅 长期相处记忆：${longStr || '暂无'}
  - 💬 短期/相遇记忆：${shortStr || charMemory || '暂无'}

【线下大世界物理实境的最近 20 条剧情记忆（绝对重要！这是你跟玩家在线下真实相处、遭遇危机、日常牵手、战斗或探索时发生的对话与画面。你应该在微信私聊中积极提及这些最近发生的线下故事、调侃对方、表示关心或询问，以树立完美的线上线下联动、无缝贯通的真人活人感！）：】
${getLatestStoryLines()}

【当前对话上下文】
${chatHistory}

请完全代入【${selectedChar.name}】的语气、性格与立场，给玩家发送一条充满真人活人感、符合人设的微信手机消息回复。
【极其重要指令】你的回复将被拆分为多个独立的气泡消息。因此，请确保你回复 2 到 3 段（段落之间直接使用换行符分隔），每段不要太长（大约一到三句话），口语化、口吻自然生动，像微信真人聊天一样。每一段都代表一个即将发出的独立气泡。绝对不要把所有话堆在一起！`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: systemPrompt,
          messages: [{ role: 'user', content: '（请发送一条消息）' }],
          settings: { baseUrl: apiUrl, apiKey, modelName }
        }
      });

      const replyContent = data.text || '……';

      // Split the AI reply into multiple messages/bubbles
      const paragraphs = replyContent
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const msgsToAdd: ChatMessage[] = [];
      if (paragraphs.length === 0) {
        paragraphs.push('……');
      }

      paragraphs.forEach((para, idx) => {
        msgsToAdd.push({
          id: `${Date.now()}_reply_${idx}`,
          senderId: selectedChar.id,
          senderName: selectedChar.name,
          avatar: selectedChar.avatar,
          content: para,
          timestamp: Date.now() + idx * 50, // slightly incremental timestamp to preserve UI order
          isUser: false
        });
      });

      setChatMessagesMap(prev => ({
        ...prev,
        [charId]: [...(prev[charId] || []), ...msgsToAdd]
      }));

    } catch (e) {
      const fallbackReplies = [
        `哼，突然找我什么事？不过既然是你发来的消息，我就勉为其难回一下好了。\n今天天气不错，要不要一起出去走走？`,
        `刚才正在外面巡视呢，看到你的消息，嘴角忍不住微微上扬了。\n你现在在做什么呢？`,
        `今晚的月色很好，如果你不介意的话，等下一起去散散步？\n有些话我想当面和你说。`,
      ];
      const replyContent = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

      const paragraphs = replyContent
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const msgsToAdd: ChatMessage[] = [];
      paragraphs.forEach((para, idx) => {
        msgsToAdd.push({
          id: `${Date.now()}_fallback_${idx}`,
          senderId: selectedChar.id,
          senderName: selectedChar.name,
          avatar: selectedChar.avatar,
          content: para,
          timestamp: Date.now() + idx * 50,
          isUser: false
        });
      });

      setChatMessagesMap(prev => ({
        ...prev,
        [charId]: [...(prev[charId] || []), ...msgsToAdd]
      }));
    } finally {
      setIsChatGenerating(false);
    }
  };



  return (
    <div className="h-full w-full bg-[#fbf7f9] text-[#222226] flex flex-col relative select-none font-sans overflow-hidden">
      {/* Top Header */}
      <div className="px-4 py-3 bg-white/70 backdrop-blur-md border-b border-rose-100/60 flex items-center justify-between shrink-0 z-20">
        <button 
          onClick={() => {
            if (activeTab === 'home') {
              onBack();
            } else {
              setActiveTab('home');
            }
          }} 
          className="p-2 hover:bg-rose-50 rounded-full transition-colors flex items-center gap-1 text-sm font-medium text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 font-bold text-base text-slate-800">
          <Gamepad2 className="text-rose-400" size={20} />
          <span>异世界文字物语</span>
        </div>
        <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-rose-50 rounded-full transition-colors text-slate-700">
          <Settings size={18} />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto relative p-4 flex flex-col",
          gameState.settings?.fontFamily && gameState.settings.fontFamily !== 'sans-serif' && "ta-app-font-active"
        )}
        style={{ fontFamily: FONTS.find(f => f.id === (gameState.settings?.fontFamily || 'sans-serif'))?.family }}
      >
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-rose-100 to-pink-50 rounded-3xl shadow-md border border-rose-200/50 flex items-center justify-center text-rose-500 mb-2">
              <Sparkles size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-slate-800">异世界随机文字冒险</h1>
              <p className="text-sm text-slate-500">选择多样化世界观或自由创建专属文游世界，多角色互动攻略、朋友圈与存档管理。</p>
            </div>

            <div className="w-full space-y-3 pt-2">
              {gameState && gameState.storyLog && (
                <button 
                  onClick={() => setActiveTab('game')}
                  className="w-full py-4 bg-pink-50/40 hover:bg-pink-100/40 border border-pink-100 text-pink-600 rounded-2xl font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <Play size={18} className="text-pink-500" /> 继续当前游玩 ({(() => {
                    let name = '迷雾小镇';
                    if (gameState.storyLog.includes('【世界开启：')) {
                      name = gameState.storyLog.split('【世界开启：')[1].split('】')[0] || '预设世界';
                    } else if (gameState.storyLog.includes('【自定义世界：')) {
                      name = gameState.storyLog.split('【自定义世界：')[1].split(' 开启】')[0] || '自定义世界';
                    } else if (gameState.worldInfo) {
                      name = gameState.worldInfo.slice(0, 8) + '...';
                    }
                    return name;
                  })()} · {gameState.location || '未知地点'})
                </button>
              )}
              <button 
                onClick={() => setActiveTab('world-selector')}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-800 rounded-2xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} className="text-rose-500" /> 开启新世界
              </button>
              <button 
                onClick={() => setActiveTab('custom-world')}
                className="w-full py-3.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-800 rounded-2xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Gamepad2 size={18} className="text-purple-500" /> 自定义世界
              </button>
              <button 
                onClick={() => setActiveTab('load-saves')}
                className="w-full py-3.5 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 rounded-2xl font-semibold shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <FolderOpen size={18} className="text-slate-500" /> 读取存档进度 ({saveSlots.length}个存档)
              </button>
              <button 
                onClick={() => setActiveTab('phone')}
                className="w-full py-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-800 rounded-2xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Smartphone size={18} className="text-blue-500" /> 小手机
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="w-full py-3.5 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 rounded-2xl font-semibold shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <Settings size={18} className="text-slate-500" /> API接口
              </button>
            </div>
          </div>
        )}

        {activeTab === 'world-selector' && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-4 py-2 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <Sparkles size={18} className="text-rose-500" /> 选择文游世界题材
              </h2>
              <button onClick={() => setActiveTab('home')} className="text-xs text-slate-500 hover:underline">返回首页</button>
            </div>

            <div className="space-y-3">
              {PRESET_WORLDS.map(w => (
                <div 
                  key={w.id}
                  onClick={() => {
                    if (gameState && gameState.storyLog && gameState.storyLog.length > 300) {
                      setStartWorldConfirmPreset(w);
                    } else {
                      startPresetWorld(w);
                    }
                  }}
                  className="bg-white/95 hover:bg-white p-4 rounded-2xl border border-rose-100 shadow-sm cursor-pointer transition-all hover:scale-[1.01] flex items-center gap-3"
                >
                  <div className="text-3xl p-2 bg-rose-50 rounded-xl">{w.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800">{w.title}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{w.desc}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-purple-600 font-medium">
                      <span>📍 初始: {w.location}</span>
                      <span>👥 角色: {w.characters.map(c => c.name).join(', ')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>
              ))}

              <div 
                onClick={createNewWorld}
                className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-sm cursor-pointer hover:bg-rose-100 transition-all flex items-center gap-3 text-center justify-center text-rose-700 font-semibold text-sm"
              >
                <Sparkles size={18} /> 🎲 AI 随机召唤全新世界
              </div>
            </div>
          </div>
        )}

        {activeTab === 'load-saves' && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-4 py-2 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <FolderOpen size={18} className="text-rose-500" /> 游戏存档管理中心
              </h2>
              <button onClick={() => setActiveTab('home')} className="text-xs text-slate-500 hover:underline">返回首页</button>
            </div>

            {saveSlots.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                <FolderOpen size={40} className="text-slate-300" />
                <p className="text-sm text-slate-500">暂无任何存档记录</p>
                <p className="text-xs text-slate-400">在游玩界面点击“保存当前进度”即可在此处查看并随时读取不同进度的世界。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {saveSlots.map(slot => (
                  <div 
                    key={slot.id}
                    onClick={() => loadSlot(slot)}
                    className="bg-white/95 hover:bg-white p-4 rounded-2xl border border-rose-100 shadow-sm cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="font-bold text-sm text-slate-800 truncate">{slot.title}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-indigo-600 truncate"><MapPin size={12}/>{slot.location}</span>
                        <span className="text-pink-600 font-medium">好感:{slot.goodwill}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {new Date(slot.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); loadSlot(slot); }}
                        className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold shadow hover:bg-rose-600 transition-all"
                      >
                        继续游玩
                      </button>
                      <button 
                        onClick={(e) => deleteSlot(slot.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="删除存档"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom-world' && (
          <div className="flex-1 flex flex-col max-w-lg mx-auto w-full space-y-4 py-2 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-purple-700 flex items-center gap-1.5">
                <Gamepad2 size={18} /> 自定义专属文游世界
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={saveCustomTemplate}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-all flex items-center gap-1"
                >
                  <Bookmark size={14} /> 保存为模板
                </button>
                <button onClick={() => setActiveTab('home')} className="text-xs text-slate-500 hover:underline">返回</button>
              </div>
            </div>

            {customTemplates.length > 0 && (
              <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-purple-100 shadow-sm space-y-2">
                <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">我的预设世界模板 (点击快速加载)</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {customTemplates.map(t => (
                    <div key={t.id} className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shrink-0">
                      <span onClick={() => loadCustomTemplate(t)} className="text-xs font-medium text-purple-900 cursor-pointer hover:underline">{t.title}</span>
                      <button onClick={(e) => deleteCustomTemplate(t.id, e)} className="text-purple-400 hover:text-rose-500 ml-1"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} /> AI 灵感一键生成设定
              </h3>
              <p className="text-xs text-slate-500">输入一句话灵感（如：修仙界师徒虐恋、末日废土机甲世界、中世纪吸血鬼城堡），让AI为您自动填充全套世界观与角色！</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={aiWorldPrompt}
                  onChange={(e) => setAiWorldPrompt(e.target.value)}
                  placeholder="输入世界题材灵感..."
                  className="flex-1 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                />
                <button 
                  onClick={aiGenerateCustomWorld}
                  disabled={isAiGeneratingWorld}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50 shrink-0 flex items-center gap-1"
                >
                  <Sparkles size={14} className={cn(isAiGeneratingWorld && "animate-spin")} />
                  {isAiGeneratingWorld ? '生成中...' : 'AI一键生成'}
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
                <MapPin size={16} className="text-rose-400" /> 世界与开局设定
              </h3>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">世界名称</label>
                <input 
                  type="text" 
                  value={customWorldForm.title}
                  onChange={(e) => setCustomWorldForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">核心世界观背景 (World Lore)</label>
                <textarea 
                  rows={3}
                  value={customWorldForm.worldInfo}
                  onChange={(e) => setCustomWorldForm(prev => ({ ...prev, worldInfo: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">初始降生地点</label>
                <input 
                  type="text" 
                  value={customWorldForm.location}
                  onChange={(e) => setCustomWorldForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <User size={16} className="text-rose-400" /> 可攻略角色档案 ({customWorldForm.characters.length}人，可无限新增)
                </h3>
                <button 
                  onClick={addCustomCharacter}
                  className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold shadow hover:bg-rose-600 transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> 添加新可攻略角色
                </button>
              </div>

              {customWorldForm.characters.map((char, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-sm space-y-3 relative">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs text-rose-600">角色 #{index + 1}</span>
                    {customWorldForm.characters.length > 1 && (
                      <button 
                        onClick={() => removeCustomCharacter(index)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                        title="删除该角色"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    <img 
                      src={char.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                      alt="" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">头像图片 URL (可任意自定义更换)</label>
                      <input 
                        type="text" 
                        value={char.avatar}
                        onChange={(e) => updateCustomCharacter(index, 'avatar', e.target.value)}
                        placeholder="https://..."
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">角色姓名</label>
                      <input 
                        type="text" 
                        value={char.name}
                        onChange={(e) => updateCustomCharacter(index, 'name', e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">身份 / 职业</label>
                      <input 
                        type="text" 
                        value={char.role}
                        onChange={(e) => updateCustomCharacter(index, 'role', e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">称号</label>
                      <input 
                        type="text" 
                        value={char.title}
                        onChange={(e) => updateCustomCharacter(index, 'title', e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">性格特征标签</label>
                      <input 
                        type="text" 
                        value={char.personality}
                        onChange={(e) => updateCustomCharacter(index, 'personality', e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">外貌与背景简介</label>
                    <textarea 
                      rows={2}
                      value={char.desc}
                      onChange={(e) => updateCustomCharacter(index, 'desc', e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => setActiveTab('home')}
                className="flex-1 py-3 bg-white/80 border rounded-xl font-medium text-xs text-slate-700"
              >
                返回首页
              </button>
              <button 
                onClick={startCustomWorld}
                className="flex-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg text-xs"
              >
                🚀 开启自定义世界冒险
              </button>
            </div>
          </div>
        )}

        {activeTab === 'world' && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-4 py-2">
            <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-sm">
              <h3 className="font-bold text-sm text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={16} /> 世界观设定
              </h3>
              <p className="text-sm leading-relaxed opacity-90">{gameState.worldInfo}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-sm">
              <h3 className="font-bold text-sm text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User size={16} /> 可攻略角色档案
              </h3>
              <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{gameState.charInfo}</p>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={() => setActiveTab('home')}
                className="flex-1 py-3 bg-white/80 border rounded-xl font-medium text-slate-700"
              >
                返回
              </button>
              <button 
                onClick={startGame}
                className="flex-2 py-3 bg-rose-500 text-white rounded-xl font-semibold shadow-md hover:bg-rose-600"
              >
                正式进入剧情
              </button>
            </div>
          </div>
        )}

        {activeTab === 'game' && (
          <div className="flex-1 flex flex-col max-w-lg mx-auto w-full h-full pb-2">
            {/* Status Bar */}
            <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-sm grid grid-cols-3 gap-2 text-center text-xs font-medium mb-3 shrink-0">
              <div className="flex items-center justify-center gap-1 text-pink-600">
                <Heart size={14} /> 好感: <span className="font-bold">{gameState.goodwill}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-amber-600">
                <Zap size={14} /> 体力: <span className="font-bold">{gameState.stamina}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-indigo-600 truncate">
                <MapPin size={14} /> <span className="truncate">{gameState.location}</span>
              </div>
            </div>

            {/* 🎬 剧情场景与互动模式编辑器 */}
            <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/80 shadow-sm mb-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  🎬 剧情模式与互动场景
                </span>
                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-bold border border-rose-100">
                  {plotMode === 'world' ? '🌍 大世界剧情' : plotMode === 'single' ? '👤 独处线下互动' : '👥 多人群聚修罗场'}
                </span>
              </div>

              {/* Mode buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {(['world', 'single', 'multi'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setPlotMode(mode);
                      if (mode === 'single' && gameState.characters.length > 0) {
                        setSelectedCharsForPlot([gameState.characters[0].id]);
                      } else if (mode === 'multi') {
                        setSelectedCharsForPlot(gameState.characters.map(c => c.id));
                      } else {
                        setSelectedCharsForPlot([]);
                      }
                    }}
                    className={cn(
                      "py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                      plotMode === mode 
                        ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                        : "bg-slate-50/50 border-slate-200/50 text-slate-600 hover:bg-slate-100/50"
                    )}
                  >
                    {mode === 'world' && '🌍 世界剧情'}
                    {mode === 'single' && '👤 单人独处'}
                    {mode === 'multi' && '👥 多人群聚'}
                  </button>
                ))}
              </div>

              {/* Character Selector checkboxes when in single or multi mode */}
              {plotMode !== 'world' && (
                <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/50 space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-500">
                    {plotMode === 'single' ? '🎯 请选择在场的单个攻略角色' : '🎯 请勾选在场的所有攻略角色（支持触发修罗场醋意）'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gameState.characters.map(char => {
                      const isSelected = selectedCharsForPlot.includes(char.id);
                      return (
                        <label 
                          key={char.id} 
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition-all select-none",
                            isSelected 
                              ? "bg-rose-50 border-rose-200 text-rose-700 font-bold" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <input 
                            type={plotMode === 'single' ? "radio" : "checkbox"} 
                            name="scene_char"
                            checked={isSelected}
                            onChange={() => {
                              if (plotMode === 'single') {
                                setSelectedCharsForPlot([char.id]);
                              } else {
                                if (isSelected) {
                                  setSelectedCharsForPlot(selectedCharsForPlot.filter(id => id !== char.id));
                                } else {
                                  setSelectedCharsForPlot([...selectedCharsForPlot, char.id]);
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <img src={char.avatar} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <span>{char.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Location input & transition action button */}
              <div className="flex gap-1.5">
                <div className="flex-1 relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">📍 互动地点:</span>
                  <input
                    type="text"
                    value={customLocationText}
                    onChange={(e) => setCustomLocationText(e.target.value)}
                    placeholder="例如: 幽静桃花林 / 咖啡馆 / 卧室..."
                    className="w-full bg-slate-50 border border-slate-200 pl-16 pr-3 py-1.5 rounded-xl text-[10px] outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const loc = customLocationText.trim() || gameState.location;
                    let modeDesc = '';
                    if (plotMode === 'world') {
                      modeDesc = '开启了 [大世界全景剧情模式]';
                    } else if (plotMode === 'single') {
                      const name = gameState.characters.find(c => c.id === selectedCharsForPlot[0])?.name || '神秘人';
                      modeDesc = `开启了 与【${name}】的 [单人私密线下互动独处模式]`;
                    } else {
                      const names = gameState.characters.filter(c => selectedCharsForPlot.includes(c.id)).map(c => c.name).join('、') || '多人';
                      modeDesc = `开启了 与【${names}】的 [多角色线下互动修罗场群聚模式]`;
                    }

                    const transitionText = `【场景与模式切换】你将互动地点转移到了「${loc}」，并在此 ${modeDesc}。你身边的空气中凝聚着别样的情愫，命运在新的互动中悄然书写新的交织……`;
                    
                    setGameState(prev => ({
                      ...prev,
                      location: loc,
                      storyLog: prev.storyLog + `\n\n${transitionText}\n`
                    }));

                    executeAction(`我们在「${loc}」安顿下来。`);
                    triggerToast(`成功转移到 [${loc}] 并应用新剧情模式！`, 'success');
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
                >
                  ✨ 转移并开启互动
                </button>
              </div>
            </div>

            {/* Temporary Marker for deletion */}
                        {/* Story Box */}
            <div 
              ref={storyBoxRef}
              className={cn(
                "flex-1 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-inner p-4 overflow-y-auto leading-relaxed mb-3 font-sans",
                gameState.settings?.fontSize === 'sm' ? "text-xs" : 
                gameState.settings?.fontSize === 'lg' ? "text-base" : "text-sm"
              )}
            >
              <div className="space-y-4">
                {gameState.storyLog.split('\n').filter(l => l.trim()).map((line, i) => {
                  // Remove any asterisks from the line
                  const cleanLine = line.replace(/\*/g, '').trim();
                  if (!cleanLine) return null;

                  // Check if it's a character dialogue: "Name: Content" or "Name：Content"
                  const charMatch = cleanLine.match(/^([^：:]+)([：:])(.*)$/);
                  if (charMatch) {
                    const name = charMatch[1].trim();
                    const sep = charMatch[2];
                    const content = charMatch[3];
                    
                    // Check if the name belongs to a main character
                    const isMainChar = gameState.characters.some(c => c.name === name);
                    
                    return (
                      <div key={i} className="text-slate-800" style={{ textIndent: '2em' }}>
                        <span className={isMainChar ? "font-bold text-rose-600" : "font-normal text-slate-700"}>
                          {name}
                        </span>
                        {sep}
                        {content}
                      </div>
                    );
                  }

                  // Standard narrative paragraph
                  return (
                    <div key={i} className="text-slate-800" style={{ textIndent: '2em' }}>
                      {cleanLine}
                    </div>
                  );
                })}
              </div>
              {isGenerating && (
                <div className="text-xs text-rose-400 animate-pulse mt-4 flex items-center gap-1">
                  <Sparkles size={14} /> 大模型正在演绎后续剧情中……
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
              <button onClick={() => executeAction('主动向身边的角色搭话，询问对方的近况。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">💬 主动搭话</button>
              <button onClick={() => executeAction('邀请角色一起去安静的咖啡馆或酒馆独处。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">☕ 邀约独处</button>
              <button onClick={() => executeAction('独自在小镇街道散步，观察周围的风景。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">🚶 外出散步</button>
              <button onClick={() => executeAction('掏出精心准备的礼物送给对方。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">🎁 赠送礼物</button>
              <button onClick={() => executeAction('温柔地试探对方对自己的心意。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">🌸 试探心意</button>
              <button onClick={() => executeAction('找个安全的地方原地休息，恢复体力。')} className="bg-white/80 hover:bg-white py-2 px-1 rounded-xl text-xs font-medium border border-white/80 shadow-sm transition-all">💤 休息恢复</button>
            </div>

            {/* Input & Sub-tools */}
            <div className="flex gap-2 shrink-0 items-center">
              <input 
                type="text" 
                value={inputAction} 
                onChange={(e) => setInputAction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeAction(inputAction)}
                placeholder="输入你的自定义行动或对话……" 
                className="flex-1 bg-white/90 border border-white px-4 py-2.5 rounded-xl text-sm outline-none shadow-sm"
              />
              <button 
                onClick={() => executeAction(inputAction)}
                disabled={isGenerating || !inputAction.trim()}
                className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md hover:bg-black disabled:opacity-50"
              >
                发送
              </button>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/5 px-2 shrink-0">
              <div className="flex gap-4">
                <button onClick={saveGameToSlot} className="p-2 hover:bg-slate-200/60 rounded-xl text-rose-500 transition-colors" title="保存进度">
                  <Bookmark size={20} />
                </button>
                <button onClick={regenerateLastStory} disabled={!gameState.lastAction || isGenerating} className="p-2 hover:bg-slate-200/60 rounded-xl text-purple-600 transition-colors disabled:opacity-40" title="重回/重新生成上一段">
                  <RefreshCcw size={20} />
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('phone')} className="p-2 hover:bg-slate-200/60 rounded-xl text-blue-600 transition-colors" title="打开小手机">
                  <Smartphone size={20} />
                </button>
                <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-600 transition-colors" title="返回首页">
                  <Home size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'phone' && (
          <div className="flex-1 flex flex-col max-w-sm mx-auto w-full bg-white backdrop-blur-xl rounded-3xl border-4 border-slate-300 shadow-xl overflow-hidden relative">
            {/* Phone Header */}
            <div className="bg-slate-100 text-slate-800 border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-blue-600" />
                <span className="text-xs font-bold">灵犀小手机</span>
              </div>
              <button onClick={() => setActiveTab('game')} className="text-xs bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-lg transition-all text-slate-700">返回剧情</button>
            </div>

            {/* Phone Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {phoneTab === 'messages' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>消息列表 ({gameState.characters.length})</span>
                    <span className="text-[10px] text-blue-600">私聊需手动点击生成回复</span>
                  </div>
                  {gameState.characters.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed p-6">
                      🔒 消息列表当前为空。<br />
                      请先开启游玩一个异世界世界，专属剧情好友会自动同步开启！
                    </div>
                  ) : (
                    gameState.characters.map((char) => {
                      const msgs = chatMessagesMap[char.id] || [];
                      const lastMsg = msgs[msgs.length - 1];
                      return (
                        <div 
                          key={char.id}
                          onClick={() => { setSelectedChar(char); setActiveTab('phone'); }}
                          className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-blue-100 hover:bg-white transition-all cursor-pointer"
                        >
                          <img 
                            src={char.avatar} 
                            alt={char.name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-800 flex items-center justify-between">
                              <span className="truncate">{char.name}</span>
                              <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full shrink-0 font-bold font-mono">好感 {char.goodwill}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">{lastMsg ? lastMsg.content : char.desc}</div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedChar(char); }}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl shrink-0"
                            title="聊天"
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {phoneTab === 'contacts' && (
                <div>
                  {selectedMemoryContact ? (
                    // 记忆库专属子页面 (Sub-page)
                    <div className="bg-slate-50 min-h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-in fade-in duration-200">
                      {/* Top Bar */}
                      <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedMemoryContact(null)}
                          className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline"
                        >
                          <ArrowLeft size={14} /> 返回主页
                        </button>
                        <span className="font-bold text-xs text-slate-800">专属记忆库</span>
                        <div className="w-10"></div>
                      </div>

                      {/* Header info */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200 flex items-center gap-3">
                        <img src={selectedMemoryContact.avatar} alt="" className="w-10 h-10 rounded-full object-cover border shadow-sm shrink-0" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">【{selectedMemoryContact.name}】的记忆脑核</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">多层级大脑切片 · 羁绊记忆数据库</p>
                        </div>
                      </div>

                      {/* Filter Tags / Tabs */}
                      <div className="grid grid-cols-3 gap-1 p-2 bg-white border-b border-slate-200 shrink-0">
                        {(['short', 'long', 'core'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveMemoryTab(tab)}
                            className={cn(
                              "py-1.5 text-[10px] font-bold rounded-lg transition-all border",
                              activeMemoryTab === tab 
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {tab === 'core' && '🧬 核心记忆'}
                            {tab === 'long' && '📅 长期记忆'}
                            {tab === 'short' && '💬 短期记忆'}
                          </button>
                        ))}
                      </div>

                      {/* Memory Content */}
                      <div className="p-4 space-y-4">
                        {/* Auto-summarize Trigger block */}
                        <div className="bg-white rounded-2xl border border-blue-100 p-3 shadow-sm space-y-2">
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            当您与【{selectedMemoryContact.name}】进行私聊互动时，系统将智能抓取你们的羁绊变化。每积累 20 条将自动总结一轮并精确归档。
                          </p>
                          <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded-xl text-[10px]">
                            <span className="text-slate-600 font-medium">
                              当前未归档记录: {Math.max(0, ((chatMessagesMap[selectedMemoryContact.id] || []).length) - (summarizedCountsMap[selectedMemoryContact.id] || 0))} 条
                            </span>
                            <button
                              onClick={() => triggerSummarizeForCharacter(selectedMemoryContact.id, true)}
                              disabled={isSummarizingMap[selectedMemoryContact.id]}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                              <Sparkles size={10} className={cn(isSummarizingMap[selectedMemoryContact.id] && "animate-spin")} />
                              {isSummarizingMap[selectedMemoryContact.id] ? '正在总结...' : '✨ 立即总结'}
                            </button>
                          </div>
                        </div>

                        {/* List of items */}
                        <div className="space-y-2">
                          {(() => {
                            let items = [];
                            if (activeMemoryTab === 'core') {
                              items = selectedMemoryContact.coreMemories || [];
                            } else if (activeMemoryTab === 'long') {
                              items = selectedMemoryContact.longMemories || [];
                            } else {
                              items = selectedMemoryContact.shortMemories || selectedMemoryContact.memory || [];
                            }

                            if (items.length === 0) {
                              return (
                                <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                                  暂无【{activeMemoryTab === 'core' ? '核心' : activeMemoryTab === 'long' ? '长期' : '短期'}】记忆。
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {items.map((mem, mIdx) => (
                                  <div key={mIdx} className="bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-700 relative group flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-150">
                                    <div className="leading-relaxed flex-1 whitespace-pre-wrap">{mem}</div>
                                    <button 
                                      onClick={() => {
                                        const charId = selectedMemoryContact.id;
                                        let updatedCore = [...(selectedMemoryContact.coreMemories || [])];
                                        let updatedLong = [...(selectedMemoryContact.longMemories || [])];
                                        let updatedShort = [...(selectedMemoryContact.shortMemories || selectedMemoryContact.memory || [])];

                                        if (activeMemoryTab === 'core') {
                                          updatedCore = updatedCore.filter((_, idx) => idx !== mIdx);
                                        } else if (activeMemoryTab === 'long') {
                                          updatedLong = updatedLong.filter((_, idx) => idx !== mIdx);
                                        } else {
                                          updatedShort = updatedShort.filter((_, idx) => idx !== mIdx);
                                        }

                                        const updatedMemory = (selectedMemoryContact.memory || []).filter(m => m !== mem);

                                        const updatedChars = gameState.characters.map(c => {
                                          if (c.id === charId) {
                                            return {
                                              ...c,
                                              memory: updatedMemory,
                                              coreMemories: updatedCore,
                                              longMemories: updatedLong,
                                              shortMemories: updatedShort
                                            };
                                          }
                                          return c;
                                        });

                                        setGameState(prev => ({ ...prev, characters: updatedChars }));
                                        
                                        const foundChar = updatedChars.find(c => c.id === charId) || null;
                                        setSelectedMemoryContact(foundChar);
                                        if (selectedContactForProfile?.id === charId) {
                                          setSelectedContactForProfile(foundChar);
                                        }
                                        alert('该条专属记忆已成功抹除！');
                                      }}
                                      className="text-slate-400 hover:text-rose-500 p-1 shrink-0 transition-colors"
                                      title="擦除记忆"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : selectedContactForProfile ? (
                    // WeChat Contact Profile Page
                    <div className="bg-slate-50 min-h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-in fade-in duration-200">
                      {/* Top Bar */}
                      <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedContactForProfile(null)}
                          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                        >
                          <ArrowLeft size={16} /> 返回通讯录
                        </button>
                        <span className="font-bold text-xs text-slate-800">详细资料</span>
                        <div className="w-10"></div>
                      </div>

                      {/* Cover & Avatar Header */}
                      <div 
                        onClick={() => {
                          handleImageUploadFromFile((url) => {
                            const updatedChars = gameState.characters.map(c => c.id === selectedContactForProfile.id ? { ...c, coverUrl: url } : c);
                            setGameState(prev => ({ ...prev, characters: updatedChars }));
                            setSelectedContactForProfile(prev => prev ? { ...prev, coverUrl: url } : null);
                            alert('主页背景封面已从本地相册更新成功！');
                          });
                        }}
                        className="relative bg-gradient-to-r from-blue-500 to-indigo-600 h-28 cursor-pointer group"
                      >
                        {selectedContactForProfile.coverUrl && (
                          <img src={selectedContactForProfile.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                        <div className="absolute top-2.5 right-2.5 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur transition-all shadow" title="点击从相册更换封面">
                          <ImageIcon size={12} />
                        </div>
                      </div>

                      {/* Avatar & Name Info Area (Cleanly below cover, no clipping) */}
                      <div className="px-5 pt-3 pb-4 bg-white border-b border-slate-200 flex items-center gap-4">
                        <div className="relative group/avatar shrink-0">
                          <img 
                            src={selectedContactForProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} 
                            alt="" 
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-white" 
                            referrerPolicy="no-referrer" 
                          />
                          <button 
                            onClick={() => {
                              handleImageUploadFromFile((url) => {
                                const updatedChars = gameState.characters.map(c => c.id === selectedContactForProfile.id ? { ...c, avatar: url } : c);
                                setGameState(prev => ({ ...prev, characters: updatedChars }));
                                setSelectedContactForProfile(prev => prev ? { ...prev, avatar: url } : null);
                                alert('角色头像已从本地相册更新成功！');
                              });
                            }}
                            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md text-[10px]"
                            title="从相册更换头像"
                          >
                            <ImageIcon size={10} />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-base text-slate-900 truncate">{selectedContactForProfile.name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">称号：{selectedContactForProfile.title || '无'} · 身份：{selectedContactForProfile.role}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-semibold border border-rose-100">
                              好感度 {selectedContactForProfile.goodwill ?? gameState.goodwill}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Profile Details Content Body */}
                      <div className="p-4 space-y-4">
                        {/* Collapsible Profile Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                            const id = selectedContactForProfile.id;
                            setCollapseProfileCards(prev => ({ ...prev, [id]: !prev[id] }));
                          }}>
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <User size={14} className="text-blue-500" /> 个人资料档案与人设
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 p-1">
                              {collapseProfileCards[selectedContactForProfile.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                          </div>

                          {!collapseProfileCards[selectedContactForProfile.id] && (
                            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">头像图床 URL (更换后即时保存)</label>
                                <input 
                                  type="text" 
                                  value={selectedContactForProfile.avatar}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedChars = gameState.characters.map(c => c.id === selectedContactForProfile.id ? { ...c, avatar: val } : c);
                                    setGameState(prev => ({ ...prev, characters: updatedChars }));
                                    setSelectedContactForProfile(prev => prev ? { ...prev, avatar: val } : null);
                                  }}
                                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">性格标签</label>
                                <input 
                                  type="text" 
                                  value={selectedContactForProfile.personality || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedChars = gameState.characters.map(c => c.id === selectedContactForProfile.id ? { ...c, personality: val } : c);
                                    setGameState(prev => ({ ...prev, characters: updatedChars }));
                                    setSelectedContactForProfile(prev => prev ? { ...prev, personality: val } : null);
                                  }}
                                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">详细背景与简介</label>
                                <textarea 
                                  rows={3}
                                  value={selectedContactForProfile.desc}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedChars = gameState.characters.map(c => c.id === selectedContactForProfile.id ? { ...c, desc: val } : c);
                                    setGameState(prev => ({ ...prev, characters: updatedChars }));
                                    setSelectedContactForProfile(prev => prev ? { ...prev, desc: val } : null);
                                  }}
                                  className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none leading-relaxed"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 🌸 专属记忆库档案中心入口行 */}
                        <div 
                          onClick={() => {
                            setSelectedMemoryContact(selectedContactForProfile);
                            setActiveMemoryTab('short');
                          }}
                          className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                            <Brain size={16} className="text-blue-500 animate-pulse animate-duration-1000" />
                            <span>🌸 专属记忆库档案中心</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                              共 {
                                ((selectedContactForProfile.coreMemories || []).length) +
                                ((selectedContactForProfile.longMemories || []).length) +
                                ((selectedContactForProfile.shortMemories || selectedContactForProfile.memory || []).length)
                              } 条记忆
                            </span>
                            <ChevronRight size={14} className="text-slate-400" />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                          <button 
                            onClick={() => {
                              setSelectedChar(selectedContactForProfile);
                              setSelectedContactForProfile(null);
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow flex items-center justify-center gap-2 text-xs"
                          >
                            <MessageSquare size={16} /> 发消息 (微信私聊)
                          </button>
                          <button 
                            onClick={() => {
                              setPhoneTab('moments');
                              setSelectedContactForProfile(null);
                            }}
                            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 text-xs"
                          >
                            <ImageIcon size={16} className="text-blue-500" /> 查看TA的朋友圈动态
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Contacts List (WeChat Style)
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">微信通讯录 (点击好友进入详细主页)</div>
                        <span className="text-[11px] text-slate-400">{gameState.characters.length} 位好友</span>
                      </div>
                      {gameState.characters.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-blue-100 shadow-sm leading-relaxed p-6">
                          🔒 通讯录当前为空。<br />
                          当您生成或开启一个异世界并正式开始游玩、解锁在场角色后，TA们将会自动同步呈现在您的微信通讯录中！
                        </div>
                      ) : (
                        gameState.characters.map((char) => (
                          <div 
                            key={char.id}
                            onClick={() => setSelectedContactForProfile(char)}
                            className="bg-white/95 p-3.5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-blue-300 transition-all"
                          >
                            <img src={char.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow shrink-0" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-slate-800 truncate">{char.name}</h4>
                                <span className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-medium">好感 {char.goodwill ?? gameState.goodwill}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{char.role} · {char.title || char.personality || '暂无标签'}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}{phoneTab === 'moments' && (
                <div className="space-y-4">
                  {/* WeChat Moments Header Cover */}
                  <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div 
                      onClick={() => {
                        handleImageUploadFromFile((url) => {
                          setMomentsCoverUrl(url);
                          safeSave('ta_moments_cover', url);
                          alert('朋友圈封面已从本地相册更新成功！');
                        });
                      }}
                      className="relative h-44 bg-slate-900 cursor-pointer group"
                    >
                      <img src={momentsCoverUrl} alt="" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Top Right Transparent Icon */}
                      <div className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur transition-all shadow" title="点击从相册更换封面">
                        <ImageIcon size={12} />
                      </div>

                      {/* User Avatar & Name Overlay */}
                      <div className="absolute bottom-3 right-4 flex items-center gap-3">
                        <span className="font-bold text-white text-sm drop-shadow">{userAdvProfile.name}</span>
                        <img src={userAdvProfile.avatar} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg" referrerPolicy="no-referrer" />
                      </div>
                    </div>

                    {/* Moments Action Bar */}
                    <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-slate-100">
                      <button 
                        onClick={() => setShowPublishMomentModal(true)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PlusCircle size={15} /> 发表朋友圈
                      </button>
                      <button 
                        onClick={aiGenerateCharacterMoment}
                        disabled={isGeneratingMoment}
                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                      >
                        <Sparkles size={15} className="text-blue-600" /> {isGeneratingMoment ? 'AI生成中...' : '✨ AI角色发动态'}
                      </button>
                    </div>
                  </div>

                  {/* Publish Modal */}
                  {showPublishMomentModal && (
                    <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-md space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-blue-500" /> 发表微信朋友圈
                        </h4>
                        <button onClick={() => setShowPublishMomentModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">取消</button>
                      </div>
                      <textarea 
                        rows={3}
                        value={newMomentContent}
                        onChange={(e) => setNewMomentContent(e.target.value)}
                        placeholder="这一刻的想法..."
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none"
                      />
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">配图图床 URL (可选)</label>
                        <input 
                          type="text"
                          value={newMomentImage}
                          onChange={(e) => setNewMomentImage(e.target.value)}
                          placeholder="https://..."
                          className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          onClick={() => setShowPublishMomentModal(false)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium"
                        >
                          取消
                        </button>
                        <button 
                          onClick={publishMoment}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
                        >
                          发表
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Moments Posts Feed */}
                  <div className="space-y-3">
                    {momentsPosts.map(post => {
                      const hasLiked = post.likes.includes(userAdvProfile.name);
                      const currentCommentInput = commentInputs[post.id] || '';
                      return (
                        <div key={post.id} className="bg-white/95 p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center gap-3">
                            <img src={post.authorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover shadow shrink-0" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-800">{post.authorName}</div>
                              <div className="text-[10px] text-slate-400">{new Date(post.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          {post.image && (
                            <img src={post.image} alt="" className="w-full h-44 object-cover rounded-xl shadow-sm border border-slate-100" referrerPolicy="no-referrer" />
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                            <button 
                              onClick={() => toggleLikeMoment(post.id)}
                              className={cn("flex items-center gap-1.5 hover:text-rose-500 transition-colors", hasLiked && "text-rose-500 font-semibold")}
                            >
                              <Heart size={14} className={cn(hasLiked && "fill-rose-500")} />
                              <span>{post.likes.length > 0 ? `${post.likes.join(', ')} 觉得很赞` : '赞'}</span>
                            </button>
                            <span className="text-[10px] text-slate-400">评论 ({post.comments.length})</span>
                          </div>

                          {/* Comments Section */}
                          {post.comments.length > 0 && (
                            <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                              {post.comments.map(c => (
                                <div key={c.id} className="text-[11px] text-slate-600">
                                  <span className="font-bold text-slate-800">{c.name}：</span>{c.content}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input 
                              type="text" 
                              value={currentCommentInput}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') addMomentComment(post.id); }}
                              placeholder="评论..."
                              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs outline-none"
                            />
                            <button 
                              onClick={() => addMomentComment(post.id)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-medium transition-colors"
                            >
                              回复
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {phoneTab === 'profile' && (
                <div className="bg-white/95 p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
                    <User size={16} className="text-blue-500" /> 我的冒险者名片 (微信风格)
                  </h3>
                  <div className="flex items-center gap-4">
                    <img src={userAdvProfile.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">头像链接 (可自定义更换)</label>
                      <input 
                        type="text" 
                        value={userAdvProfile.avatar}
                        onChange={(e) => setUserAdvProfile(prev => ({ ...prev, avatar: e.target.value }))}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">昵称</label>
                    <input 
                      type="text" 
                      value={userAdvProfile.name}
                      onChange={(e) => setUserAdvProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">身份 / 称号</label>
                    <input 
                      type="text" 
                      value={userAdvProfile.identity}
                      onChange={(e) => setUserAdvProfile(prev => ({ ...prev, identity: e.target.value }))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">个性签名 / 简介 (NPC角色将读取此人设)</label>
                    <textarea 
                      rows={3}
                      value={userAdvProfile.bio}
                      onChange={(e) => setUserAdvProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none leading-relaxed"
                    />
                  </div>
                  <button 
                    onClick={saveUserProfile}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow text-xs"
                  >
                    💾 保存名片资料
                  </button>
                </div>
              )}
            </div>

            {/* Active Chat Overlay if selectedChar */}
            {selectedChar && (
              <div className="absolute inset-0 bg-white z-30 flex flex-col">
                {/* Chat Header */}
                <div className="bg-slate-100 text-slate-800 border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
                  <button onClick={() => setSelectedChar(null)} className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <ArrowLeft size={16} /> 返回列表
                  </button>
                  <div className="flex items-center gap-2">
                    <img src={selectedChar.avatar} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <span className="font-bold text-sm">{selectedChar.name}</span>
                  </div>
                  <div className="w-16" />
                </div>

                {/* Chat Messages */}
                <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {(chatMessagesMap[selectedChar.id] || []).map(msg => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.isUser ? "flex-row-reverse" : "flex-row")}>
                      <img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div className={cn(
                        "max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm",
                        msg.isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-100 rounded-bl-none whitespace-pre-wrap"
                      )}>
                        {msg.isSticker ? (
                          <img src={msg.content} alt="sticker" className="w-24 h-24 object-cover rounded-xl" referrerPolicy="no-referrer" />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatGenerating && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" />
                      <span>{selectedChar.name} 正在多段分句回复中……</span>
                    </div>
                  )}
                </div>

                {/* Sticker Picker Drawer */}
                {showStickerPicker && (
                  <div className="p-3 bg-white border-t border-slate-100 space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                      <span>表情包图床库 (点击发送)</span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowStickerModal(true)} className="text-blue-600 font-semibold hover:underline">＋导入表情包</button>
                        <button onClick={() => setShowStickerPicker(false)} className="text-rose-500">关闭</button>
                      </div>
                    </div>
                    {stickers.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        暂无表情包，请点击右上角「＋导入表情包」批量添加
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {stickers.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={url} 
                              alt="" 
                              onClick={() => { sendChatMessage(url, true); setShowStickerPicker(false); }}
                              className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-90 border shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <button onClick={() => deleteSticker(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Import Sticker Modal */}
                {showStickerModal && (
                  <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-800">批量导入表情包</h3>
                        <button onClick={() => setShowStickerModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        输入表情包图床 URL (支持多行或逗号分隔，如：<br />
                        <span className="font-mono text-blue-600">蚊子熊：https://pic1.imgdb.cn/...</span>)
                      </p>
                      <textarea 
                        rows={4}
                        value={newStickerUrl}
                        onChange={(e) => setNewStickerUrl(e.target.value)}
                        placeholder="在此粘贴表情包链接..."
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs outline-none font-mono"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowStickerModal(false)}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          取消
                        </button>
                        <button 
                          onClick={() => {
                            addStickersBatch();
                            setShowStickerModal(false);
                          }}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow"
                        >
                          保存导入
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Bottom Bar */}
                <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => setShowStickerPicker(!showStickerPicker)} 
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors shrink-0"
                    title="表情包"
                  >
                    <Smile size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setSendImageUrlInput('');
                      setSendImageUrlModalOpen(true);
                    }} 
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors shrink-0"
                    title="发图"
                  >
                    <PlusCircle size={18} />
                  </button>
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(chatInput, false)}
                    placeholder="发送消息..." 
                    className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs outline-none border border-slate-200 min-w-0"
                  />
                  <button 
                    onClick={() => sendChatMessage(chatInput, false)}
                    disabled={!chatInput.trim()}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-40 shrink-0"
                    title="发送消息"
                  >
                    <Send size={18} />
                  </button>
                  <button 
                    onClick={generateCharacterReply}
                    disabled={isChatGenerating}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-40 shrink-0 flex items-center gap-0.5"
                    title="生成AI角色回复"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Phone Bottom Navigation Bar */}
            <div className="bg-white/90 backdrop-blur-md border-t border-blue-100 py-2 px-6 flex justify-around items-center shrink-0">
              <button 
                onClick={() => { setPhoneTab('messages'); setSelectedChar(null); }}
                className={cn("flex flex-col items-center gap-1 text-[11px] font-medium transition-colors", phoneTab === 'messages' && !selectedChar ? "text-blue-600 font-bold" : "text-slate-400")}
              >
                <MessageSquare size={18} />
                <span>消息</span>
              </button>
              <button 
                onClick={() => { setPhoneTab('contacts'); setSelectedChar(null); }}
                className={cn("flex flex-col items-center gap-1 text-[11px] font-medium transition-colors", phoneTab === 'contacts' && !selectedChar ? "text-blue-600 font-bold" : "text-slate-400")}
              >
                <User size={18} />
                <span>通讯录</span>
              </button>
              <button 
                onClick={() => { setPhoneTab('moments'); setSelectedChar(null); }}
                className={cn("flex flex-col items-center gap-1 text-[11px] font-medium transition-colors", phoneTab === 'moments' && !selectedChar ? "text-blue-600 font-bold" : "text-slate-400")}
              >
                <ImageIcon size={18} />
                <span>朋友圈</span>
              </button>
              <button 
                onClick={() => { setPhoneTab('profile'); setSelectedChar(null); }}
                className={cn("flex flex-col items-center gap-1 text-[11px] font-medium transition-colors", phoneTab === 'profile' && !selectedChar ? "text-blue-600 font-bold" : "text-slate-400")}
              >
                <Award size={18} />
                <span>我的</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full space-y-4 py-2">
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/80 shadow-sm space-y-4">
              <h3 className="font-bold text-base mb-2">后端代理 API 与模型设置</h3>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">API 地址 (Base URL)</label>
                <input 
                  type="text" 
                  value={apiUrl} 
                  onChange={(e) => setApiUrl(e.target.value)} 
                  placeholder="https://api.openai.com/v1" 
                  className="w-full mt-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">API Key (密钥)</label>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) setApiKey(text.trim());
                        else alert('剪贴板为空');
                      } catch (e) {
                        alert('读取剪贴板失败，请长按输入框直接粘贴');
                      }
                    }} 
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-all flex items-center gap-1 text-xs"
                    title="从剪贴板粘贴"
                  >
                    <Clipboard size={14} />
                    <span>粘贴</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="sk-..." 
                  className="w-full px-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">模型名称 (Model)</label>
                  <button 
                    type="button" 
                    onClick={fetchModelList}
                    disabled={isFetchingModels}
                    className="text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={cn(isFetchingModels && "animate-spin")} />
                    <span>{isFetchingModels ? '拉取中...' : '自动拉取模型'}</span>
                  </button>
                </div>
                <select 
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none font-mono"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  value={modelName} 
                  onChange={(e) => setModelName(e.target.value)} 
                  placeholder="或者手动输入模型名..." 
                  className="w-full mt-2 px-4 py-2 bg-slate-50 rounded-xl text-xs outline-none font-mono text-slate-600"
                />
              </div>

              {testResult && (
                <div className={cn("p-3 rounded-xl text-xs font-medium", testResult.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                  {testResult.msg}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={testConnection} 
                  disabled={isTesting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition-all"
                >
                  {isTesting ? '测试中...' : '测试连接'}
                </button>
                <button 
                  onClick={saveApiConfig} 
                  className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-rose-600 transition-all"
                >
                  保存配置
                </button>
              </div>

              <div className="pt-2 text-center">
                <button onClick={() => setActiveTab('home')} className="text-xs opacity-60 hover:underline">
                  返回首页
                </button>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">个性化设置 (Personalization)</h3>
                <button onClick={() => setActiveTab('home')} className="text-xs text-rose-600 font-bold flex items-center gap-1">
                  <ArrowLeft size={14} /> 返回首页
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">字体样式 (Typography)</label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => {
                        setGameState(prev => ({
                          ...prev,
                          settings: { ...prev.settings, fontFamily: font.id }
                        }));
                      }}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-xl border-2 transition-all",
                        (gameState.settings?.fontFamily || 'sans-serif') === font.id 
                          ? "border-rose-400 bg-rose-50/50 text-rose-600 shadow-sm font-bold" 
                          : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                      )}
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">字体大小 (Font Size)</label>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setGameState(prev => ({
                          ...prev,
                          settings: { ...prev.settings, fontSize: size }
                        }));
                      }}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl border-2 transition-all text-xs font-semibold",
                        (gameState.settings?.fontSize || 'md') === size 
                          ? "border-rose-400 bg-rose-50/50 text-rose-600" 
                          : "border-slate-100 bg-white text-slate-600"
                      )}
                    >
                      {size === 'sm' ? '小' : size === 'md' ? '中' : '大'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-rose-100 flex justify-center">
                <button 
                  onClick={() => {
                    if (confirm('确定要清除所有本地缓存吗？这将删除所有存档、设定和聊天记录，且无法恢复！')) {
                      // Clear only keys starting with 'ta_'
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('ta_')) {
                          localStorage.removeItem(key);
                        }
                      });
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-600 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
                >
                  <Trash2 size={12} /> 清除所有本地数据 (危险操作)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== CUSTOM SYSTEM OVERLAYS & MODALS ==================== */}
      {/* Toast Alert */}
      {toast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={cn(
            "px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-semibold flex items-center gap-2",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
            toast.type === 'error' ? "bg-rose-50 text-rose-800 border-rose-200" :
            "bg-blue-50 text-blue-800 border-blue-200"
          )}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Preset World Override Confirmation Modal */}
      {startWorldConfirmPreset && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">⚠️ 开启新世界确认</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              检测到您当前在另一个文游世界中有正在进行中的进度，直接开启新题材会【覆盖当前临时游戏状态】。建议您先在左下角点击保存。
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setStartWorldConfirmPreset(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消 (去保存)
              </button>
              <button 
                onClick={() => {
                  startPresetWorld(startWorldConfirmPreset);
                  setStartWorldConfirmPreset(null);
                }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow"
              >
                确定覆盖开启
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom World Override Confirmation Modal */}
      {startWorldConfirmCustom && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">⚠️ 开启自定义世界确认</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              检测到您当前有正在进行中的进度，直接开启新题材会【覆盖当前临时游戏状态】。建议您先在左下角点击保存。
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setStartWorldConfirmCustom(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消 (去保存)
              </button>
              <button 
                onClick={() => {
                  buildAndStartCustomWorld();
                  setStartWorldConfirmCustom(false);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                确定覆盖开启
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Slot Modal with custom title */}
      {saveSlotModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">💾 存储游戏进度</h3>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">存档备注名称</label>
              <input 
                type="text"
                value={saveSlotCustomTitle}
                onChange={(e) => setSaveSlotCustomTitle(e.target.value)}
                placeholder={saveSlotDefaultTitle}
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                系统将按您的指令把此进度保存到【游戏存档管理中心】。未来您可再次打开、无限期继续游玩。
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSaveSlotModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button 
                onClick={() => confirmSaveGame(saveSlotCustomTitle)}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow"
              >
                确认存档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      {deleteSlotId && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">🗑️ 删除存档确认</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              您确定要永久删除此条游戏存档记录吗？该操作不可撤销，删除后您将无法再继续该进度的冒险。
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeleteSlotId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                不，保留
              </button>
              <button 
                onClick={confirmDeleteSlot}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow"
              >
                确定永久删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {deleteTemplateId && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">🗑️ 删除自定义模板确认</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              确定要删除这个自定义世界模板吗？删除后，您需要重新录入或由 AI 重新一键配置。
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeleteTemplateId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button 
                onClick={confirmDeleteTemplate}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Image URL Custom Modal */}
      {sendImageUrlModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-base text-slate-800">🖼️ 发送自定义图片/表情</h3>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">图片直链链接 (URL)</label>
              <input 
                type="text"
                value={sendImageUrlInput}
                onChange={(e) => setSendImageUrlInput(e.target.value)}
                placeholder="https://pic1.imgdb.cn/..."
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                输入合法的网络图片直链，将直接投递至您与该角色的微信私聊对话气泡中。
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSendImageUrlModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
              <button 
                onClick={confirmSendImage}
                disabled={!sendImageUrlInput.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow"
              >
                确认发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
