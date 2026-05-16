import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  ChevronRight, 
  Globe, 
  List, 
  Gamepad2, 
  ShoppingBag, 
  User,
  Eye,
  Lightbulb,
  Coins,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Smartphone,
  CreditCard,
  Wallet,
  MessageCircle,
  Gift,
  ChevronLeft,
  MoreHorizontal,
  Settings as SettingsIcon,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { cn } from '../../lib/utils';
import { AppSettings, BlindBox, Transaction, ChatMessage } from '../../types';

interface BlindBoxAppProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onClose: () => void;
  onSendMessage?: (msg: ChatMessage) => void;
  targetFriendId?: string;
}

const CATEGORIES = ['全部', '玩偶挂件', '电子设备', '成人用品', '零食大礼包', '限量版同款'];

const DEFAULT_BLIND_BOXES: BlindBox[] = [
  // 玩偶挂件
  {
    id: 'w1',
    name: '疯狂动物城 朱迪玩偶盲盒',
    description: '勇敢正义的兔警官朱迪，植绒材质手感极佳，配有警徽小挂件。',
    price: 59,
    coverUrl: 'https://images.unsplash.com/photo-1559445375-c7b73392a19c?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'w2',
    name: '疯狂动物城 狐尼克玩偶盲盒',
    description: '聪明机智的狐狸尼克，经典夏威夷衬衫造型，眼神深邃迷人。',
    price: 59,
    coverUrl: 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'w3',
    name: '迪士尼 水果植绒脸换系列挂件盲盒',
    description: '软萌水果造型，磁吸换脸设计，包含草莓熊、史迪仔等经典角色。',
    price: 69,
    coverUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'w4',
    name: 'Joke Bear 系列手办盲盒',
    description: '搞怪可爱的熊熊，每一款都是行走的表情包，治愈你的不开心。',
    price: 49,
    coverUrl: 'https://images.unsplash.com/photo-1531512073830-bb8a00c6a210?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'w5',
    name: 'YOYO 指环爱神系列盲盒',
    description: '浪漫爱神造型，底座可作为指环架使用，实用与美感兼具。',
    price: 79,
    coverUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'w6',
    name: '玲娜贝儿 郊游系列挂件盲盒',
    description: '达菲家族人气王，粉色小狐狸带你开启春日之旅，精致小背包可打开。',
    price: 89,
    coverUrl: 'https://images.unsplash.com/photo-1602738328654-51ab233958d5?w=400&h=400&fit=crop&q=80',
    category: '玩偶挂件',
    isCustom: false,
    addedAt: Date.now()
  },

  // 电子设备
  {
    id: 'e1',
    name: '极简机械键盘轴体盲盒',
    description: '随机顶级轴体（青/红/茶/黑/金），体验指尖的机械美学。',
    price: 129,
    coverUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'e2',
    name: '复古像素风蓝牙音箱盲盒',
    description: '怀旧像素屏幕，高保真音质，随机复古配色，支持APP自定义图案。',
    price: 199,
    coverUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'e3',
    name: '赛博朋克透明充电宝盲盒',
    description: '极客感十足的透明外壳，支持22.5W快充，随机容量与灯效。',
    price: 149,
    coverUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'e4',
    name: '萌宠造型无线耳机盲盒',
    description: '治愈系动物造型充电仓，降噪蓝牙5.3，音质纯净，惊喜隐藏款。',
    price: 299,
    coverUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'e5',
    name: '蒸汽波风格超大鼠标垫盲盒',
    description: '迷幻色彩设计，900x400mm超大尺寸，随机艺术图案，丝滑触感。',
    price: 39,
    coverUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },

  // 成人用品
  {
    id: 'a1',
    name: '杜蕾斯 尊享系列避孕套盲盒',
    description: '专为男性设计的尊享系列，包含至尊超薄、持久等多种经典款式。',
    price: 99,
    coverUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a2',
    name: '冈本 001 极薄系列盲盒',
    description: '追求极致触感，日本原装进口，随机包含不同包装与规格。',
    price: 129,
    coverUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a3',
    name: '杰士邦 零感系列盲盒',
    description: '零感体验，如丝般顺滑，随机赠送品牌周边小礼品。',
    price: 79,
    coverUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'e6',
    name: '智能氛围感桌面灯盲盒',
    description: '1600万色调节，声控律动，随机造型（云朵/宇航员/几何）。',
    price: 88,
    coverUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=400&h=400&fit=crop&q=80',
    category: '电子设备',
    isCustom: false,
    addedAt: Date.now()
  },

  // 成人用品
  {
    id: 'a1',
    name: '冈本 0.01 极薄限量盲盒',
    description: '专为男性设计，极致超薄体验，随机包含经典款、黄金款及隐藏黑金款。',
    price: 159,
    coverUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a2',
    name: '杜蕾斯 焕金系列 惊喜盲盒',
    description: '持久畅爽，专为男士打造的私密惊喜，随机包含不同功能体验装。',
    price: 99,
    coverUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a3',
    name: '丝绒触感 亲密伴侣盲盒',
    description: '极简设计，医用级硅胶，静音防水，随机震动模式。',
    price: 199,
    coverUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a4',
    name: '迷雾森林 气泡沐浴球盲盒',
    description: '舒缓疲劳，隐藏惊喜小礼物，随机香氛（薰衣草/薄荷）。',
    price: 29,
    coverUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a5',
    name: '幻影蕾丝 贴身衣物盲盒',
    description: '优雅设计，舒适材质，随机款式颜色，展现自信魅力。',
    price: 99,
    coverUrl: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'a6',
    name: '极光系列 水基润滑液盲盒',
    description: '丝滑体验，易清洗，清新香气，随机功能款（热感/凉感）。',
    price: 39,
    coverUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=400&h=400&fit=crop&q=80',
    category: '成人用品',
    isCustom: false,
    addedAt: Date.now()
  },

  // 零食大礼包
  {
    id: 's1',
    name: '环球美食 进口零食盲盒',
    description: '搜罗全球人气零食，足不出户吃遍世界，包含日韩欧美热销款。',
    price: 99,
    coverUrl: 'https://images.unsplash.com/photo-15994906592b3-e3f9c0754fe7?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 's2',
    name: '追剧必备 膨化食品盲盒',
    description: '咔嚓脆的快乐，随机大牌薯片、虾条、玉米片，分量十足。',
    price: 49,
    coverUrl: 'https://images.unsplash.com/photo-1592706209599-8094235d34f9?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 's3',
    name: '甜蜜告白 手工巧克力盲盒',
    description: '浓郁醇香，随机夹心口味（榛果/抹茶/酒心），每一口都是惊喜。',
    price: 79,
    coverUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 's4',
    name: '提神醒脑 咖啡挂耳盲盒',
    description: '精选产地豆，随机风味（耶加雪菲/曼特宁），开启元气满满的一天。',
    price: 59,
    coverUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 's5',
    name: '怀旧童年 经典零食盲盒',
    description: '找回儿时的味道，随机辣条、大白兔奶糖、无花果丝。',
    price: 39,
    coverUrl: 'https://images.unsplash.com/photo-1582142839970-2b9e04b60f25?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 's6',
    name: '健康轻食 低卡零食盲盒',
    description: '贪吃不胖，随机魔芋爽、鸡胸肉干、坚果包，健身党首选。',
    price: 69,
    coverUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop&q=80',
    category: '零食大礼包',
    isCustom: false,
    addedAt: Date.now()
  },

  // 限量版同款
  {
    id: 'l1',
    name: '库洛米 哥特萝莉限量盲盒',
    description: '酷飒甜美，暗黑系蕾丝设计，极高收藏价值，包含隐藏款黑金。',
    price: 129,
    coverUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'l2',
    name: '泡泡玛特 MOLLY 蒸汽朋克限量',
    description: '经典IP联动，金属质感涂装，细节拉满，随机附赠收藏卡。',
    price: 159,
    coverUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'l3',
    name: '暴力熊 200% 联名款盲盒',
    description: '潮流艺术单品，随机艺术家联名涂装，磨砂质感，摆件首选。',
    price: 399,
    coverUrl: 'https://images.unsplash.com/photo-1580441222772-640b91f8d441?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'l4',
    name: '三丽鸥 家族茶话会限量盲盒',
    description: '软萌聚会造型，精美底座，包含美乐蒂、玉桂狗等全员到齐。',
    price: 89,
    coverUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'l5',
    name: '漫威 英雄系列金属盲盒',
    description: '纯金属打造，质感厚重，随机超级英雄（钢铁侠/美队/蜘蛛侠）。',
    price: 199,
    coverUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  },
  {
    id: 'l6',
    name: '宝可梦 25周年纪念版盲盒',
    description: '经典皮卡丘造型，特殊金色涂装，情怀满分，极具升值潜力。',
    price: 149,
    coverUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400&h=400&fit=crop&q=80',
    category: '限量版同款',
    isCustom: false,
    addedAt: Date.now()
  }
];

export default function BlindBoxApp({ settings, onUpdateSettings, onClose, onSendMessage, targetFriendId }: BlindBoxAppProps) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [activeTab, setActiveTab] = useState('抽盒机');
  const [selectedBox, setSelectedBox] = useState<BlindBox | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [editingBox, setEditingBox] = useState<BlindBox | null>(null);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const boxImageInputRef = useRef<HTMLInputElement>(null);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);

  const customBoxes = (Array.isArray(settings.blindBoxes) ? settings.blindBoxes : []).filter(Boolean);
  const blindBoxes = [...customBoxes, ...DEFAULT_BLIND_BOXES.filter(db => !customBoxes.some(cb => cb && cb.id === db.id))];
  
  const filteredBoxes = (activeCategory === '全部' 
    ? blindBoxes 
    : blindBoxes.filter(box => box && box.category === activeCategory)).filter(Boolean);

  const coins = settings.blindBoxCoins || 0;
  const perspectiveCards = settings.perspectiveCards || 0;
  const hintCards = settings.hintCards || 0;
  const walletBalance = settings.walletBalance || 1000;

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ blindBoxBanner: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBoxImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBoxId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newUrl = reader.result as string;
        const existingCustom = customBoxes.find(b => b.id === editingBoxId);
        
        if (existingCustom) {
          onUpdateSettings({
            blindBoxes: customBoxes.map(b => b.id === editingBoxId ? { ...b, coverUrl: newUrl } : b)
          });
        } else {
          const defaultBox = DEFAULT_BLIND_BOXES.find(b => b.id === editingBoxId);
          if (defaultBox) {
            onUpdateSettings({
              blindBoxes: [...customBoxes, { ...defaultBox, coverUrl: newUrl, isCustom: true }]
            });
          }
        }
        setEditingBoxId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePurchase = (box: BlindBox, method: 'bank' | 'wallet', isGift: boolean, giftMessage?: string, friendId?: string) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: isGift ? 'gift_sent' : 'blindbox_purchase',
      amount: box.price,
      description: `${isGift ? '赠送' : '购买'}盲盒: ${box.name}`,
      timestamp: Date.now()
    };

    const updates: Partial<AppSettings> = {
      transactions: [newTransaction, ...(settings.transactions || [])]
    };

    if (method === 'wallet') {
      updates.walletBalance = walletBalance - box.price;
    }

    if (isGift && friendId && onSendMessage) {
      const giftMsg: ChatMessage = {
        role: 'user',
        content: giftMessage || `送你一个盲盒：${box.name}`,
        type: 'blindbox-gift',
        timestamp: Date.now(),
        giftData: {
          boxId: box.id,
          boxName: box.name,
          coverUrl: box.coverUrl,
          message: giftMessage || '祝你今天好心情！',
          price: box.price,
          isOpened: false
        }
      };
      onSendMessage(giftMsg);
    }

    onUpdateSettings(updates);
    setShowCheckout(false);
    setSelectedBox(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8f8f8] flex flex-col font-sans text-slate-800">
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
      <input type="file" ref={boxImageInputRef} className="hidden" accept="image/*" onChange={handleBoxImageUpload} />

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 flex items-center justify-between z-20">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronRight className="rotate-180" />
        </button>
        <h1 className="text-lg font-bold">盲盒机</h1>
        <button 
          onClick={() => setShowCustomModal(true)}
          className="p-2 bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {/* Banner */}
        <div className="px-4 py-2">
          <div 
            onClick={() => bannerInputRef.current?.click()}
            className="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-pink-100 relative shadow-sm cursor-pointer group"
          >
            <img 
              src={settings.blindBoxBanner || "https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=800&h=400&fit=crop&q=80"} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/40 to-transparent flex flex-col justify-center px-6">
              <span className="text-white font-bold text-xl drop-shadow-lg">YOYO 指环爱神系列</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-white/90 text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">点击更换封面 &gt;</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="text-white" size={32} />
            </div>
          </div>
        </div>

        {/* Categories - Sticky below header */}
        <div className="sticky top-0 bg-[#f8f8f8]/80 backdrop-blur-md z-10 px-4 py-4 flex overflow-x-auto gap-6 no-scrollbar border-b border-slate-100/50">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap text-sm transition-all relative pb-1",
                activeCategory === cat ? "text-slate-900 font-bold" : "text-slate-400"
              )}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div 
                  layoutId="activeCat"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-pink-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="grid grid-cols-2 gap-3 px-4">
          {filteredBoxes.map((box, idx) => (
            <motion.div 
              key={`${box.id}-${idx}`}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedBox(box)}
              className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col transition-all cursor-pointer"
            >
              <div className="aspect-square relative overflow-hidden bg-slate-50">
                <img src={box.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={box.name} />
                {box.isCustom && (
                  <div className="absolute top-2 left-2 bg-pink-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    自定义
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[9px] px-2 py-0.5 rounded-full text-slate-500 font-medium shadow-sm">
                  NEW
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-[11px] font-bold text-slate-700 line-clamp-2 h-7 mb-2 leading-tight">{box.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[10px] font-bold text-pink-500">¥</span>
                    <span className="text-sm font-bold text-pink-500">{box.price}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBoxId(box.id);
                      boxImageInputRef.current?.click();
                    }}
                    className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 hover:bg-pink-100 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBox && (
          <BlindBoxDetailModal 
            box={selectedBox}
            settings={settings}
            onClose={() => setSelectedBox(null)}
            onCheckout={() => setShowCheckout(true)}
            onEdit={(box) => {
              setEditingBox(box);
              setSelectedBox(null);
            }}
            onUpdateSettings={onUpdateSettings}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && selectedBox && (
          <CheckoutModal 
            box={selectedBox}
            settings={settings}
            onClose={() => setShowCheckout(false)}
            onConfirm={(method, isGift, msg, friendId) => handlePurchase(selectedBox, method, isGift, msg, friendId)}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingBox && (
          <CustomBlindBoxModal 
            initialBox={editingBox}
            onClose={() => setEditingBox(null)}
            onSave={(updatedBox) => {
              onUpdateSettings({
                blindBoxes: blindBoxes.map(b => b.id === updatedBox.id ? updatedBox : b)
              });
              setEditingBox(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Stats Bar */}
      <div className="fixed bottom-20 left-4 right-4 z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Coins size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">我的盲盒币</span>
                <span className="text-xs font-bold">{coins} &gt;</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 pr-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-emerald-500">
                <Eye size={14} />
                <span className="text-xs font-bold">{perspectiveCards}</span>
              </div>
              <span className="text-[10px] text-slate-400">透视卡</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-blue-400">
                <Lightbulb size={14} />
                <span className="text-xs font-bold">{hintCards}</span>
              </div>
              <span className="text-[10px] text-slate-400">提示卡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-slate-100 px-2 py-2 flex items-center justify-around sticky bottom-0 z-30 pb-safe">
        {[
          { id: 'IP乐园', icon: Globe },
          { id: '商品', icon: List },
          { id: '抽盒机', icon: Gamepad2 },
          { id: '购物车', icon: ShoppingBag },
          { id: '会员中心', icon: User },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
              activeTab === item.id ? "text-pink-500" : "text-slate-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.id}</span>
          </button>
        ))}
      </div>

      {/* Custom Blind Box Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <CustomBlindBoxModal 
            onClose={() => setShowCustomModal(false)}
            onSave={(newBox) => {
              onUpdateSettings({
                blindBoxes: [newBox, ...blindBoxes]
              });
              setShowCustomModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomBlindBoxModal({ onClose, onSave, initialBox }: { onClose: () => void, onSave: (box: BlindBox) => void, initialBox?: BlindBox }) {
  const [name, setName] = useState(initialBox?.name || '');
  const [description, setDescription] = useState(initialBox?.description || '');
  const [price, setPrice] = useState(initialBox?.price.toString() || '49');
  const [category, setCategory] = useState(initialBox?.category || '玩偶挂件');
  const [coverUrl, setCoverUrl] = useState(initialBox?.coverUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name || !coverUrl) return;
    onSave({
      id: initialBox?.id || Math.random().toString(36).substr(2, 9),
      name,
      description,
      price: Number(price),
      coverUrl,
      category,
      isCustom: true,
      addedAt: initialBox?.addedAt || Date.now()
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[110] bg-black/60 flex items-end"
    >
      <div className="w-full bg-white rounded-t-[32px] p-6 pb-12 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{initialBox ? '编辑盲盒' : '自定义盲盒'}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Cover Upload */}
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 flex flex-col items-center justify-center text-pink-400 cursor-pointer overflow-hidden relative"
            >
              {coverUrl ? (
                <img src={coverUrl} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={24} />
                  <span className="text-[10px] mt-2">上传封面</span>
                </>
              )}
            </div>
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-[1px] bg-slate-100" />
              <span className="text-[10px] text-slate-400">或者导入链接</span>
              <div className="flex-1 h-[1px] bg-slate-100" />
            </div>
            <div className="w-full relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="输入图片 URL"
                value={coverUrl.startsWith('data:') ? '' : coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all"
              />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">商品名称</label>
              <input 
                type="text"
                placeholder="给盲盒起个好听的名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">详细描述</label>
              <textarea 
                placeholder="描述一下盲盒里的惊喜吧"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">价格 (¥)</label>
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">所属分类</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all appearance-none"
                >
                  {CATEGORIES.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!name || !coverUrl}
            className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 mt-4"
          >
            {initialBox ? '保存修改' : '保存盲盒'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BlindBoxDetailModal({ box, settings, onClose, onCheckout, onEdit, onUpdateSettings }: { 
  box: BlindBox, 
  settings: AppSettings,
  onClose: () => void, 
  onCheckout: () => void,
  onEdit: (box: BlindBox) => void,
  onUpdateSettings: (updates: Partial<AppSettings>) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(288);
  const controls = useAnimation();
  
  const perspectiveCards = settings.perspectiveCards || 0;
  const hintCards = settings.hintCards || 0;

  // Derive series items from the same category
  const allBoxes = [...DEFAULT_BLIND_BOXES, ...(settings.blindBoxes || [])];
  const seriesItems = allBoxes
    .filter(b => b.category === box.category)
    .slice(0, 9); // Limit to 9 for the grid

  const currentPosition = (currentIndex % 9) + 1;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShake = async () => {
    await controls.start({
      rotate: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 }
    });
  };

  const nextItem = () => {
    setCurrentIndex(prev => (prev + 1) % seriesItems.length);
  };

  const prevItem = () => {
    setCurrentIndex(prev => (prev - 1 + seriesItems.length) % seriesItems.length);
  };

  const currentItem = seriesItems[currentIndex] || box;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-[#fff9e6] overflow-y-auto overflow-x-hidden"
    >
      <div className="min-h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-12 pb-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ChevronLeft size={24} />
            </button>
            <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/50">
              <RefreshCw size={14} className="text-orange-500 animate-spin-slow" />
              <span className="text-sm font-bold text-orange-600">{timeLeft}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {box.isCustom && (
              <button 
                onClick={() => onEdit(box)}
                className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/50 text-slate-700 font-black text-sm hover:bg-white transition-all"
              >
                <SettingsIcon size={16} />
                编辑
              </button>
            )}
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/40 shadow-sm">
              <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <MoreHorizontal size={20} className="text-slate-700" />
              </button>
              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
              <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                <div className="w-4 h-4 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start pt-4 px-6 relative">
          {/* Position Indicator (Top Left) */}
          <div className="absolute top-4 left-6 bg-white/40 backdrop-blur-sm rounded-2xl p-2.5 shadow-sm border border-white/30">
            <div className="text-[9px] text-slate-500 mb-1.5 flex items-center gap-1 font-bold">
              当前位置 <RefreshCw size={8} />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <div 
                  key={n} 
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                    n === currentPosition ? "bg-red-500 text-white shadow-sm scale-110" : "bg-slate-200/50 text-slate-400"
                  )}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Main Box Display */}
          <div className="flex flex-col items-center gap-4 w-full mt-12">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xl tracking-tight">
              <Smartphone size={24} className="text-slate-800" />
              摇一摇有提示哦
            </div>
            
            <div className="relative w-full max-w-[180px] aspect-square flex items-center justify-center">
              <button 
                onClick={prevItem}
                className="absolute left-[-60px] w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-slate-400 hover:bg-black/10 transition-colors z-10"
              >
                <ChevronLeft size={32} />
              </button>
              
              <motion.div 
                animate={controls}
                onClick={handleShake}
                className="w-full h-full bg-white rounded-[32px] shadow-2xl overflow-hidden border-[6px] border-white relative cursor-pointer group"
              >
                <img src={currentItem.coverUrl} className="w-full h-full object-cover" alt={currentItem.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>

              <button 
                onClick={nextItem}
                className="absolute right-[-60px] w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-slate-400 hover:bg-black/10 transition-colors z-10"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            <div className="text-[11px] font-bold text-slate-400 tracking-widest mt-2">
              No.163986854112-{currentPosition}
            </div>

            {/* Cards Pills */}
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => {
                  if (hintCards > 0) onUpdateSettings({ hintCards: hintCards - 1 });
                }}
                className="bg-white/90 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 flex items-center gap-2 shadow-sm border border-white active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                  <Lightbulb size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">提示卡 x {hintCards}</span>
              </button>
              <button 
                onClick={() => {
                  if (perspectiveCards > 0) onUpdateSettings({ perspectiveCards: perspectiveCards - 1 });
                }}
                className="bg-white/90 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 flex items-center gap-2 shadow-sm border border-white active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
                  <Eye size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">透视卡 x {perspectiveCards}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Series Preview & Actions */}
        <div className="mt-auto">
          <div className="bg-white rounded-t-[40px] pt-8 pb-10 px-6 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] border-t border-white/80 relative">
            {/* Decorative handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full" />
            
            {/* Horizontal Series List */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-8 px-2">
              {seriesItems.map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIndex(i)}
                  className="flex flex-col items-center gap-2.5 min-w-[70px] shrink-0"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-500",
                    currentIndex === i 
                      ? "border-pink-500 shadow-xl shadow-pink-100 scale-110 -translate-y-2 ring-4 ring-pink-50" 
                      : "border-slate-50 opacity-40 grayscale-[0.8]"
                  )}>
                    <img src={item.coverUrl} className="w-full h-full object-cover" />
                  </div>
                  <span className={cn(
                    "text-[11px] truncate w-full text-center font-black tracking-tight",
                    currentIndex === i ? "text-pink-500" : "text-slate-400"
                  )}>{item.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1 mb-1">
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Selected Item</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">{currentItem.name}</span>
              </div>

              <button 
                onClick={onCheckout}
                className="w-full bg-[#ff0033] text-white py-5 rounded-full text-2xl font-black shadow-2xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 tracking-[0.2em]"
              >
                就 你 了
              </button>
              
              <div className="flex items-center justify-center gap-10">
                <button className="text-slate-400 text-sm font-black flex items-center gap-2 hover:text-pink-500 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-pink-50 transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                  加入购物车
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CheckoutModal({ box, settings, onClose, onConfirm }: { 
  box: BlindBox, 
  settings: AppSettings,
  onClose: () => void,
  onConfirm: (method: 'bank' | 'wallet', isGift: boolean, msg?: string, friendId?: string) => void
}) {
  const [step, setStep] = useState<'payment' | 'choice' | 'gift'>('payment');
  const [method, setMethod] = useState<'bank' | 'wallet'>('wallet');
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [giftMsg, setGiftMsg] = useState('祝你今天好心情！');
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');

  const walletBalance = settings.walletBalance || 1000;
  const friends = settings.characterProfiles || [];
  const bankCards = settings.bankCards || [
    { id: 'card-1', bankName: '招商银行', cardNumber: '**** 8888', balance: 50000 }
  ];

  const handlePay = () => {
    setStep('choice');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/60 flex items-end"
    >
      <div className="w-full bg-white rounded-t-[32px] p-6 pb-12 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {step === 'payment' && '确认订单'}
            {step === 'choice' && '支付成功'}
            {step === 'gift' && '赠送给好友'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {step === 'payment' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
              <img src={box.coverUrl} className="w-20 h-20 rounded-xl object-cover" />
              <div>
                <h3 className="font-bold text-slate-800">{box.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{box.description}</p>
                <p className="text-pink-500 font-bold mt-2">¥{box.price}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 ml-1">支付方式</label>
              <button 
                onClick={() => setMethod('wallet')}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                  method === 'wallet' ? "border-pink-500 bg-pink-50/30" : "border-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="text-emerald-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold">钱包余额</p>
                    <p className="text-[10px] text-slate-400">可用余额: ¥{walletBalance}</p>
                  </div>
                </div>
                {method === 'wallet' && <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white"><X size={12} className="rotate-45" /></div>}
              </button>
              
              <div className="space-y-2">
                {bankCards.map(card => (
                  <button 
                    key={card.id}
                    onClick={() => {
                      setMethod('bank');
                      setSelectedCardId(card.id);
                    }}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                      (method === 'bank' && selectedCardId === card.id) ? "border-pink-500 bg-pink-50/30" : "border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-bold">{card.bankName}</p>
                        <p className="text-[10px] text-slate-400">{card.cardNumber}</p>
                      </div>
                    </div>
                    {(method === 'bank' && selectedCardId === card.id) && <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white"><X size={12} className="rotate-45" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handlePay}
              className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all mt-4"
            >
              立即支付 ¥{box.price}
            </button>
          </div>
        )}

        {step === 'choice' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={40} className="animate-spin-slow" />
            </div>
            <p className="text-slate-500">恭喜你，支付成功！请选择如何处理这个盲盒：</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onConfirm(method, false)}
                className="p-6 rounded-3xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50/30 transition-all group"
              >
                <Smartphone className="mx-auto mb-3 text-slate-400 group-hover:text-pink-500" size={32} />
                <span className="font-bold block">自己使用</span>
              </button>
              <button 
                onClick={() => setStep('gift')}
                className="p-6 rounded-3xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50/30 transition-all group"
              >
                <Gift className="mx-auto mb-3 text-slate-400 group-hover:text-pink-500" size={32} />
                <span className="font-bold block">赠送好友</span>
              </button>
            </div>
          </div>
        )}

        {step === 'gift' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 ml-1">选择好友</label>
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                {friends.map(friend => (
                  <button 
                    key={friend.id}
                    onClick={() => setSelectedFriendId(friend.id)}
                    className="flex flex-col items-center gap-2 min-w-[70px]"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full p-0.5 border-2 transition-all",
                      selectedFriendId === friend.id ? "border-pink-500" : "border-transparent"
                    )}>
                      <img src={friend.avatarUrl} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium truncate w-full text-center",
                      selectedFriendId === friend.id ? "text-pink-500 font-bold" : "text-slate-500"
                    )}>{friend.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">赠送留言</label>
              <textarea 
                value={giftMsg}
                onChange={(e) => setGiftMsg(e.target.value)}
                placeholder="写下你想对TA说的话..."
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-pink-200 transition-all h-24 resize-none"
              />
            </div>

            <button 
              onClick={() => onConfirm(method, true, giftMsg, selectedFriendId)}
              disabled={!selectedFriendId}
              className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 mt-4"
            >
              确认赠送
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
