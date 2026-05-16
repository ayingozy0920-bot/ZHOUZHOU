import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Heart, 
  MessageSquare, 
  Lock, 
  Camera, 
  Users, 
  Settings, 
  Home, 
  UserCircle, 
  Store, 
  User,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Coffee,
  Sun,
  Tent,
  Flower2,
  MapPin,
  Moon,
  CloudRain,
  Trash2,
  Image as ImageIcon,
  Plus,
  Edit,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Search,
  ShoppingCart,
  Bell,
  Heart as HeartIcon,
  Share2,
  Minus,
  Wallet,
  CreditCard as BankCardIcon,
  CheckCircle2,
  Package,
  Truck,
  Clock,
  History,
  Ticket,
  Coins
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Friend, AppSettings, MallProduct, CartItem, MallOrder, MallAddress, ReceivedGift } from '../../types';
import YueyuInteraction from './YueyuInteraction';
import { useGifts } from '../../hooks/useGifts';
import Postcard from './Postcard';
import { Transaction } from '../../hooks/useFriends';

interface DatingAppProps {
  settings: AppSettings;
  friends: Friend[];
  onBack: () => void;
  addOnlineMemory: (friendId: string, content: string, type?: 'auto' | 'manual', source?: 'chat' | 'weibo') => void;
  addOfflinePlot: (friendId: string, title: string, logs: any[], summary: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  initialData?: {
    friendId: string;
    openingText: string;
  } | null;
}

const SCENES = [
  {
    id: 'paris',
    title: '巴黎街角咖啡馆',
    tag: '单人约会',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    icon: <Coffee className="w-5 h-5" />,
    color: 'from-amber-200/40 to-orange-300/40'
  },
  {
    id: 'beach',
    title: '海边落日沙滩',
    tag: '限定剧情',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    icon: <Sun className="w-5 h-5" />,
    color: 'from-orange-200/40 to-rose-300/40'
  },
  {
    id: 'camping',
    title: '星空露营地',
    tag: '多人约会',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800',
    icon: <Tent className="w-5 h-5" />,
    color: 'from-indigo-300/40 to-purple-400/40'
  },
  {
    id: 'garden',
    title: '日式庭院',
    tag: '单人约会',
    image: 'https://images.unsplash.com/photo-1582197419730-af519ca0a104?auto=format&fit=crop&q=80&w=800',
    icon: <Flower2 className="w-5 h-5" />,
    color: 'from-emerald-200/40 to-teal-300/40'
  },
  {
    id: 'cloud',
    title: '云端花房',
    tag: '限定剧情',
    image: 'https://images.unsplash.com/photo-1466611653911-95282fc3656b?auto=format&fit=crop&q=80&w=800',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-blue-200/40 to-cyan-300/40'
  }
];

const MALL_CATEGORIES = ['全部', '月遇心动商品', '定制周边', '虚拟道具', '自定义商品', '新品首发'];

const MALL_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', title: '春季限定：心动告白季' },
  { id: 2, image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=800', title: '定制周边：把爱带回家' },
  { id: 3, image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800', title: '虚拟道具：让互动更有趣' },
];

const MALL_PRODUCTS: MallProduct[] = [
  { 
    id: '1', 
    name: '月遇心动告白项链', 
    price: 520, 
    originalPrice: 999, 
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=400', 
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1535633302713-102c4f509020?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'
    ],
    category: '月遇心动商品', 
    sales: 1200, 
    stock: 99,
    isCustom: false,
    description: '纯银打造，心形吊坠寓意永恒的爱。精致礼盒包装，是告白的最佳选择。',
    specs: [
      { name: '材质', options: ['纯银', '18K金'] },
      { name: '包装', options: ['标准礼盒', '豪华礼盒'] }
    ]
  },
  { 
    id: '2', 
    name: '定制角色等身抱枕', 
    price: 199, 
    originalPrice: 299, 
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=400', 
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1520608421741-68228b76b6df?auto=format&fit=crop&q=80&w=800'
    ],
    category: '定制周边', 
    sales: 850, 
    stock: 500,
    isCustom: false,
    description: '高清印染，亲肤材质。您可以选择心仪的角色形象进行定制。',
    specs: [
      { name: '尺寸', options: ['150x50cm', '160x50cm'] },
      { name: '材质', options: ['桃皮绒', '2WAY'] }
    ]
  },
  { 
    id: '3', 
    name: '虚拟烟花：浪漫星空', 
    price: 99, 
    originalPrice: 150, 
    image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&q=80&w=400', 
    category: '虚拟道具', 
    sales: 3500, 
    stock: 9999,
    isCustom: false,
    description: '在约会时燃放，全屏特效，增加好感度。',
    specs: [
      { name: '款式', options: ['经典红', '梦幻紫', '极光绿'] }
    ]
  },
  { 
    id: '4', 
    name: '自定义：专属情书套装', 
    price: 66, 
    originalPrice: 88, 
    image: 'https://images.unsplash.com/photo-1516410529446-2c777cb7366d?auto=format&fit=crop&q=80&w=400', 
    category: '自定义商品', 
    sales: 420, 
    stock: 100,
    isCustom: true,
    description: '包含信封、信纸及火漆印章。您可以自定义信件内容。',
    specs: [
      { name: '风格', options: ['复古', '现代', '清新'] }
    ]
  },
  { 
    id: '5', 
    name: '月遇限定：樱花香薰', 
    price: 128, 
    originalPrice: 188, 
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400', 
    category: '新品首发', 
    sales: 600, 
    stock: 200,
    isCustom: false,
    description: '淡淡樱花香，营造浪漫氛围。',
    specs: [
      { name: '容量', options: ['100ml', '200ml'] }
    ]
  },
  { 
    id: '6', 
    name: '心动盲盒：随机惊喜', 
    price: 39, 
    originalPrice: 59, 
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400', 
    category: '月遇心动商品', 
    sales: 2100, 
    stock: 1000,
    isCustom: false,
    description: '随机获得一款月遇周边，惊喜不断。',
    specs: [
      { name: '系列', options: ['第一弹', '第二弹'] }
    ]
  },
];

const DatingApp: React.FC<DatingAppProps> = ({ settings, friends, onBack, addOnlineMemory, addOfflinePlot, addTransaction, initialData }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dateAlbum, setDateAlbum] = useState<{url: string, date: string, theme: string, thought?: string, friendId?: string}[]>(() => {
    const saved = localStorage.getItem('yueyu_date_album');
    return saved ? JSON.parse(saved) : [];
  });
  const [postcards, setPostcards] = useState<{
    id: string;
    friendId: string;
    summary: string;
    photoUrl: string;
    date: string;
    theme: string;
  }[]>(() => {
    const saved = localStorage.getItem('yueyu_postcards');
    return saved ? JSON.parse(saved) : [];
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('yueyu_user_profile');
    return saved ? JSON.parse(saved) : {
      avatar: 'https://picsum.photos/seed/user/200/200',
      background: 'https://picsum.photos/seed/bg/800/400',
      signature: '遇见你，是这个春天最美好的事。',
      level: 5,
      name: '月遇用户'
    };
  });

  // Scene Backgrounds State
  const [sceneBackgrounds, setSceneBackgrounds] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('yueyu_scene_backgrounds');
    return saved ? JSON.parse(saved) : {};
  });

  const [showSettings, setShowSettings] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, onConfirm: () => void, title: string } | null>(null);
  const [inputModal, setInputModal] = useState<{ 
    show: boolean, 
    title: string, 
    placeholder: string, 
    value: string, 
    onConfirm: (val: string) => void 
  } | null>(null);

  const [startTime, setStartTime] = useState<number>(0);

  // Date Preparation States
  const [isPreparing, setIsPreparing] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dateMode, setDateMode] = useState<'single' | 'multi'>('single');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedScene, setSelectedScene] = useState(SCENES[0]);
  const [initialMessage, setInitialMessage] = useState('');
  const [isQuickDating, setIsQuickDating] = useState(false);
  const [isCustomDating, setIsCustomDating] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'sunset'>(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) return 'night';
    if (hour >= 16) return 'sunset';
    return 'day';
  });
  const [weather, setWeather] = useState<'sunny' | 'rainy'>('sunny');
  const [theme, setTheme] = useState('下午茶闲聊');
  const [customTheme, setCustomTheme] = useState('');
  const [customSceneDescription, setCustomSceneDescription] = useState('');
  
  // Mall States
  const [mallView, setMallView] = useState<'home' | 'detail' | 'cart' | 'checkout' | 'orders' | 'profile' | 'custom_manage' | 'custom_form' | 'address_manage' | 'address_form' | 'payment' | 'payment_success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<MallProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('yueyu_mall_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<MallOrder[]>(() => {
    const saved = localStorage.getItem('yueyu_mall_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('yueyu_mall_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [addresses, setAddresses] = useState<MallAddress[]>(() => {
    const saved = localStorage.getItem('yueyu_mall_addresses');
    return saved ? JSON.parse(saved) : [
      { id: 'addr-1', name: '周周', phone: '138****8888', area: '上海市 浦东新区', detail: '某某街道某某小区8号楼808室', isDefault: true }
    ];
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-1');
  const [editingAddress, setEditingAddress] = useState<Partial<MallAddress> | null>(null);
  const { gifts: receivedGifts, addGift } = useGifts();
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState<MallOrder | null>(null);
  const [orderStatusTab, setOrderStatusTab] = useState('全部');
  const [customProducts, setCustomProducts] = useState<MallProduct[]>(() => {
    const saved = localStorage.getItem('yueyu_mall_custom_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [productOverrides, setProductOverrides] = useState<Record<string, Partial<MallProduct>>>(() => {
    const saved = localStorage.getItem('yueyu_mall_product_overrides');
    return saved ? JSON.parse(saved) : {};
  });
  const [editingProduct, setEditingProduct] = useState<Partial<MallProduct> | null>(null);

  const [cartCount, setCartCount] = useState(0);
  const [selectedMallCategory, setSelectedMallCategory] = useState('全部');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    localStorage.setItem('yueyu_mall_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('yueyu_mall_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('yueyu_mall_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('yueyu_mall_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem('yueyu_mall_custom_products', JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    localStorage.setItem('yueyu_mall_product_overrides', JSON.stringify(productOverrides));
  }, [productOverrides]);

  const getProductData = (product: MallProduct) => {
    const override = productOverrides[product.id];
    return override ? { ...product, ...override } : product;
  };

  const allProducts = [...customProducts.map(getProductData), ...MALL_PRODUCTS.map(getProductData)];

  const [wallpaperUrl, setWallpaperUrl] = useState(() => {
    const saved = localStorage.getItem(`yueyu_wallpaper_${SCENES[0].id}`);
    return saved || SCENES[0].image;
  });

  useEffect(() => {
    if (initialData && initialData.friendId && initialData.openingText) {
      // Reset interaction state first to ensure YueyuInteraction remounts if it was somehow active
      setIsInteracting(false);
      
      setTimeout(() => {
        setSelectedFriendIds([initialData.friendId]);
        setInitialMessage(initialData.openingText);
        
        // Pick a random scene
        const randomScene = SCENES[Math.floor(Math.random() * SCENES.length)];
        setSelectedScene(randomScene);
        setWallpaperUrl(localStorage.getItem(`yueyu_wallpaper_${randomScene.id}`) || randomScene.image);
        
        setStartTime(Date.now());
        setDateAlbum([]);
        setIsInteracting(true);
        setActiveTab('home');
      }, 0);
    }
  }, [initialData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % MALL_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('yueyu_date_album', JSON.stringify(dateAlbum));
  }, [dateAlbum]);

  useEffect(() => {
    localStorage.setItem('yueyu_postcards', JSON.stringify(postcards));
  }, [postcards]);

  useEffect(() => {
    localStorage.setItem('yueyu_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('yueyu_scene_backgrounds', JSON.stringify(sceneBackgrounds));
  }, [sceneBackgrounds]);

  const handleStartDate = (customOpening?: string) => {
    if (selectedFriendIds.length === 0) {
      setShowDrawer(true);
      return;
    }
    setStartTime(Date.now());
    setDateAlbum([]);
    setInitialMessage(customOpening || '');
    setIsPreparing(false);
    setIsInteracting(true);
  };

  const handleQuickDate = async () => {
    if (selectedFriendIds.length === 0) {
      setShowDrawer(true);
      return;
    }
    
    setIsQuickDating(true);
    try {
      const randomScene = SCENES[Math.floor(Math.random() * SCENES.length)];
      setSelectedScene(randomScene);
      setWallpaperUrl(sceneBackgrounds[randomScene.id] || randomScene.image);
      
      const friendNames = selectedFriendIds.map(id => friends.find(f => f.id === id)?.name).join('和');
      const prompt = `你正在为一款约会App生成开场白。
      场景：${randomScene.title}
      参与角色：${friendNames}
      要求：生成一段温馨、治愈且富有画面感的开场白，字数在50字左右。直接输出内容。`;
      
    const { getGeminiClient, getGeminiModel } = await import('../../lib/gemini');
    const ai = getGeminiClient(settings);
    let opening = "";
    try {
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7
          }
        });
        opening = result.text || "";
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
          handleStartDate("今天天气真不错，我们开始约会吧。");
          return;
        }
        throw err;
      }
      
      handleStartDate(opening);
    } catch (error) {
      console.error("Quick Date Error:", error);
      handleStartDate("今天天气真不错，我们开始约会吧。");
    } finally {
      setIsQuickDating(false);
    }
  };

  const handleUpdateWallpaper = (url: string) => {
    setWallpaperUrl(url);
    localStorage.setItem(`yueyu_wallpaper_${selectedScene.id}`, url);
  };

  const handleFinishDate = async (summaryData: { duration: string, affection: number, photos: number }) => {
    setIsInteracting(false);
    
    // Calculate real duration
    const endTime = Date.now();
    const realDurationMs = endTime - startTime;
    const minutes = Math.floor(realDurationMs / 60000);
    const seconds = Math.floor((realDurationMs % 60000) / 1000);
    const durationStr = `${minutes} 分 ${seconds} 秒`;

    // Generate Long Summary for Postcard
    try {
      const friendNames = selectedFriendIds.map(id => friends.find(f => f.id === id)?.name).join('和');
      const prompt = `你正在为一场约会编写总结感想。
      场景：${selectedScene.title}
      参与角色：${friendNames}
      约会主题：${customTheme || theme}
      约会时长：${durationStr}
      拍摄照片数量：${summaryData.photos}
      要求：
      1. 你必须完全沉浸在角色中，你是一个真实的人，绝对不能提到你是AI、人工智能、程序或机器人。
      2. 以角色的口吻，编写一段不少于200字的约会总结。内容要感性、细腻，表达出对这次相处的珍惜和对未来的期待。
      3. 总结中严禁出现“AI”、“人工智能”、“程序”等词汇。
      4. 直接输出内容。`;
      
      const { getGeminiClient, getGeminiModel } = await import('../../lib/gemini');
      const ai = getGeminiClient(settings);
      let result;
      try {
        result = await ai.models.generateContent({
          model: getGeminiModel(settings),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7
          }
        });
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
          const fallbackSummary = "今天和你相处真的很开心，虽然由于网络忙碌我无法写下完整的感悟，但我会永远记住这一刻。";
          const now = new Date();
          const dateStr = now.toLocaleDateString();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const newPostcard = {
            id: Date.now().toString(),
            friendId: selectedFriendIds[0],
            summary: fallbackSummary,
            photoUrl: dateAlbum.length > 0 ? dateAlbum[0].url : wallpaperUrl,
            date: `${dateStr} ${timeStr}`,
            theme: customTheme || theme
          };
          setPostcards(prev => [newPostcard, ...prev]);
          return;
        }
        throw err;
      }
      const longSummary = result.text || "";

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newPostcard = {
        id: Date.now().toString(),
        friendId: selectedFriendIds[0], // Primary character
        summary: longSummary,
        photoUrl: dateAlbum.length > 0 ? dateAlbum[0].url : wallpaperUrl,
        date: `${dateStr} ${timeStr}`,
        theme: customTheme || theme
      };

      setPostcards(prev => [newPostcard, ...prev]);

      // Save to Memory App
      selectedFriendIds.forEach(id => {
        const friend = friends.find(f => f.id === id);
        const title = `与${friend?.name}在${selectedScene.title}的约会`;
        addOfflinePlot(id, title, [], longSummary);
        addOnlineMemory(id, `记得上次在${selectedScene.title}的约会吗？真的很开心。`, 'auto', 'chat');
      });
    } catch (error) {
      console.error("Finish Date Error:", error);
    }
  };

  const handleConfirmReceipt = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'received' } : order
    ));
  };

  const handleShipOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'shipped' } : order
    ));
  };

  const handleRefund = (orderId: string) => {
    const orderToRefund = orders.find(o => o.id === orderId);
    if (!orderToRefund) return;

    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'refunded' } : order
    ));

    // Add refund transaction
    addTransaction({
      type: 'transfer-in',
      amount: orderToRefund.totalAmount,
      title: `退款: ${orderToRefund.items[0]?.name}${orderToRefund.items.length > 1 ? '等' : ''}`,
      paymentMethodId: orderToRefund.paymentMethod === 'balance' ? 'wallet' : 'card-1' // Assuming card-1 for simplicity if not balance
    });
  };

  const handleSendGiftToCharacter = (gift: { productId: string, name: string, image: string, thought: string }) => {
    const newReceivedGift: ReceivedGift = {
      id: `gift-${Date.now()}`,
      productId: gift.productId,
      name: gift.name,
      image: gift.image,
      timestamp: Date.now(),
      from: userProfile.name,
      characterReaction: gift.thought,
      friendId: selectedFriendIds[0] // Associate with the first friend in the date
    };
    addGift(newReceivedGift);
  };

  if (isInteracting) {
    // Get all items from received orders
    const purchasedProducts = orders
      .filter(o => o.status === 'received')
      .flatMap(o => o.items.map(item => ({ id: item.productId, name: item.name, image: item.image })));

    return (
      <YueyuInteraction 
        settings={settings}
        friends={friends}
        onBack={() => setIsInteracting(false)}
        onFinish={handleFinishDate}
        sceneId={selectedScene.id}
        mode={dateMode}
        selectedFriendIds={selectedFriendIds}
        theme={customTheme || theme}
        timeOfDay={timeOfDay}
        weather={weather}
        wallpaperUrl={wallpaperUrl}
        onUpdateWallpaper={handleUpdateWallpaper}
        onCapture={(photo) => setDateAlbum(prev => [photo, ...prev])}
        onSendGift={handleSendGiftToCharacter}
        purchasedProducts={purchasedProducts}
        initialMessage={initialMessage}
      />
    );
  }

  const handleAddToCart = (product: MallProduct, spec?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.spec === spec);
      if (existing) {
        return prev.map(item => item.productId === product.id && item.spec === spec 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, {
        id: `cart-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        spec,
        quantity: 1,
        selected: true
      }];
    });
    alert('已加入购物车');
  };

  const handleBuyNow = (product: MallProduct, spec?: string) => {
    const tempItem: CartItem = {
      id: `buy-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      spec,
      quantity: 1,
      selected: true
    };
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.spec === spec);
      if (existing) return prev;
      return [...prev, tempItem];
    });
    setMallView('cart');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleCartItem = (id: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSubmitOrder = (paymentMethod: 'wechat' | 'alipay' | 'balance') => {
    const selectedItems = cart.filter(item => item.selected);
    if (selectedItems.length === 0) return;

    const total = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const address = addresses.find(a => a.id === selectedAddressId) || addresses[0];

    const newOrder: MallOrder = {
      id: `order-${Date.now()}`,
      items: selectedItems,
      totalAmount: total,
      status: 'pending',
      timestamp: Date.now(),
      address,
      paymentMethod
    };

    setOrders(prev => [newOrder, ...prev]);
    setCurrentPaymentOrder(newOrder);
    setCart(prev => prev.filter(item => !item.selected));
    setMallView('payment');
  };

  const handlePayOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setCurrentPaymentOrder(order);
      setMallView('payment');
    }
  };

  const handleConfirmPayment = () => {
    if (!currentPaymentOrder) return;
    
    setOrders(prev => prev.map(order => 
      order.id === currentPaymentOrder.id ? { ...order, status: 'paid' } : order
    ));
    
    addTransaction({
      type: 'spend',
      amount: currentPaymentOrder.totalAmount,
      title: `商城订单: ${currentPaymentOrder.items[0].name}${currentPaymentOrder.items.length > 1 ? ` 等${currentPaymentOrder.items.length}件` : ''}`,
      paymentMethodId: currentPaymentOrder.paymentMethod === 'balance' ? 'wallet' : 'card-1'
    });

    setMallView('payment_success');
  };

  const renderMallContent = () => {
    switch (mallView) {
      case 'detail':
        return renderProductDetail();
      case 'cart':
        return renderCart();
      case 'checkout':
        return renderCheckout();
      case 'orders':
        return renderOrders();
      case 'profile':
        return renderMallProfile();
      case 'custom_manage':
        return renderCustomManage();
      case 'custom_form':
        return renderCustomProductForm();
      case 'address_manage':
        return renderAddressManage();
      case 'address_form':
        return renderAddressForm();
      case 'payment':
        return renderPayment();
      case 'payment_success':
        return renderPaymentSuccess();
      default:
        return renderMallHome();
    }
  };

  const renderMallHome = () => (
    <div className="flex flex-col h-full">
      {/* Mall Header */}
      <div className="p-6 pt-12 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-slate-800" />
            </button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">月遇商城</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMallView('profile')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <User size={20} className="text-slate-600" />
            </button>
            <div className="relative">
              <button onClick={() => setMallView('cart')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ShoppingCart size={20} className="text-slate-600" />
              </button>
              {cartCount > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">{cartCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="搜索心动商品..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
          />
        </div>

        {/* Category Nav */}
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {MALL_CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedMallCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                selectedMallCategory === cat 
                  ? "bg-rose-400 text-white shadow-lg shadow-rose-200" 
                  : "bg-white text-slate-400 border border-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-8">
        {/* Activity Banner */}
        <div className="relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-xl group">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentBannerIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={MALL_BANNERS[currentBannerIndex].image} 
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
            <h3 className="text-white font-black text-lg drop-shadow-md">{MALL_BANNERS[currentBannerIndex].title}</h3>
          </div>
          
          {/* Banner Dots */}
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {MALL_BANNERS.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  currentBannerIndex === idx ? "bg-white w-4" : "bg-white/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Product Waterfall */}
        <div className="grid grid-cols-2 gap-[10px]">
          {allProducts.filter(p => selectedMallCategory === '全部' || p.category === selectedMallCategory).map(product => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => {
                setSelectedProduct(product);
                setMallView('detail');
              }}
              className="bg-white/60 backdrop-blur-md rounded-[16px] overflow-hidden shadow-sm border border-white/40 flex flex-col group cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {product.isCustom && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 backdrop-blur-md rounded-lg text-[8px] text-white font-black shadow-lg shadow-indigo-200/50 flex items-center gap-1">
                    <Sparkles size={8} />
                    <span>专属自定义</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-lg text-[8px] text-white font-medium">
                  热度 {product.sales}
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                  {product.name}
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-rose-500">¥{product.price}</span>
                  <span className="text-[9px] text-slate-300 line-through">¥{product.originalPrice}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="py-10 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">已经到底啦 · 更多心动在路上</p>
        </div>
      </div>
    </div>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    const isFavorited = favorites.includes(selectedProduct.id);
    
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Detail Header */}
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <button onClick={() => setMallView('home')} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            {!selectedProduct.isCustom && (
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const url = event.target.result as string;
                          setProductOverrides(prev => ({
                            ...prev,
                            [selectedProduct.id]: { ...prev[selectedProduct.id], image: url }
                          }));
                          setSelectedProduct(prev => prev ? { ...prev, image: url } : null);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <button 
                  className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                >
                  <Camera size={20} />
                </button>
              </div>
            )}
            <button 
              onClick={() => {
                if (isFavorited) {
                  setFavorites(prev => prev.filter(id => id !== selectedProduct.id));
                } else {
                  setFavorites(prev => [...prev, selectedProduct.id]);
                }
              }}
              className={cn(
                "w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-colors",
                isFavorited ? "bg-rose-500 text-white" : "bg-black/20 text-white"
              )}
            >
              <HeartIcon size={20} fill={isFavorited ? "currentColor" : "none"} />
            </button>
            <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Image Carousel */}
          <div className="aspect-square relative group">
            <img 
              src={selectedProduct.images?.[0] || selectedProduct.image} 
              className="w-full h-full object-cover"
              onClick={() => setZoomedImage(selectedProduct.images?.[0] || selectedProduct.image)}
            />
            <div className="absolute bottom-4 right-6 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold">
              1 / {selectedProduct.images?.length || 1}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-500">¥{selectedProduct.price}</span>
                <span className="text-sm text-slate-300 line-through">¥{selectedProduct.originalPrice}</span>
              </div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">{selectedProduct.name}</h1>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                <span>销量 {selectedProduct.sales}</span>
                <span>库存 {selectedProduct.stock}</span>
              </div>
            </div>

            {/* Specs */}
            {selectedProduct.specs?.map(spec => (
              <div key={spec.name} className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{spec.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {spec.options.map(opt => (
                    <button 
                      key={opt}
                      className="px-4 py-2 rounded-xl border-2 border-slate-50 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">商品详情</h3>
                {selectedProduct.isCustom && (
                  <span className="text-[8px] px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md font-bold">自定义设计</span>
                )}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedProduct.description}</p>
              
              {selectedProduct.customDesignNote && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles size={12} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">设计说明</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed italic">
                    “{selectedProduct.customDesignNote}”
                  </p>
                </div>
              )}

              <div className="space-y-4 pt-4">
                {(selectedProduct.images || []).slice(1).map((img, idx) => (
                  <img key={idx} src={img} className="w-full rounded-2xl shadow-sm" />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4 pt-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">猜你喜欢</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {allProducts.filter(p => p.id !== selectedProduct.id).slice(0, 5).map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className="min-w-[140px] space-y-2"
                  >
                    <img src={p.image} className="w-full aspect-square object-cover rounded-2xl shadow-sm" />
                    <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs font-black text-rose-500">¥{p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 bg-white border-t border-slate-50 flex gap-4">
          <button 
            onClick={() => handleAddToCart(selectedProduct)}
            className="flex-1 py-4 border-2 border-rose-400 text-rose-500 rounded-full font-bold text-sm active:scale-95 transition-all"
          >
            加入购物车
          </button>
          <button 
            onClick={() => handleBuyNow(selectedProduct)}
            className="flex-1 py-4 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all"
          >
            立即购买
          </button>
        </div>
      </div>
    );
  };

  const renderCart = () => {
    const selectedItems = cart.filter(item => item.selected);
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    return (
      <div className="flex flex-col h-full bg-[#F8F8F8]">
        {/* Cart Header */}
        <div className="p-6 pt-12 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMallView('home')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-slate-800" />
            </button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">购物车</h2>
          </div>
          <button className="text-xs font-bold text-slate-400">编辑</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center">
                <ShoppingCart size={48} className="opacity-20" />
              </div>
              <p className="text-sm font-bold">购物车空空，去逛逛吧～</p>
              <button 
                onClick={() => setMallView('home')}
                className="px-8 py-3 bg-rose-400 text-white rounded-full text-sm font-bold shadow-lg shadow-rose-100"
              >
                去逛逛
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                <button 
                  onClick={() => handleToggleCartItem(item.id)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    item.selected ? "bg-rose-500 border-rose-500 text-white" : "border-slate-100"
                  )}
                >
                  {item.selected && <CheckCircle2 size={14} />}
                </button>
                <img src={item.image} className="w-20 h-20 object-cover rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{item.spec || '默认规格'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-rose-500">¥{item.price}</span>
                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full">
                      <button onClick={() => handleUpdateCartQuantity(item.id, -1)} className="text-slate-400"><Minus size={14} /></button>
                      <span className="text-xs font-black text-slate-800">{item.quantity}</span>
                      <button onClick={() => handleUpdateCartQuantity(item.id, 1)} className="text-slate-400"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const allSelected = cart.every(i => i.selected);
                  setCart(prev => prev.map(i => ({ ...i, selected: !allSelected })));
                }}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  cart.every(i => i.selected) ? "bg-rose-500 border-rose-500 text-white" : "border-slate-100"
                )}
              >
                {cart.every(i => i.selected) && <CheckCircle2 size={12} />}
              </button>
              <span className="text-xs font-bold text-slate-400">全选</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400">合计</p>
                <p className="text-lg font-black text-rose-500">¥{totalPrice}</p>
              </div>
              <button 
                onClick={() => setMallView('checkout')}
                disabled={selectedItems.length === 0}
                className="px-10 py-4 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 disabled:opacity-50"
              >
                结算({selectedItems.length})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckout = () => {
    const selectedItems = cart.filter(item => item.selected);
    const totalPrice = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const currentAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
    
    return (
      <div className="flex flex-col h-full bg-[#F8F8F8]">
        {/* Checkout Header */}
        <div className="p-6 pt-12 bg-white flex items-center gap-3">
          <button onClick={() => setMallView('cart')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">确认订单</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Address Section */}
          <div 
            onClick={() => setMallView('address_manage')}
            className="bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <MapPin size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{currentAddress.name}</span>
                  <span className="text-xs font-bold text-slate-400">{currentAddress.phone}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{currentAddress.area} {currentAddress.detail}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>

          {/* Product List */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">购物清单</h3>
            {selectedItems.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <img src={item.image} className="w-16 h-16 object-cover rounded-2xl" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{item.spec || '默认规格'} x {item.quantity}</p>
                </div>
                <span className="text-sm font-black text-slate-800">¥{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">支付方式</h3>
            <div className="space-y-2">
              {[
                { id: 'wechat', name: '微信支付', icon: <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14} /></div> },
                { id: 'alipay', name: '支付宝', icon: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={14} /></div> },
                { id: 'balance', name: '余额支付', icon: <Wallet size={20} className="text-orange-400" /> }
              ].map(method => (
                <div key={method.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span className="text-sm font-bold text-slate-700">{method.name}</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">商品总额</span>
              <span className="text-slate-800">¥{totalPrice}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">运费</span>
              <span className="text-green-500">包邮</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">优惠券</span>
              <span className="text-rose-500">-¥0</span>
            </div>
            <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800">实付款</span>
              <span className="text-xl font-black text-rose-500">¥{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-white border-t border-slate-50">
          <button 
            onClick={() => handleSubmitOrder('balance')}
            className="w-full py-5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 active:scale-95 transition-all"
          >
            提交订单并支付
          </button>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const filteredOrders = orders.filter(o => orderStatusTab === '全部' || o.status === orderStatusTab);
    
    return (
      <div className="flex flex-col h-full bg-[#F8F8F8]">
        {/* Orders Header */}
        <div className="p-6 pt-12 bg-white flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMallView('profile')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-slate-800" />
            </button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">我的订单</h2>
          </div>
          
          <div className="flex overflow-x-auto gap-6 no-scrollbar">
            {['全部', '待付款', '待发货', '待收货', '已收货', '已完成', '售后'].map(tab => (
              <button 
                key={tab}
                onClick={() => setOrderStatusTab(tab)}
                className={cn(
                  "text-sm font-bold whitespace-nowrap pb-2 border-b-2 transition-all",
                  orderStatusTab === tab ? "text-rose-500 border-rose-500" : "text-slate-400 border-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
              <Package size={48} className="opacity-20" />
              <p className="text-sm font-bold">暂无相关订单</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[32px] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">订单号: {order.id}</span>
                  <span className="text-xs font-black text-rose-500">
                    {order.status === 'pending' ? '待付款' : 
                     order.status === 'paid' ? '待发货' : 
                     order.status === 'shipped' ? '待收货' : 
                     order.status === 'received' ? '已收货' :
                     order.status === 'completed' ? '已完成' : '已退款'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img src={item.image} className="w-16 h-16 object-cover rounded-2xl" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{item.spec || '默认规格'} x {item.quantity}</p>
                      </div>
                      <span className="text-sm font-black text-slate-800">¥{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">共{order.items.length}件商品 实付: ¥{order.totalAmount}</span>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => handlePayOrder(order.id)} className="px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-bold">立即支付</button>
                    )}
                    {order.status === 'paid' && (
                      <>
                        <button onClick={() => handleRefund(order.id)} className="px-4 py-2 border border-slate-200 text-slate-400 rounded-full text-[10px] font-bold">申请退款</button>
                        <button onClick={() => handleShipOrder(order.id)} className="px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-bold">模拟发货</button>
                      </>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => handleConfirmReceipt(order.id)} className="px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-bold">确认收货</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMallProfile = () => (
    <div className="flex flex-col h-full bg-[#F8F8F8]">
      {/* Profile Header */}
      <div className="p-6 pt-12 bg-gradient-to-b from-rose-100 to-[#F8F8F8] space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setMallView('home')} className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <button className="p-2 hover:bg-white/40 rounded-full transition-colors">
            <Settings size={20} className="text-slate-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <img src={userProfile.avatar} className="w-20 h-20 rounded-full border-4 border-white shadow-xl" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800">{userProfile.name}</h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full">LV.{userProfile.level} 心动会员</span>
              <span className="px-2 py-0.5 bg-white text-slate-400 text-[8px] font-bold rounded-full border border-slate-100">ID: 888888</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Order Stats */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm grid grid-cols-4 gap-4">
          {[
            { label: '待付款', icon: <Wallet size={20} />, count: orders.filter(o => o.status === 'pending').length },
            { label: '待发货', icon: <Package size={20} />, count: orders.filter(o => o.status === 'paid').length },
            { label: '待收货', icon: <Truck size={20} />, count: orders.filter(o => o.status === 'shipped').length },
            { label: '全部订单', icon: <History size={20} />, count: orders.length }
          ].map(stat => (
            <button 
              key={stat.label} 
              onClick={() => {
                setOrderStatusTab(stat.label === '全部订单' ? '全部' : stat.label);
                setMallView('orders');
              }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative text-slate-400">
                {stat.icon}
                {stat.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">{stat.count}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-500">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Assets */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm grid grid-cols-3 gap-4">
          {[
            { label: '优惠券', value: '12', icon: <Ticket size={16} className="text-rose-400" /> },
            { label: '心动积分', value: '880', icon: <Coins size={16} className="text-amber-400" /> },
            { label: '收藏夹', value: favorites.length.toString(), icon: <HeartIcon size={16} className="text-rose-400" /> }
          ].map(asset => (
            <div key={asset.label} className="flex flex-col items-center gap-1">
              <span className="text-lg font-black text-slate-800">{asset.value}</span>
              <div className="flex items-center gap-1">
                {asset.icon}
                <span className="text-[10px] font-bold text-slate-400">{asset.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Menu List */}
        <div className="bg-white p-4 rounded-[32px] shadow-sm space-y-1">
          {[
            { label: '收货地址管理', icon: <MapPin size={18} className="text-blue-400" />, action: () => setMallView('address_manage') },
            { label: '自定义商品管理', icon: <Sparkles size={18} className="text-purple-400" />, action: () => setMallView('custom_manage') },
            { label: '账单明细', icon: <History size={18} className="text-emerald-400" />, action: () => alert('请前往聊天应用查看交易明细') },
            { label: '联系客服', icon: <MessageSquare size={18} className="text-rose-400" />, action: () => {} }
          ].map(item => (
            <button 
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomManage = () => (
    <div className="flex flex-col h-full bg-[#F8F8F8]">
      <div className="p-6 pt-12 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setMallView('profile')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">自定义商品管理</h2>
        </div>
        <button 
          onClick={() => {
            setEditingProduct({
              id: `custom-${Date.now()}`,
              name: '',
              price: 0,
              originalPrice: 0,
              image: '',
              images: [],
              category: '自定义商品',
              sales: 0,
              stock: 0,
              isCustom: true,
              description: '',
              specs: []
            });
            setMallView('custom_form');
          }}
          className="px-4 py-2 bg-rose-500 text-white rounded-full text-xs font-bold shadow-lg shadow-rose-200 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>新增商品</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
        {customProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Sparkles size={40} className="opacity-20" />
            </div>
            <p className="text-sm font-bold">暂无自定义商品，快去设计一件吧</p>
          </div>
        ) : (
          customProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-50">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                <img src={product.image || 'https://picsum.photos/seed/placeholder/200/200'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800">{product.name || '未命名商品'}</h4>
                  <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md font-bold">自定义</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">¥{product.price} · 库存 {product.stock}</p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setEditingProduct(product);
                      setMallView('custom_form');
                    }}
                    className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold hover:bg-slate-100 transition-colors"
                  >
                    编辑详情
                  </button>
                  <button 
                    onClick={() => {
                      setConfirmModal({
                        show: true,
                        title: '确定要删除这件商品吗？',
                        onConfirm: () => {
                          setCustomProducts(prev => prev.filter(p => p.id !== product.id));
                          setConfirmModal(null);
                        }
                      });
                    }}
                    className="px-4 py-1.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold hover:bg-red-100 transition-colors"
                  >
                    删除商品
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCustomProductForm = () => {
    if (!editingProduct) return null;

    const handleSave = () => {
      if (!editingProduct.name || !editingProduct.image) {
        alert('请填写商品名称并上传主图');
        return;
      }

      const product = editingProduct as MallProduct;
      setCustomProducts(prev => {
        const index = prev.findIndex(p => p.id === product.id);
        if (index >= 0) {
          const newProducts = [...prev];
          newProducts[index] = product;
          return newProducts;
        }
        return [...prev, product];
      });
      setMallView('custom_manage');
      setEditingProduct(null);
    };

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-6 pt-12 bg-white flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setMallView('custom_manage')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-slate-800" />
            </button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">编辑商品</h2>
          </div>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-rose-500 text-white rounded-full text-xs font-bold shadow-lg shadow-rose-200"
          >
            保存发布
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
          {/* Main Image Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800">商品主图</h3>
            <div className="relative aspect-square rounded-[32px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group">
              {editingProduct.image ? (
                <>
                  <img src={editingProduct.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        setInputModal({
                          show: true,
                          title: '修改主图 URL',
                          placeholder: '请输入图片 URL',
                          value: editingProduct.image || '',
                          onConfirm: (url) => {
                            setEditingProduct(prev => ({ ...prev, image: url }));
                            setInputModal(null);
                          }
                        });
                      }}
                      className="p-3 bg-white rounded-full text-slate-800 shadow-xl"
                    >
                      <Camera size={24} />
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setInputModal({
                      show: true,
                      title: '上传主图 URL',
                      placeholder: '请输入图片 URL',
                      value: '',
                      onConfirm: (url) => {
                        setEditingProduct(prev => ({ ...prev, image: url }));
                        setInputModal(null);
                      }
                    });
                  }}
                  className="flex flex-col items-center gap-2 text-slate-400"
                >
                  <Upload size={32} />
                  <span className="text-xs font-bold">点击上传主图</span>
                </button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">商品名称</label>
              <input 
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入商品名称"
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">价格 (¥)</label>
                <input 
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">库存</label>
                <input 
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">商品分类</label>
              <select 
                value={editingProduct.category}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all appearance-none"
              >
                {MALL_CATEGORIES.filter(c => c !== '全部').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">商品详情</label>
              <textarea 
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入商品详情描述..."
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">自定义设计说明</label>
              <textarea 
                value={editingProduct.customDesignNote || ''}
                onChange={(e) => setEditingProduct(prev => ({ ...prev, customDesignNote: e.target.value }))}
                placeholder="请输入自定义设计说明（如：刻字内容、特殊要求等）..."
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all resize-none"
              />
            </div>
          </div>

          {/* Detail Images */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800">细节/场景图</h3>
            <div className="grid grid-cols-3 gap-3">
              {(editingProduct.images || []).map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img src={img} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      const newImages = [...(editingProduct.images || [])];
                      newImages.splice(idx, 1);
                      setEditingProduct(prev => ({ ...prev, images: newImages }));
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  setInputModal({
                    show: true,
                    title: '添加细节图 URL',
                    placeholder: '请输入图片 URL',
                    value: '',
                    onConfirm: (url) => {
                      setEditingProduct(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                      setInputModal(null);
                    }
                  });
                }}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddressManage = () => (
    <div className="flex flex-col h-full bg-[#F8F8F8]">
      <div className="p-6 pt-12 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setMallView('checkout')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">收货地址</h2>
        </div>
        <button 
          onClick={() => {
            setEditingAddress({ id: `addr-${Date.now()}`, name: '', phone: '', area: '', detail: '', isDefault: false });
            setMallView('address_form');
          }}
          className="p-2 bg-rose-50 text-rose-500 rounded-full"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {addresses.map(addr => (
          <div 
            key={addr.id} 
            onClick={() => {
              setSelectedAddressId(addr.id);
              setMallView('checkout');
            }}
            className={cn(
              "bg-white p-6 rounded-[32px] shadow-sm border-2 transition-all cursor-pointer",
              selectedAddressId === addr.id ? "border-rose-200" : "border-transparent"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-800">{addr.name}</span>
                  <span className="text-xs font-bold text-slate-400">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-black rounded">默认</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{addr.area} {addr.detail}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingAddress(addr);
                  setMallView('address_form');
                }}
                className="p-2 text-slate-300 hover:text-slate-500"
              >
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAddressForm = () => {
    if (!editingAddress) return null;
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-6 pt-12 bg-white flex items-center gap-3 border-b border-slate-50">
          <button onClick={() => setMallView('address_manage')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">编辑地址</h2>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">收货人</label>
            <input 
              type="text"
              value={editingAddress.name}
              onChange={(e) => setEditingAddress(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入姓名"
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">联系电话</label>
            <input 
              type="text"
              value={editingAddress.phone}
              onChange={(e) => setEditingAddress(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="请输入手机号"
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">所在地区</label>
            <input 
              type="text"
              value={editingAddress.area}
              onChange={(e) => setEditingAddress(prev => ({ ...prev, area: e.target.value }))}
              placeholder="省、市、区/县"
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">详细地址</label>
            <textarea 
              value={editingAddress.detail}
              onChange={(e) => setEditingAddress(prev => ({ ...prev, detail: e.target.value }))}
              placeholder="街道、门牌号等"
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-50">
          <button 
            onClick={() => {
              const addr = editingAddress as MallAddress;
              setAddresses(prev => {
                const index = prev.findIndex(a => a.id === addr.id);
                if (index >= 0) {
                  const newAddrs = [...prev];
                  newAddrs[index] = addr;
                  return newAddrs;
                }
                return [...prev, addr];
              });
              setMallView('address_manage');
            }}
            className="w-full py-5 bg-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200"
          >
            保存地址
          </button>
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    if (!currentPaymentOrder) return null;
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-6 pt-12 bg-white flex items-center gap-3">
          <button onClick={() => setMallView('checkout')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">收银台</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-slate-400">支付金额</p>
            <p className="text-4xl font-black text-slate-800">¥{currentPaymentOrder.totalAmount}</p>
          </div>

          <div className="w-full bg-slate-50 p-8 rounded-[40px] space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">支付方式</span>
              <span className="text-sm font-black text-slate-800">
                {currentPaymentOrder.paymentMethod === 'wechat' ? '微信支付' : 
                 currentPaymentOrder.paymentMethod === 'alipay' ? '支付宝' : '余额支付'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">订单编号</span>
              <span className="text-xs font-medium text-slate-400">{currentPaymentOrder.id}</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={handleConfirmPayment}
              className="w-full py-5 bg-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200 flex items-center justify-center gap-3"
            >
              <Lock size={18} />
              确认支付
            </button>
            <p className="text-[10px] text-center text-slate-300 font-medium">支付环境已由月遇安全加密</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentSuccess = () => (
    <div className="flex flex-col h-full bg-white items-center justify-center p-8 space-y-8">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500">
        <CheckCircle2 size={48} />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-800">支付成功</h2>
        <p className="text-sm font-bold text-slate-400">您的心动商品正在准备中</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-4">
        <button 
          onClick={() => setMallView('home')}
          className="py-4 bg-slate-50 text-slate-500 rounded-full font-bold text-sm"
        >
          返回商城
        </button>
        <button 
          onClick={() => {
            setOrderStatusTab('待发货');
            setMallView('orders');
          }}
          className="py-4 bg-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200"
        >
          查看订单
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#FFF9F9] flex flex-col relative overflow-hidden font-sans text-slate-800">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-[#FFE4E6] blur-[100px] rounded-full opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-[#E0F2FE] blur-[100px] rounded-full opacity-60 pointer-events-none" />

      {/* 1. 顶部状态栏 */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm border border-white/60 flex items-center justify-center text-slate-600 transition-colors hover:bg-white/60"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          
          <div className="flex items-center gap-2 ml-1">
            <div className="relative">
              <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                <img 
                  src={userProfile.avatar} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-rose-400 text-white text-[7px] px-1 py-0.5 rounded-full border border-white font-bold">
                Lv.{userProfile.level}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-medium leading-none">亲密度</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                <span className="text-[10px] font-bold text-rose-400 whitespace-nowrap">心动初见</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-base font-bold tracking-widest text-slate-700 absolute left-1/2 -translate-x-1/2">月遇</h1>

        <div className="flex items-center gap-2">
          <button className="relative p-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm border border-white/60">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full border border-white" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm border border-white/60"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 custom-scrollbar">
        
        {/* 2. 核心场景推荐区 */}
        <section className="relative h-[380px] w-full rounded-[32px] overflow-hidden shadow-xl border border-white/40">
          <AnimatePresence mode="wait">
            <motion.div 
              key={SCENES[currentSceneIndex].id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
              onClick={() => {
                setSelectedScene(SCENES[currentSceneIndex]);
                setWallpaperUrl(sceneBackgrounds[SCENES[currentSceneIndex].id] || SCENES[currentSceneIndex].image);
                setIsPreparing(true);
              }}
            >
              <img 
                src={sceneBackgrounds[SCENES[currentSceneIndex].id] || SCENES[currentSceneIndex].image} 
                alt={SCENES[currentSceneIndex].title}
                className="w-full h-full object-cover"
              />
              <div className={cn("absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent", SCENES[currentSceneIndex].color)} />
              
              {/* Dynamic Light Effect Overlay */}
              <motion.div 
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] text-white font-medium border border-white/30">
                {SCENES[currentSceneIndex].tag}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {SCENES[currentSceneIndex].title}
              </h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSceneIndex((prev) => (prev + 1) % SCENES.length);
                }}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white group hover:bg-white/40 transition-all"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Indicators */}
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            {SCENES.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSceneIndex(idx)}
                className={cn(
                  "w-1.5 transition-all duration-300 rounded-full",
                  currentSceneIndex === idx ? "h-6 bg-white" : "h-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </section>

        {/* 3. 快捷功能区 */}
        <section className="flex justify-between px-2">
          <div className="flex flex-col items-center gap-3 group">
            <button 
              onClick={handleQuickDate}
              disabled={isQuickDating}
              className={cn(
                "w-16 h-16 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 shadow-lg shadow-rose-200/50 flex items-center justify-center text-white border-4 border-white group-hover:scale-110 transition-transform",
                isQuickDating && "animate-pulse"
              )}
            >
              <Sparkles className="w-8 h-8" />
            </button>
            <span className="text-xs font-bold text-slate-600">快速约会</span>
          </div>
          <div className="flex flex-col items-center gap-3 group">
            <button 
              onClick={() => {
                setIsCustomDating(true);
                setIsPreparing(true);
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 shadow-lg shadow-blue-200/50 flex items-center justify-center text-white border-4 border-white group-hover:scale-110 transition-transform"
            >
              <MapPin className="w-8 h-8" />
            </button>
            <span className="text-xs font-bold text-slate-600">自定义约会</span>
          </div>
          <div className="flex flex-col items-center gap-3 group">
            <button 
              onClick={() => setActiveTab('photo_album')}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-300 shadow-lg shadow-indigo-200/50 flex items-center justify-center text-white border-4 border-white group-hover:scale-110 transition-transform"
            >
              <Camera className="w-8 h-8" />
            </button>
            <span className="text-xs font-bold text-slate-600">约会相册</span>
          </div>
        </section>

        {/* Character Drawer Trigger Hint */}
        <div className="flex justify-center">
          <button 
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-md rounded-full border border-white shadow-sm text-slate-500 hover:bg-white/80 transition-all"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">查看在线角色</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* 4. AI角色抽屉栏 */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-72 bg-white/90 backdrop-blur-2xl z-50 shadow-2xl border-l border-white/40 flex flex-col"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">角色库</h3>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
                {friends.map(friend => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div 
                      key={friend.id} 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedFriendIds(selectedFriendIds.filter(id => id !== friend.id));
                        } else {
                          if (dateMode === 'single') {
                            setSelectedFriendIds([friend.id]);
                          } else if (selectedFriendIds.length < 3) {
                            setSelectedFriendIds([...selectedFriendIds, friend.id]);
                          }
                        }
                      }}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-2xl transition-all border group cursor-pointer",
                        isSelected ? "bg-rose-50 border-rose-200" : "hover:bg-white/60 border-transparent hover:border-white"
                      )}
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          isSelected ? "bg-rose-400" : "bg-green-400"
                        )} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-bold text-slate-800">{friend.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{friend.persona}</span>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-400 rounded-full font-bold">
                            心情: 愉悦
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100">
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="w-full py-4 bg-rose-400 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-500 transition-all"
                >
                  确认选择 ({selectedFriendIds.length})
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 6. 约会准备弹窗 */}
      <AnimatePresence>
        {isPreparing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreparing(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[70] p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">约会准备</h2>
                <button onClick={() => setIsPreparing(false)} className="text-slate-400 hover:text-slate-600">
                  <ChevronRight size={24} className="rotate-90" />
                </button>
              </div>

              {/* 模式选择 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">选择模式</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'single', name: '单人约会', desc: '专属私密互动' },
                    { id: 'multi', name: '多人约会', desc: '群像互动剧情' }
                  ].map(m => (
                    <button 
                      key={m.id}
                      onClick={() => {
                        setDateMode(m.id as any);
                        setSelectedFriendIds([]);
                      }}
                      className={cn(
                        "p-4 rounded-3xl border-2 transition-all text-left",
                        dateMode === m.id ? "border-rose-400 bg-rose-50" : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="font-bold text-slate-800">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 角色选择 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">选择角色</h3>
                  <button onClick={() => setShowDrawer(true)} className="text-xs font-bold text-rose-400">去选择角色</button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {selectedFriendIds.length === 0 ? (
                    <div className="w-full py-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-2">
                      <User size={24} />
                      <span className="text-xs font-bold">尚未选择角色</span>
                    </div>
                  ) : (
                    selectedFriendIds.map(id => {
                      const friend = friends.find(f => f.id === id);
                      return (
                        <div key={id} className="flex-shrink-0 flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rose-200 shadow-sm">
                            <img src={friend?.avatar} alt={friend?.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{friend?.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 环境设置 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">环境设置</h3>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400">时间</span>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                      {[
                        { id: 'day', icon: <Sun size={14} /> },
                        { id: 'sunset', icon: <Sun size={14} className="text-orange-400" /> },
                        { id: 'night', icon: <Moon size={14} /> }
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setTimeOfDay(t.id as any)}
                          className={cn(
                            "flex-1 py-2 flex items-center justify-center rounded-xl transition-all",
                            timeOfDay === t.id ? "bg-white shadow-sm text-rose-400" : "text-slate-400"
                          )}
                        >
                          {t.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400">天气</span>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                      {[
                        { id: 'sunny', icon: <Sun size={14} /> },
                        { id: 'rainy', icon: <CloudRain size={14} /> }
                      ].map(w => (
                        <button 
                          key={w.id}
                          onClick={() => setWeather(w.id as any)}
                          className={cn(
                            "flex-1 py-2 flex items-center justify-center rounded-xl transition-all",
                            weather === w.id ? "bg-white shadow-sm text-rose-400" : "text-slate-400"
                          )}
                        >
                          {w.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 约会场景 (仅自定义约会显示) */}
              {isCustomDating && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">自定义约会场景</h3>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-rose-100">
                    <textarea 
                      value={customSceneDescription}
                      onChange={(e) => setCustomSceneDescription(e.target.value)}
                      placeholder="描述一下你想开启的约会场景（例如：在落日余晖下的海边，我们并肩漫步...）"
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300 min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 主题选择 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">约会主题</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['下午茶闲聊', '浪漫告白', '解压陪伴', '剧情演绎'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "py-3 px-4 rounded-2xl border-2 text-xs font-bold transition-all",
                        theme === t ? "border-rose-400 bg-rose-50 text-rose-500" : "border-slate-50 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl">
                  <input 
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="自定义约会想法..."
                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (isCustomDating && customSceneDescription.trim()) {
                    handleStartDate(customSceneDescription);
                  } else {
                    handleStartDate();
                  }
                  setIsCustomDating(false);
                  setCustomSceneDescription('');
                }}
                disabled={selectedFriendIds.length === 0 || (isCustomDating && !customSceneDescription.trim())}
                className="w-full py-5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-[32px] font-bold shadow-xl shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                开启约会
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. 底部导航栏 */}
      <nav className="absolute bottom-6 left-6 right-6 h-18 bg-white/70 backdrop-blur-2xl rounded-[28px] shadow-xl border border-white/60 flex items-center justify-around px-4 z-10">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'home' ? "text-rose-400 scale-110" : "text-slate-400"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">首页</span>
        </button>
        <button 
          onClick={() => setActiveTab('album')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'album' ? "text-rose-400 scale-110" : "text-slate-400"
          )}
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">约会小结</span>
        </button>
        <button 
          onClick={() => setActiveTab('mall')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'mall' ? "text-rose-400 scale-110" : "text-slate-400"
          )}
        >
          <Store className="w-6 h-6" />
          <span className="text-[10px] font-bold">商城</span>
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'mine' ? "text-rose-400 scale-110" : "text-slate-400"
          )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">我的</span>
        </button>
      </nav>

      {/* Photo Album Page Overlay */}
      <AnimatePresence>
        {activeTab === 'photo_album' && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 bg-[#FFF9F9] z-[80] flex flex-col"
          >
            <div className="p-6 pt-12 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/60">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">约会相册</h2>
              <button 
                onClick={() => setActiveTab('home')}
                className="p-2 bg-white rounded-full shadow-sm"
              >
                <ChevronLeft size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
              {dateAlbum.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <Camera size={48} />
                  <p className="text-sm font-bold">相册空空如也，快去约会拍照吧</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {friends.map(friend => {
                    const friendPhotos = dateAlbum.filter(p => p.friendId === friend.id);
                    if (friendPhotos.length === 0) return null;

                    return (
                      <div key={friend.id} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                            <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-700">{friend.name} 的相册</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {friendPhotos.map((photo, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-md group cursor-zoom-in"
                              onClick={() => setZoomedImage(photo.url)}
                            >
                              <img src={photo.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-[10px] text-white italic line-clamp-2 mb-1">“{photo.thought}”</p>
                                <div className="text-[8px] text-white/80 font-bold">{photo.theme}</div>
                                <div className="text-[7px] text-white/60">{photo.date}</div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    show: true,
                                    title: '确定要删除这张照片吗？',
                                    onConfirm: () => {
                                      setDateAlbum(prev => prev.filter(p => p.url !== photo.url));
                                      setConfirmModal(null);
                                    }
                                  });
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Page Overlay (Postcards) */}
      <AnimatePresence>
        {activeTab === 'album' && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 bg-[#FFF9F9] z-[80] flex flex-col"
          >
            <div className="p-6 pt-12 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/60">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">约会小结</h2>
              <button 
                onClick={() => setActiveTab('home')}
                className="p-2 bg-white rounded-full shadow-sm"
              >
                <ChevronLeft size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12 custom-scrollbar">
              {friends.map(friend => {
                const friendPostcards = postcards.filter(p => p.friendId === friend.id);
                if (friendPostcards.length === 0) return null;

                return (
                  <div key={friend.id} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-slate-700">{friend.name} 的珍藏</h3>
                        <div className="flex gap-1">
                          <span className="text-[8px] px-1.5 py-0.5 bg-rose-50 text-rose-400 rounded-md font-bold uppercase tracking-wider">专属回忆</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-bold uppercase tracking-wider">{friendPostcards.length} 篇小结</span>
                        </div>
                      </div>
                    </div>
                    
              <div className="space-y-12">
                {friendPostcards.map(postcard => (
                  <Postcard 
                    key={postcard.id}
                    postcard={postcard}
                    onDelete={() => {
                      setConfirmModal({
                        show: true,
                        title: '确定要删除这条约会小结吗？',
                        onConfirm: () => {
                          setPostcards(prev => prev.filter(p => p.id !== postcard.id));
                          setConfirmModal(null);
                        }
                      });
                    }}
                    onUpdate={(updated) => {
                      setPostcards(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                  />
                ))}
              </div>
                  </div>
                );
              })}

              {postcards.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20">
                  <Camera size={64} strokeWidth={1} />
                  <p className="text-sm font-medium">还没有约会小结哦，快去约会吧</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 6. Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-8 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">约会设置</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">内置场景背景</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {SCENES.map(scene => (
                      <div key={scene.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">{scene.title}</span>
                          <button 
                            onClick={() => {
                              setInputModal({
                                show: true,
                                title: `更换 ${scene.title} 背景`,
                                placeholder: '请输入图片 URL',
                                value: sceneBackgrounds[scene.id] || '',
                                onConfirm: (url) => {
                                  setSceneBackgrounds(prev => ({ ...prev, [scene.id]: url }));
                                  setInputModal(null);
                                }
                              });
                            }}
                            className="text-[10px] font-bold text-rose-400"
                          >
                            更换背景
                          </button>
                        </div>
                        <div className="h-20 rounded-2xl overflow-hidden border border-slate-100">
                          <img 
                            src={sceneBackgrounds[scene.id] || scene.image} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-slate-800 text-white rounded-[24px] font-bold shadow-lg"
              >
                保存并退出
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Mine Tab Overlay */}
      <AnimatePresence>
        {activeTab === 'mine' && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 bg-[#FFF9F9] z-[80] flex flex-col"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
              {/* Profile Header Card */}
              <div className="relative h-80">
                <img 
                  src={userProfile.background} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#FFF9F9]" />
                
                <button 
                  onClick={() => setActiveTab('home')}
                  className="absolute top-12 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/40 z-10"
                >
                  <ChevronLeft size={24} />
                </button>

                <button 
                  onClick={() => {
                    setInputModal({
                      show: true,
                      title: '更换背景墙',
                      placeholder: '请输入图片 URL',
                      value: userProfile.background,
                      onConfirm: (url) => {
                        setUserProfile(prev => ({ ...prev, background: url }));
                        setInputModal(null);
                      }
                    });
                  }}
                  className="absolute top-12 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/40"
                >
                  <Camera size={20} />
                </button>

                <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-[36px] border-4 border-white shadow-2xl overflow-hidden bg-rose-100">
                      <img src={userProfile.avatar} className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => {
                        setInputModal({
                          show: true,
                          title: '更换头像',
                          placeholder: '请输入图片 URL',
                          value: userProfile.avatar,
                          onConfirm: (url) => {
                            setUserProfile(prev => ({ ...prev, avatar: url }));
                            setInputModal(null);
                          }
                        });
                      }}
                      className="absolute -bottom-2 -right-2 p-2 bg-rose-400 text-white rounded-2xl shadow-lg border-2 border-white"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-800">{userProfile.name}</h2>
                      <button 
                        onClick={() => {
                          setInputModal({
                            show: true,
                            title: '修改等级',
                            placeholder: '请输入等级数字',
                            value: userProfile.level.toString(),
                            onConfirm: (val) => {
                              const level = parseInt(val);
                              if (!isNaN(level)) {
                                setUserProfile(prev => ({ ...prev, level }));
                              }
                              setInputModal(null);
                            }
                          });
                        }}
                        className="px-2 py-0.5 bg-rose-100 text-rose-500 text-[10px] font-black rounded-lg border border-rose-200"
                      >
                        LV.{userProfile.level}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">{userProfile.signature}</p>
                  </div>
                </div>
              </div>

              <div className="mt-20 px-8 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '约会次数', value: postcards.length },
                    { label: '心动好友', value: friends.length },
                    { label: '收藏照片', value: dateAlbum.length },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                      <div className="text-lg font-black text-slate-800">{stat.value}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 px-2">个人设置</h3>
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    {[
                      { label: '修改昵称', icon: <User size={18} />, action: () => {
                        setInputModal({
                          show: true,
                          title: '修改昵称',
                          placeholder: '请输入新昵称',
                          value: userProfile.name,
                          onConfirm: (name) => {
                            setUserProfile(prev => ({ ...prev, name }));
                            setInputModal(null);
                          }
                        });
                      }},
                      { label: '个性签名', icon: <Edit size={18} />, action: () => {
                        setInputModal({
                          show: true,
                          title: '修改个性签名',
                          placeholder: '请输入新签名',
                          value: userProfile.signature,
                          onConfirm: (sig) => {
                            setUserProfile(prev => ({ ...prev, signature: sig }));
                            setInputModal(null);
                          }
                        });
                      }},
                      { label: '隐私设置', icon: <Lock className="w-5 h-5" />, action: () => {} },
                    ].map((item, i) => (
                      <button 
                        key={i} 
                        onClick={item.action}
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            {item.icon}
                          </div>
                          <span className="text-sm font-bold text-slate-600">{item.label}</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-[280px] space-y-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 size={32} />
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                {confirmModal.title}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-2xl font-bold text-xs"
                >
                  取消
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 bg-rose-400 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-200"
                >
                  确定删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 11. Mall Page Overlay */}
      <AnimatePresence>
        {activeTab === 'mall' && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 bg-[#F8F8F8] z-[80] flex flex-col"
          >
            {renderMallContent()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 12. Custom Input Modal */}
      <AnimatePresence>
        {inputModal && (
          <div className="absolute inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">{inputModal.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">请输入新内容</p>
              </div>

              <div className="relative">
                <input 
                  autoFocus
                  type="text"
                  value={inputModal.value}
                  onChange={(e) => setInputModal({ ...inputModal, value: e.target.value })}
                  placeholder={inputModal.placeholder}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') inputModal.onConfirm(inputModal.value);
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setInputModal(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-[24px] font-bold"
                >
                  取消
                </button>
                <button 
                  onClick={() => inputModal.onConfirm(inputModal.value)}
                  className="flex-1 py-4 bg-rose-400 text-white rounded-[24px] font-bold shadow-lg shadow-rose-200"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 10. Zoomed Image Overlay */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="absolute inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedImage} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-12 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatingApp;
