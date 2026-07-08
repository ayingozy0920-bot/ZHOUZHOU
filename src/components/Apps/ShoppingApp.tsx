import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, ShoppingCart, User, RefreshCw, Plus, 
  Trash2, Send, X, Check, Heart, ShoppingBag, Sparkles, MessageCircle, ArrowRight, Gift
} from 'lucide-react';
import { AppSettings, Friend, ChatMessage } from '../../types';
import { cn } from '../../lib/utils';

interface ShoppingAppProps {
  settings: AppSettings;
  friends: Friend[];
  onBack: () => void;
  addMessage: (friendId: string, message: ChatMessage) => void;
  addTransaction?: (transaction: any) => void;
}

interface GoodsItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  source: 'tb' | 'mt';
  tag?: string;
}

interface CartItem extends GoodsItem {
  cartId: string;
}

interface OrderItem extends GoodsItem {
  orderId: string;
  orderType: '自购' | '赠送';
  target: string;
  timestamp: number;
  message?: string;
}

export const ShoppingApp: React.FC<ShoppingAppProps> = ({
  settings,
  friends,
  onBack,
  addMessage,
  addTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'taobao' | 'meituan' | 'cart' | 'mine'>('taobao');
  
  const STORAGE_KEYS = {
    taobao: 'shop_taobao_goods_v2',
    meituan: 'shop_meituan_goods_v2',
    cart: 'shop_cart_items_v2',
    orders: 'shop_orders_items_v2',
    apiUrl: 'shop_backend_api_url',
    apiKey: 'shop_backend_api_key',
    selectedModel: 'shop_backend_selected_model'
  };

  const [taobaoGoods, setTaobaoGoods] = useState<GoodsItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.taobao);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 'tb-1', name: "复古宽松纯棉日系T恤", desc: "春夏基础百搭款，多色可选，透气亲肤不闷汗", price: 59.9, source: 'tb', tag: 'HOT' },
      { id: 'tb-2', name: "无线降噪蓝牙运动耳机", desc: "长续航低延迟，HiFi音质通勤运动专用", price: 139, source: 'tb', tag: '荐' },
      { id: 'tb-3', name: "手作陶瓷马克杯伴手礼", desc: "温润釉面手工拉坯，附赠精美礼盒", price: 48, source: 'tb', tag: '新' },
      { id: 'tb-4', name: "法式复古碎花连衣裙", desc: "优雅收腰显瘦，度假通勤两相宜", price: 128, source: 'tb', tag: '精选' },
      { id: 'tb-5', name: "极简设计桌面香薰机", desc: "超声波静音加湿，天然植物精油伴眠", price: 89, source: 'tb', tag: '热销' }
    ];
  });

  const [meituanGoods, setMeituanGoods] = useState<GoodsItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.meituan);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 'mt-1', name: "招牌秘制卤肉双拼饭", desc: "软糯卤肉足量配流心卤蛋小菜，附赠滋补例汤", price: 22.8, source: 'mt', tag: 'TOP' },
      { id: 'mt-2', name: "鲜果四季清爽大杯奶茶", desc: "当季新鲜手切水果搭配清香茶底，少糖冰爽", price: 16.5, source: 'mt', tag: '爆款' },
      { id: 'mt-3', name: "日式炙烤厚切鳗鱼饭", desc: "特选肥美鳗鱼佐以秘制酱汁，鲜香扑鼻", price: 45, source: 'mt', tag: '优选' },
      { id: 'mt-4', name: "轻食羽衣甘蓝牛油果沙拉", desc: "低卡高纤，优质蛋白，减脂期首选", price: 32, source: 'mt', tag: '健康' },
      { id: 'mt-5', name: "手作现烤流心芝士披萨", desc: "浓郁拉丝芝士，酥脆饼底", price: 58, source: 'mt', tag: '招牌' }
    ];
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.cart);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [orders, setOrders] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.orders);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.apiUrl) || settings.baseUrl || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.apiKey) || '');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(STORAGE_KEYS.selectedModel) || 'gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('shop_backend_models');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'deepseek-chat'];
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedGoodsForGift, setSelectedGoodsForGift] = useState<GoodsItem | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id || '');
  const [giftMessage, setGiftMessage] = useState('这个看起来很适合你，送给你呀~');

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.taobao, JSON.stringify(taobaoGoods));
    } catch (e) {
      console.warn("Storage quota exceeded for taobaoGoods", e);
    }
  }, [taobaoGoods]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.meituan, JSON.stringify(meituanGoods));
    } catch (e) {
      console.warn("Storage quota exceeded for meituanGoods", e);
    }
  }, [meituanGoods]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Storage quota exceeded for cartItems", e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch (e) {
      console.warn("Storage quota exceeded for orders", e);
    }
  }, [orders]);

  const handleAddToCart = (goods: GoodsItem) => {
    const newItem: CartItem = { ...goods, cartId: 'cart-' + Date.now() + Math.random() };
    setCartItems(prev => [...prev, newItem]);
    showToast(`已将 "${goods.name}" 加入购物车`);
  };

  const handleBuyNow = (goods: GoodsItem) => {
    const newOrder: OrderItem = {
      ...goods,
      orderId: 'order-' + Date.now(),
      orderType: '自购',
      target: '自己',
      timestamp: Date.now()
    };
    setOrders(prev => [newOrder, ...prev]);
    if (addTransaction) {
      addTransaction({
        id: 'tx-' + Date.now(),
        type: 'spend',
        amount: goods.price,
        description: `购买商品：${goods.name}`,
        timestamp: Date.now()
      });
    }
    setCheckoutModalOpen(true);
  };

  const openGiftModal = (goods: GoodsItem) => {
    setSelectedGoodsForGift(goods);
    setGiftMessage(`看到这个觉得很适合你，特意买来送给你的哦~`);
    if (friends.length > 0 && !selectedFriendId) {
      setSelectedFriendId(friends[0].id);
    }
    setGiftModalOpen(true);
  };

  const handleConfirmGift = () => {
    if (!selectedGoodsForGift) return;
    const friend = friends.find(f => f.id === selectedFriendId);
    if (!friend) {
      showToast('请选择接收角色');
      return;
    }

    const orderItem: OrderItem = {
      ...selectedGoodsForGift,
      orderId: 'order-' + Date.now(),
      orderType: '赠送',
      target: friend.name,
      timestamp: Date.now(),
      message: giftMessage
    };
    setOrders(prev => [orderItem, ...prev]);

    if (addTransaction) {
      addTransaction({
        id: 'tx-' + Date.now(),
        type: 'spend',
        amount: selectedGoodsForGift.price,
        description: `赠送商品给 ${friend.name}：${selectedGoodsForGift.name}`,
        timestamp: Date.now()
      });
    }

    addMessage(friend.id, {
      role: 'user',
      content: `[赠送商品小票] ${selectedGoodsForGift.name}`,
      type: 'shopping-receipt',
      timestamp: Date.now(),
      giftData: {
        boxId: orderItem.orderId,
        boxName: selectedGoodsForGift.name,
        coverUrl: '',
        message: giftMessage,
        price: selectedGoodsForGift.price,
        isOpened: false,
        source: selectedGoodsForGift.source
      },
      description: selectedGoodsForGift.desc
    });

    setGiftModalOpen(false);
    showToast(`已成功将礼物赠送给 ${friend.name} 并发送小票卡片至聊天`);
  };

  const handleAddCustomGoods = (type: 'tb' | 'mt') => {
    if (!customName.trim() || !customDesc.trim() || !customPrice) {
      showToast('请完整填写商品名称、描述和价格');
      return;
    }
    const priceNum = parseFloat(customPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('请输入有效的价格');
      return;
    }

    const newGoods: GoodsItem = {
      id: `${type}-${Date.now()}`,
      name: customName.trim(),
      desc: customDesc.trim(),
      price: priceNum,
      source: type,
      tag: '自定'
    };

    if (type === 'tb') {
      setTaobaoGoods(prev => [newGoods, ...prev]);
    } else {
      setMeituanGoods(prev => [newGoods, ...prev]);
    }

    setCustomName('');
    setCustomDesc('');
    setCustomPrice('');
    showToast('自定义商品添加成功');
  };

  const handleFetchModels = async () => {
    if (!apiUrl.trim()) {
      showToast('请先输入API地址');
      return;
    }
    setIsFetchingModels(true);
    setTestStatus(null);
    try {
      const base = apiUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '');
      const modelsUrl = `${base}/models`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
      const res = await fetch(modelsUrl, { method: 'GET', headers });
      if (!res.ok) throw new Error('拉取模型列表失败');
      const data = await res.json();
      let modelList: string[] = [];
      if (Array.isArray(data)) {
        modelList = data.map((m: any) => m.id || m.name || m);
      } else if (data.data && Array.isArray(data.data)) {
        modelList = data.data.map((m: any) => m.id || m.name || m);
      }
      if (modelList.length > 0) {
        setAvailableModels(modelList);
        localStorage.setItem('shop_backend_models', JSON.stringify(modelList));
        if (!modelList.includes(selectedModel)) {
          setSelectedModel(modelList[0]);
          localStorage.setItem(STORAGE_KEYS.selectedModel, modelList[0]);
        }
        showToast(`成功获取 ${modelList.length} 个可用模型`);
      } else {
        throw new Error('未解析到可用模型');
      }
    } catch (err) {
      showToast('拉取模型失败，已保留常用默认模型列表');
      console.warn(err);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      showToast('请输入API地址进行测试');
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    setTestMessage(null);
    try {
      const endpoint = apiUrl.endsWith('/chat/completions') 
        ? apiUrl 
        : apiUrl.endsWith('/') 
          ? `${apiUrl}chat/completions` 
          : `${apiUrl}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: selectedModel || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 80)}`);
      }

      setTestStatus('success');
      setTestMessage('测试成功：API连接与密钥验证正常，大模型代理工作正常。');
      showToast('API测试连接成功');
      
      localStorage.setItem(STORAGE_KEYS.apiUrl, apiUrl);
      localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
      localStorage.setItem(STORAGE_KEYS.selectedModel, selectedModel);
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`测试失败：${err.message || '网络连接或密钥错误'}`);
      showToast('API测试连接失败');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshGoods = async (type: 'tb' | 'mt') => {
    if (!apiUrl.trim()) {
      showToast('请先在个人中心配置后端代理API地址');
      return;
    }
    setIsRefreshing(true);
    try {
      let data: any = null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const isChatEndpoint = apiUrl.includes('chat/completions') || apiUrl.includes('/v1') || apiUrl.includes('api.') || apiUrl.includes('v1/');
      if (isChatEndpoint) {
        const endpoint = apiUrl.endsWith('/chat/completions') 
          ? apiUrl 
          : apiUrl.endsWith('/') 
            ? `${apiUrl}chat/completions` 
            : `${apiUrl}/chat/completions`;

        const promptText = type === 'tb'
          ? "请生成5个淘宝网精选时尚/生活/数码好物商品。每个商品必须包含：name（商品名称，字符串，吸引人）、desc（商品亮点描述，字符串）、price（价格，数字，10到500之间）。严格只返回JSON数组，不要包含任何markdown修饰符，格式如：[{\"name\":\"...\",\"desc\":\"...\",\"price\":99.9}]"
          : "请生成5个美团外卖/品质美食局好物商品。每个商品必须包含：name（美食名称，字符串）、desc（口味与特色描述，字符串）、price（价格，数字，10到200之间）。严格只返回JSON数组，不要包含任何markdown修饰符，格式如：[{\"name\":\"...\",\"desc\":\"...\",\"price\":28.5}]";

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: selectedModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a JSON generator. Output ONLY a valid JSON array of 5 items. No markdown.' },
              { role: 'user', content: promptText }
            ],
            temperature: 0.8
          })
        });
        if (!res.ok) throw new Error('LLM API request failed');
        const jsonRes = await res.json();
        const content = jsonRes.choices?.[0]?.message?.content || jsonRes.content || '';
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          data = parsed;
        }
      }

      if (!data) {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type, action: 'refresh_goods', model: selectedModel })
        });
        if (!res.ok) throw new Error('Network request failed');
        const resJson = await res.json();
        if (Array.isArray(resJson)) {
          data = resJson;
        } else if (resJson.data && Array.isArray(resJson.data)) {
          data = resJson.data;
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.slice(0, 5).map((item: any, idx: number) => ({
          id: `${type}-ai-${Date.now()}-${idx}`,
          name: item.name || item.title || '精选新品',
          desc: item.desc || item.description || '精选好物，品质保证',
          price: Number(item.price) || 29.9,
          source: type,
          tag: 'AI专享'
        }));
        if (type === 'tb') {
          setTaobaoGoods(formatted);
        } else {
          setMeituanGoods(formatted);
        }
        showToast('成功通过专属API刷新出5个精选商品');
      } else {
        throw new Error('返回数据格式不正确');
      }
    } catch (err) {
      console.warn("API refresh error, fallback to curated items:", err);
      if (type === 'tb') {
        setTaobaoGoods([
          { id: 'tb-f1', name: '法式复古碎花连衣裙', desc: '优雅收腰显瘦，度假通勤两相宜', price: 128, source: 'tb', tag: '精选' },
          { id: 'tb-f2', name: '极简设计桌面香薰机', desc: '超声波静音加湿，天然植物精油伴眠', price: 89, source: 'tb', tag: '热销' },
          { id: 'tb-f3', name: '无线降噪蓝牙运动耳机', desc: '长续航低延迟，HiFi音质通勤专用', price: 139, source: 'tb', tag: '荐' },
          { id: 'tb-f4', name: '手作陶瓷马克杯伴手礼', desc: '温润釉面手工拉坯，附赠精美礼盒', price: 48, source: 'tb', tag: '新' },
          { id: 'tb-f5', name: '复古纯棉日系宽松T恤', desc: '春夏基础百搭款，透气亲肤不闷汗', price: 59.9, source: 'tb', tag: 'HOT' }
        ]);
      } else {
        setMeituanGoods([
          { id: 'mt-f1', name: '轻食羽衣甘蓝牛油果沙拉', desc: '低卡高纤，优质蛋白，减脂期首选', price: 32, source: 'mt', tag: '健康' },
          { id: 'mt-f2', name: '手作现烤流心芝士披萨', desc: '浓郁拉丝芝士，酥脆饼底', price: 58, source: 'mt', tag: '招牌' },
          { id: 'mt-f3', name: '招牌秘制卤肉双拼饭', desc: '软糯卤肉足量配流心卤蛋小菜', price: 22.8, source: 'mt', tag: 'TOP' },
          { id: 'mt-f4', name: '鲜果四季清爽大杯奶茶', desc: '当季新鲜手切水果搭配清香茶底', price: 16.5, source: 'mt', tag: '爆款' },
          { id: 'mt-f5', name: '日式炙烤厚切鳗鱼饭', desc: '特选肥美鳗鱼佐以秘制酱汁', price: 45, source: 'mt', tag: '优选' }
        ]);
      }
      showToast('API调用未能返回标准商品格式，已为您加载5个甄选好物');
    } finally {
      setIsRefreshing(false);
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckoutCart = () => {
    if (cartItems.length === 0) {
      showToast('购物车是空的');
      return;
    }
    const newOrders: OrderItem[] = cartItems.map(item => ({
      ...item,
      orderId: 'order-' + Date.now() + Math.random(),
      orderType: '自购',
      target: '自己',
      timestamp: Date.now()
    }));
    setOrders(prev => [...newOrders, ...prev]);
    if (addTransaction) {
      addTransaction({
        id: 'tx-' + Date.now(),
        type: 'spend',
        amount: cartTotal,
        description: `购物车结算 (${cartItems.length}件商品)`,
        timestamp: Date.now()
      });
    }
    setCartItems([]);
    setCheckoutModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfbf8] text-[#222] font-sans relative overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-[#f0ebe3] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all text-xs font-bold"
            >
              ✕
            </button>
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">SHOP MAGAZINE</span>
          </div>
          <div className="text-[11px] text-slate-400 bg-[#f6f3ee] px-2.5 py-0.5 rounded-full font-medium">
            {activeTab === 'taobao' ? '淘宝商城' : activeTab === 'meituan' ? '美团外卖' : activeTab === 'cart' ? '购物车' : '个人中心'}
          </div>
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          {activeTab === 'taobao' ? '淘宝甄选好物刊' : activeTab === 'meituan' ? '美团品质生活局' : activeTab === 'cart' ? '购物车清单' : '订单与赠送记录'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeTab === 'taobao' ? 'Discover curated fashion & lifestyle items' : activeTab === 'meituan' ? 'Fresh meals & daily delicacies delivered' : activeTab === 'cart' ? 'Review items before checkout' : 'All purchased and gifted items'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-5">
        {/* TAB 1: TAOBAO */}
        {activeTab === 'taobao' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => handleRefreshGoods('tb')}
              disabled={isRefreshing}
              className="w-full py-3 bg-[#fff3ee] hover:bg-[#ffece5] text-[#ff5020] border border-[#ffdfd0] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? '正在同步后端API...' : '⟳ 刷新淘宝精选商品 (API)'}
            </button>

            {/* Custom Add Box */}
            <div className="bg-white rounded-2xl p-4 border border-[#f0ebe3] shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase">添加自定义淘宝商品</h4>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="商品名称"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020]"
              />
              <textarea
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="商品详细描述"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020] h-16 resize-none"
              />
              <input
                type="number"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="价格 (¥)"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020]"
              />
              <button
                onClick={() => handleAddCustomGoods('tb')}
                className="w-full py-2.5 bg-[#ff5020] hover:bg-[#e0441b] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                上架到淘宝店铺
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">🍑 淘宝官方精选旗舰店</span>
              <span className="text-[10px] text-slate-400">{taobaoGoods.length} 件好物</span>
            </div>

            {/* Goods List */}
            <div className="grid grid-cols-1 gap-4">
              {taobaoGoods.map(goods => (
                <div key={goods.id} className="bg-white rounded-2xl overflow-hidden border border-[#f0ebe3] shadow-sm flex flex-col group">
                  <div className="w-full h-36 bg-gradient-to-br from-orange-50 via-rose-50 to-orange-100 flex items-center justify-center p-4 relative">
                    <span className="absolute top-3 left-3 bg-[#ff5020]/10 text-[#ff5020] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {goods.tag || 'HOT'}
                    </span>
                    <ShoppingBag size={36} className="text-[#ff5020]/40 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{goods.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{goods.desc}</p>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-base font-black text-[#ff5020]">¥{goods.price}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAddToCart(goods)}
                          className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#ff5020] rounded-xl text-[11px] font-bold transition-all"
                        >
                          加购
                        </button>
                        <button
                          onClick={() => handleBuyNow(goods)}
                          className="px-2.5 py-1.5 bg-[#ff5020] hover:bg-[#e0441b] text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                        >
                          购买
                        </button>
                        <button
                          onClick={() => openGiftModal(goods)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Gift size={12} /> 赠送
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MEITUAN */}
        {activeTab === 'meituan' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => handleRefreshGoods('mt')}
              disabled={isRefreshing}
              className="w-full py-3 bg-[#edf9f7] hover:bg-[#dff5f2] text-[#06b8a9] border border-[#bcf0e9] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? '正在同步外卖API...' : '⟳ 刷新外卖精选餐品 (API)'}
            </button>

            {/* Custom Add Box */}
            <div className="bg-white rounded-2xl p-4 border border-[#f0ebe3] shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase">添加自定义外卖餐品</h4>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="餐品名称"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#06b8a9]"
              />
              <textarea
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="餐品详细描述与配料"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#06b8a9] h-16 resize-none"
              />
              <input
                type="number"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="价格 (¥)"
                className="w-full px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#06b8a9]"
              />
              <button
                onClick={() => handleAddCustomGoods('mt')}
                className="w-full py-2.5 bg-[#06b8a9] hover:bg-[#059e91] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                上架到美团外卖店
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">🍜 品质甄选外卖餐饮店</span>
              <span className="text-[10px] text-slate-400">{meituanGoods.length} 款美味</span>
            </div>

            {/* Goods List */}
            <div className="grid grid-cols-1 gap-4">
              {meituanGoods.map(goods => (
                <div key={goods.id} className="bg-white rounded-2xl overflow-hidden border border-[#f0ebe3] shadow-sm flex flex-col group">
                  <div className="w-full h-36 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4 relative">
                    <span className="absolute top-3 left-3 bg-[#06b8a9]/10 text-[#06b8a9] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {goods.tag || 'NEW'}
                    </span>
                    <Utensils size={36} className="text-[#06b8a9]/40 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{goods.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{goods.desc}</p>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-base font-black text-[#06b8a9]">¥{goods.price}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAddToCart(goods)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#06b8a9] rounded-xl text-[11px] font-bold transition-all"
                        >
                          加购
                        </button>
                        <button
                          onClick={() => handleBuyNow(goods)}
                          className="px-2.5 py-1.5 bg-[#06b8a9] hover:bg-[#059e91] text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                        >
                          下单
                        </button>
                        <button
                          onClick={() => openGiftModal(goods)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Gift size={12} /> 赠送
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CART */}
        {activeTab === 'cart' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 border border-[#f0ebe3] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-900">购物车清单 ({cartItems.length})</h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    清空购物车
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  购物车空空如也，快去淘宝或美团挑选心仪的好物吧~
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div key={item.cartId || index} className="flex items-center justify-between p-3 bg-[#fcfbf8] rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold",
                          item.source === 'tb' ? "bg-orange-100 text-[#ff5020]" : "bg-emerald-100 text-[#06b8a9]"
                        )}>
                          {item.source === 'tb' ? '淘' : '美'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.source === 'tb' ? '淘宝商品' : '美团外卖'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">¥{item.price}</span>
                        <button
                          onClick={() => setCartItems(prev => prev.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">总计金额</p>
                      <p className="text-xl font-black text-[#ff5020]">¥{cartTotal.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={handleCheckoutCart}
                      className="px-6 py-3 bg-gradient-to-r from-[#ff5020] to-[#ff7848] text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all"
                    >
                      立即结算
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MINE / ORDERS */}
        {activeTab === 'mine' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-5 border border-[#f0ebe3] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-900">全部订单与赠送记录 ({orders.length})</h3>
                {orders.length > 0 && (
                  <button
                    onClick={() => setOrders([])}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    清空记录
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  暂无历史订单或赠送记录
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.orderId} className="p-3 bg-[#fcfbf8] rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full",
                          order.orderType === '自购' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {order.orderType} {order.orderType === '赠送' && `→ ${order.target}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.timestamp).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{order.name}</p>
                          {order.message && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">附言: "{order.message}"</p>
                          )}
                        </div>
                        <span className="text-sm font-black text-slate-900">¥{order.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Backend API Configuration Setting */}
            <div className="bg-white rounded-2xl p-4 border border-[#f0ebe3] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#ff5020]" /> 后端代理大模型API配置
                </h4>
                <span className="text-[10px] bg-orange-50 text-[#ff5020] px-2 py-0.5 rounded-full font-bold">OpenAI 兼容</span>
              </div>
              <p className="text-[11px] text-slate-500">设置用于刷新商品的AI后端代理地址、密钥及模型选择：</p>
              
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">API 地址 (支持 /v1/chat/completions 或自定义代理)</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={e => {
                      setApiUrl(e.target.value);
                      try { localStorage.setItem(STORAGE_KEYS.apiUrl, e.target.value); } catch (err) {}
                    }}
                    placeholder="例如: https://api.openai.com/v1"
                    className="w-full mt-1 px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700">API 密钥 (Secret Key)</label>
                  <div className="relative mt-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={e => {
                        setApiKey(e.target.value);
                        try { localStorage.setItem(STORAGE_KEYS.apiKey, e.target.value); } catch (err) {}
                      }}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 pr-16 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 bg-slate-100 rounded"
                    >
                      {showApiKey ? '隐藏' : '显示'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-700">选择模型</label>
                    <select
                      value={selectedModel}
                      onChange={e => {
                        setSelectedModel(e.target.value);
                        try { localStorage.setItem(STORAGE_KEYS.selectedModel, e.target.value); } catch (err) {}
                      }}
                      className="w-full mt-1 px-3 py-2 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#ff5020]"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleFetchModels}
                    disabled={isFetchingModels}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={isFetchingModels ? "animate-spin" : ""} />
                    {isFetchingModels ? '拉取中...' : '拉取模型'}
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isTesting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    {isTesting ? '正在测试连接...' : '测试连接并保存预设'}
                  </button>
                </div>

                {testStatus && (
                  <div className={cn(
                    "p-3 rounded-xl text-xs border animate-fade-in space-y-1",
                    testStatus === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
                  )}>
                    <p className="font-bold flex items-center gap-1">
                      {testStatus === 'success' ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-red-600" />}
                      {testStatus === 'success' ? '测试成功' : '测试失败'}
                    </p>
                    <p className="text-[11px] opacity-90">{testMessage}</p>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block pt-1">配置并测试成功后，点击淘宝/美团页面的刷新按钮将通过此专属API自动生成5个精选商品。</span>
            </div>
          </div>
        )}
      </div>

      {/* GIFT MODAL */}
      {giftModalOpen && selectedGoodsForGift && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Gift size={18} className="text-[#ff5020]" /> 赠送商品给角色
              </h3>
              <button onClick={() => setGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-[#fcfbf8] rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-[#ff5020] font-black shrink-0">
                ¥{selectedGoodsForGift.price}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{selectedGoodsForGift.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{selectedGoodsForGift.desc}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">选择接收聊天角色</label>
              <select
                value={selectedFriendId}
                onChange={e => setSelectedFriendId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#ff5020]"
              >
                {friends.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">赠送附言 (将显示在小票卡片上)</label>
              <textarea
                value={giftMessage}
                onChange={e => setGiftMessage(e.target.value)}
                placeholder="写一句走心的祝福语..."
                className="w-full px-3 py-2.5 bg-[#fcfbf8] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#ff5020] h-20 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setGiftModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
              >
                取消
              </button>
              <button
                onClick={handleConfirmGift}
                className="flex-1 py-3 bg-[#ff5020] hover:bg-[#e0441b] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
              >
                确认赠送并发送小票
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT SUCCESS MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-[300px] rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">结算完成</h3>
              <p className="text-xs text-slate-500 mt-1">商品已成功下单，记录已存入个人订单中心。</p>
            </div>
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition-all shadow-md"
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM WECHAT-STYLE MONOCHROME NAVIGATION BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#f0ebe3] flex items-center justify-around px-2 z-40">
        <button
          onClick={() => setActiveTab('taobao')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all py-1 px-4 rounded-xl",
            activeTab === 'taobao' ? "text-slate-900 font-bold scale-105" : "text-slate-400 hover:text-slate-600 font-normal"
          )}
        >
          <Store size={20} strokeWidth={activeTab === 'taobao' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">淘宝商城</span>
        </button>

        <button
          onClick={() => setActiveTab('meituan')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all py-1 px-4 rounded-xl",
            activeTab === 'meituan' ? "text-slate-900 font-bold scale-105" : "text-slate-400 hover:text-slate-600 font-normal"
          )}
        >
          <Utensils size={20} strokeWidth={activeTab === 'meituan' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">美团外卖</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all py-1 px-4 rounded-xl relative",
            activeTab === 'cart' ? "text-slate-900 font-bold scale-105" : "text-slate-400 hover:text-slate-600 font-normal"
          )}
        >
          <ShoppingCart size={20} strokeWidth={activeTab === 'cart' ? 2.5 : 1.8} />
          {cartItems.length > 0 && (
            <span className="absolute top-0.5 right-3 w-4 h-4 bg-[#ff5020] text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
          <span className="text-[10px] tracking-tight">购物车</span>
        </button>

        <button
          onClick={() => setActiveTab('mine')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all py-1 px-4 rounded-xl",
            activeTab === 'mine' ? "text-slate-900 font-bold scale-105" : "text-slate-400 hover:text-slate-600 font-normal"
          )}
        >
          <User size={20} strokeWidth={activeTab === 'mine' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">个人中心</span>
        </button>
      </div>
    </div>
  );
};

export default ShoppingApp;
