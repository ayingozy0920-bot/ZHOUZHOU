import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, Bookmark, MessageSquare, User, Upload, Settings, ChevronLeft, ChevronRight, 
  Edit3, Trash2, Heart, Share2, Send, Plus, Sparkles, Smile, Book, Image as ImageIcon, X, Check, Eye
} from 'lucide-react';
import { AppSettings, Friend, UserProfile, RestRoomBook, RestRoomPost } from '../../types';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/apiHelper';

interface RestRoomAppProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  friends: Friend[];
  user: UserProfile;
  onBack: () => void;
}

const LOCAL_FALLBACK_BARRAGE = [
  "这段剧情好揪心，作者太会虐了吧！",
  "快点继续往下看呀，悬念拉满了",
  "我陪着你一起读，这章主角好勇敢",
  "这里反转来了，千万别走神！",
  "快翻页，我等不及看后面了",
  "哈哈哈哈这段太好笑了",
  "角色内心独白好细腻",
  "泪目了，真的感动"
];

export const RestRoomApp: React.FC<RestRoomAppProps> = ({
  settings,
  onUpdateSettings,
  friends,
  user,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'bookrack' | 'read' | 'forum' | 'mine'>('bookrack');

  // Bookshelf state
  const books: RestRoomBook[] = settings.restRoomBooks || [
    {
      id: 'default-1',
      title: '月下独白：长夜未央',
      author: '佚名',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      content: `第一章 命运的齿轮\n\n夜色如墨，霓虹灯在雨后显得格外迷离。街角的咖啡馆里，钟表发出单调的滴答声。\n\n“你真的决定要走这条路吗？”坐在对面的身影轻声问道，声音里带着化不开的忧愁。\n\n我端起温热的咖啡，苦涩在舌尖蔓延。窗外是匆匆而过的行人，每个人都有着各自的轨迹，而我们的交集，恰好在这个暴雨初歇的夜晚重合。\n\n第二章 记忆的碎片\n\n往事如潮水般涌来。那些以为已经遗忘的细节，在安静的深夜里变得异常清晰。桌上泛黄的照片上，笑容依然灿烂。\n\n“如果可以重来，我希望我们从未相遇。”\n“不，能遇见你，是我这辈子最幸运的事。”\n\n第三章 黎明之前\n\n天边泛起一丝鱼肚白。黑暗终将被晨光驱散，我们相视一笑，所有的迷茫都在这一刻化为前行的力量。长夜未央，未来可期。`,
      progress: 15,
      pageIndex: 0,
      selectedCharacterId: friends[0]?.id || ''
    }
  ];

  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageArr, setPageArr] = useState<string[]>([]);
  const [barrages, setBarrages] = useState<{ id: string; text: string; top: number }[]>([]);
  const [roleText, setRoleText] = useState<string>('正在陪伴你共读中...');

  // Edit book modal
  const [editingBook, setEditingBook] = useState<RestRoomBook | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCover, setEditCover] = useState('');
  const [selectedReaderId, setSelectedReaderId] = useState('');

  // Forum posts
  const posts: RestRoomPost[] = settings.restRoomPosts || [
    {
      id: 'post-1',
      authorName: friends[0]?.name || '苏清寒',
      authorAvatar: friends[0]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      title: '大家觉得《长夜未央》结局会是HE还是BE？',
      content: '刚读到第三章，总觉得男主身上藏着太多秘密。大家觉得最后能在一起吗？来讨论一下！',
      timestamp: Date.now() - 3600000,
      likes: 12,
      commentsCount: 3,
      comments: [
        { id: 'c-1', authorName: user.name, content: '盲猜是BE，虐恋情深最戳人！', timestamp: Date.now() - 1800000 }
      ]
    }
  ];
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // API settings state in "Mine" tab
  const [apiUrlInput, setApiUrlInput] = useState(settings.restRoomApiUrl || '');
  const [apiKeyInput, setApiKeyInput] = useState(settings.restRoomApiKey || '');
  const [modelInput, setModelInput] = useState(settings.restRoomModel || settings.modelName || 'gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateBooks = (newBooks: RestRoomBook[]) => {
    onUpdateSettings({ restRoomBooks: newBooks });
  };

  const updatePosts = (newPosts: RestRoomPost[]) => {
    onUpdateSettings({ restRoomPosts: newPosts });
  };

  // Handle file upload (.txt / .ttx)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res) => {
      const content = (res.target?.result as string) || '';
      const newBook: RestRoomBook = {
        id: `book-${Date.now()}`,
        title: file.name.replace(/\.(txt|ttx)$/i, ''),
        author: user.name,
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
        content,
        progress: 0,
        pageIndex: 0,
        selectedCharacterId: friends[0]?.id || ''
      };
      updateBooks([...books, newBook]);
      alert('书籍导入成功！');
    };
    reader.readAsText(file);
  };

  // Open book reader
  const openBook = (book: RestRoomBook) => {
    setCurrentBookId(book.id);
    setSelectedReaderId(book.selectedCharacterId || friends[0]?.id || '');
    const lines = (book.content || '').split(/\r?\n/);
    const pages: string[] = [];
    let chunk = '';
    lines.forEach(line => {
      if (chunk.length > 500) {
        pages.push(chunk);
        chunk = '';
      }
      chunk += line + '\n';
    });
    if (chunk) pages.push(chunk);
    if (pages.length === 0) pages.push(book.content || '暂无内容');
    setPageArr(pages);
    const targetPage = book.pageIndex || 0;
    setPageIndex(targetPage < pages.length ? targetPage : 0);
    setActiveTab('read');
  };

  // Handle bottom tab click (with smart fix for Read tab)
  const handleTabSwitch = (target: 'bookrack' | 'read' | 'forum' | 'mine') => {
    if (target === 'read') {
      if (!currentBookId) {
        if (books.length > 0) {
          openBook(books[0]);
          return;
        } else {
          alert('请先在书架导入或选择一本书');
          setActiveTab('bookrack');
          return;
        }
      } else {
        if (pageArr.length === 0 && currentBook) {
          openBook(currentBook);
        }
      }
    }
    setActiveTab(target);
  };

  // Current active book & reader
  const currentBook = books.find(b => b.id === currentBookId) || books[0];
  const activeFriend = friends.find(f => f.id === selectedReaderId) || friends[0];

  useEffect(() => {
    if (currentBook && pageArr.length === 0) {
      const lines = (currentBook.content || '').split(/\r?\n/);
      const pages: string[] = [];
      let chunk = '';
      lines.forEach(line => {
        if (chunk.length > 500) {
          pages.push(chunk);
          chunk = '';
        }
        chunk += line + '\n';
      });
      if (chunk) pages.push(chunk);
      if (pages.length === 0) pages.push(currentBook.content || '暂无内容');
      setPageArr(pages);
    }
  }, [currentBookId]);

  // Refresh page & generate barrage
  useEffect(() => {
    if (activeTab === 'read' && pageArr.length > 0 && currentBook) {
      const text = pageArr[pageIndex] || '';
      const progress = Math.round(((pageIndex + 1) / pageArr.length) * 100);
      const updated = books.map(b => b.id === currentBook.id ? { ...b, progress, pageIndex } : b);
      updateBooks(updated);

      triggerBarrageAndRoleReaction(text);
    }
  }, [pageIndex, activeTab, currentBookId]);

  const triggerBarrageAndRoleReaction = async (text: string) => {
    setBarrages([]);
    const friendName = activeFriend?.name || '共读角色';

    // API Priority:
    // 1. If Rest Room dedicated API is set (url + key), use it.
    // 2. Otherwise fallback to global settings (apiKey / userApiKey + baseUrl).
    const useDedicated = !!(settings.restRoomApiUrl?.trim() && settings.restRoomApiKey?.trim());
    const effectiveUrl = useDedicated ? settings.restRoomApiUrl : (settings.baseUrl || '');
    const effectiveKey = useDedicated ? settings.restRoomApiKey : (settings.apiKey || settings.userApiKey || '');
    const effectiveModel = useDedicated ? (settings.restRoomModel || settings.modelName || 'gemini-1.5-flash') : (settings.modelName || 'gemini-1.5-flash');

    if (effectiveKey) {
      try {
        const data = await apiFetch({
          endpoint: '/api/chat',
          body: {
            baseUrl: effectiveUrl,
            apiKey: effectiveKey,
            model: effectiveModel,
            system_prompt: `你是一个小说共读伙伴（名字叫${friendName}）。阅读以下小说当前页内容，生成3条短句弹幕（剧情点评/吐槽/催翻页/内心独白）以及1句角色同步阅读感想。只返回JSON格式：{"barrages": ["...", "...", "..."], "roleReaction": "..."}`,
            messages: [
              { role: 'user', content: `内容：${text}` }
            ]
          }
        });

        const rawContent = data.content || data.reply || data.choices?.[0]?.message?.content || '';
        let parsed: { barrages: string[]; roleReaction: string } | null = null;
        try {
          const clean = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(clean);
        } catch {
          // fallback parse if json format is loose
        }

        if (parsed && parsed.barrages) {
          setRoleText(parsed.roleReaction || `${friendName}正看得津津有味...`);
          parsed.barrages.forEach((bText, idx) => {
            setTimeout(() => {
              addBarrageItem(bText);
            }, idx * 1000);
          });
          return;
        }
      } catch (err) {
        console.error('API barrage error, using fallback:', err);
      }
    }

    // Fallback local barrage & reaction
    const localList = LOCAL_FALLBACK_BARRAGE.sort(() => Math.random() - 0.5).slice(0, 3);
    setRoleText(`${friendName}：这段写得真带感，我跟你一起看到底！`);
    localList.forEach((bText, idx) => {
      setTimeout(() => {
        addBarrageItem(bText);
      }, idx * 900);
    });
  };

  const addBarrageItem = (text: string) => {
    const id = Math.random().toString();
    const top = Math.floor(Math.random() * 80) + 5; // 5% to 85%
    setBarrages(prev => [...prev, { id, text, top }]);
    setTimeout(() => {
      setBarrages(prev => prev.filter(b => b.id !== id));
    }, 8000);
  };

  const nextPage = () => {
    if (pageIndex < pageArr.length - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  const prevPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  // Fetch models for Mine API settings
  const handleFetchModels = async () => {
    const url = apiUrlInput.trim() || settings.baseUrl;
    const key = apiKeyInput.trim() || settings.apiKey || settings.userApiKey;
    if (!key) {
      alert('请先填写 API Key');
      return;
    }
    setIsTesting(true);
    try {
      const data = await apiFetch({
        endpoint: '/api/models',
        body: { baseUrl: url, apiKey: key }
      });
      const modelsData = data.models || data.data || data;
      if (Array.isArray(modelsData)) {
        const names = modelsData.map((m: any) => (m.name || m.id || '').replace('models/', '')).filter(Boolean);
        setAvailableModels(names);
        if (names.length > 0 && !names.includes(modelInput)) {
          setModelInput(names[0]);
        }
        alert(`✅ 成功获取 ${names.length} 个模型！`);
      } else {
        alert('获取成功，但未解析到标准模型列表');
      }
    } catch (err: any) {
      alert(`❌ 获取模型失败: ${err.message || err}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    const url = apiUrlInput.trim() || settings.baseUrl;
    const key = apiKeyInput.trim() || settings.apiKey || settings.userApiKey;
    const model = modelInput.trim() || settings.restRoomModel || settings.modelName || 'gemini-1.5-flash';
    if (!key) {
      alert('请先填写 API Key');
      return;
    }
    setIsTesting(true);
    try {
      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          baseUrl: url,
          apiKey: key,
          model: model,
          system_prompt: 'You are a test assistant.',
          messages: [{ role: 'user', content: 'Hello, respond with OK.' }]
        }
      });
      if (data && (data.content || data.reply || data.choices)) {
        alert('✅ API 连接测试成功！弹幕生成功能正常。');
      } else {
        alert('⚠️ 连接已响应，但返回数据格式异常，请检查配置。');
      }
    } catch (err: any) {
      alert(`❌ API 连接测试失败: ${err.message || err}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f7f3ef] text-[#2c2622] font-sans relative pb-20 select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#c89c94]/20 glass z-20">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-bold tracking-wider">
          {activeTab === 'bookrack' && '我的书架 • 休息室'}
          {activeTab === 'read' && (currentBook?.title || '共读阅读')}
          {activeTab === 'forum' && '角色贴吧'}
          {activeTab === 'mine' && '个人中心'}
        </h1>
        <div className="w-8" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. BOOKSHELF TAB */}
        {activeTab === 'bookrack' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl shadow-sm border border-[#c89c94]/20 backdrop-blur-md">
              <div>
                <h2 className="text-sm font-bold text-[#2c2622]">纸墨书屋 & 电子共读</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">导入TXT/TTX小说，与角色一起沉浸阅读</p>
              </div>
              <label className="bg-[#c89c94] text-white px-4 py-2 rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-[#b0877f] transition-all flex items-center gap-1.5">
                <Upload size={14} />
                导入小说
                <input type="file" ref={fileInputRef} accept=".txt,.ttx" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {books.map(book => (
                <div 
                  key={book.id} 
                  className="glass rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-[#c89c94]/30 hover:shadow-md transition-all group relative"
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBook(book);
                        setEditTitle(book.title);
                        setEditAuthor(book.author || '');
                        setEditCover(book.coverUrl || '');
                        setSelectedReaderId(book.selectedCharacterId || friends[0]?.id || '');
                      }}
                      className="p-1 hover:text-[#c89c94]"
                      title="编辑信息"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除《${book.title}》吗？`)) {
                          updateBooks(books.filter(b => b.id !== book.id));
                        }
                      }}
                      className="p-1 hover:text-red-500"
                      title="删除书籍"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div onClick={() => openBook(book)} className="cursor-pointer">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gray-200 shadow-inner relative">
                      <img src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] text-white/90 font-medium">进度 {book.progress}%</span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-[#2c2622] truncate">{book.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">作者：{book.author || '未知'}</p>
                  </div>

                  <button 
                    onClick={() => openBook(book)}
                    className="mt-3 w-full py-1.5 bg-[#c89c94]/20 hover:bg-[#c89c94] hover:text-white text-[#2c2622] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <BookOpen size={12} />
                    开始共读
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. READER & BARRAGE TAB */}
        {activeTab === 'read' && currentBook && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">共读伙伴：</span>
                <select
                  value={selectedReaderId || currentBook.selectedCharacterId || friends[0]?.id || ''}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedReaderId(newId);
                    const updated = books.map(b => b.id === currentBook.id ? { ...b, selectedCharacterId: newId } : b);
                    updateBooks(updated);
                  }}
                  className="bg-white/80 border border-[#c89c94]/40 rounded-lg px-2 py-1 text-xs font-bold text-[#c89c94] focus:outline-none"
                >
                  {friends.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <span>第 {pageIndex + 1} / {pageArr.length || 1} 页</span>
            </div>

            {/* Novel Text Reading Box + Floating Barrage */}
            <div className="glass rounded-2xl p-5 relative h-[56vh] overflow-hidden shadow-inner border border-[#c89c94]/30 flex flex-col">
              {/* Floating Barrage Box */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                {barrages.map(b => (
                  <div
                    key={b.id}
                    className="absolute whitespace-nowrap text-[#c89c94] font-medium text-xs bg-white/80 dark:bg-black/60 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm animate-[barrage_8s_linear_forwards]"
                    style={{ top: `${b.top}%`, right: '-100%', animation: 'barrage 8s linear forwards' }}
                  >
                    💬 {b.text}
                  </div>
                ))}
              </div>

              {/* Text content */}
              <div className="flex-1 overflow-y-auto pr-1">
                <p className="text-sm leading-loose whitespace-pre-wrap text-[#2c2622] font-serif">
                  {pageArr[pageIndex] || '暂无内容'}
                </p>
              </div>
            </div>

            {/* Character Synchronous Reading Window */}
            <div className="glass rounded-2xl p-3.5 border border-[#c89c94]/30 flex items-center gap-3 shadow-sm">
              <img src={activeFriend?.avatar || ''} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-[#c89c94] shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-bold text-[#2c2622]">{activeFriend?.name}的共读实况</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">正在阅读</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{roleText}</p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex gap-3">
              <button 
                onClick={prevPage}
                disabled={pageIndex === 0}
                className="flex-1 py-2.5 rounded-xl bg-white/80 border border-[#c89c94]/30 text-xs font-bold disabled:opacity-40 hover:bg-white shadow-sm transition-all"
              >
                上一页
              </button>
              <button 
                onClick={nextPage}
                disabled={pageIndex >= pageArr.length - 1}
                className="flex-1 py-2.5 rounded-xl bg-[#c89c94] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#b0877f] shadow-md transition-all"
              >
                下一页（触发弹幕）
              </button>
            </div>
          </div>
        )}

        {/* 3. FORUM TAB */}
        {activeTab === 'forum' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-[#2c2622]">角色与书友交流贴吧</h2>
                <p className="text-[10px] text-gray-500">分享你的阅读感悟，与心仪的角色热烈讨论</p>
              </div>
              <button 
                onClick={() => setShowNewPostModal(true)}
                className="bg-[#c89c94] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1"
              >
                <Plus size={14} />
                发帖
              </button>
            </div>

            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="glass rounded-2xl p-4 shadow-sm border border-[#c89c94]/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt="avatar" className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xs font-bold text-[#2c2622]">{post.authorName}</h4>
                      <span className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#2c2622] mb-1">{post.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{post.content}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 text-[11px] text-gray-500">
                    <button 
                      onClick={() => {
                        const updated = posts.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p);
                        updatePosts(updated);
                      }}
                      className="flex items-center gap-1 hover:text-[#c89c94] transition-colors"
                    >
                      <Heart size={14} className="text-red-400 fill-red-400" />
                      <span>{post.likes} 赞</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      <span>{post.commentsCount} 评论</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. MINE TAB */}
        {activeTab === 'mine' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 text-center space-y-3 border border-[#c89c94]/30 shadow-sm">
              <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-[#c89c94] shadow-md" referrerPolicy="no-referrer" />
              <h3 className="text-sm font-bold text-[#2c2622]">{user.name}</h3>
              <p className="text-xs text-gray-500">{user.signature || '享受阅读，品味慢生活'}</p>
              <div className="pt-2 flex justify-center gap-6 text-xs text-gray-600 border-t border-gray-200/50">
                <div>
                  <div className="font-bold text-sm text-[#2c2622]">{books.length}</div>
                  <div className="text-[10px] text-gray-400">书架藏书</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-[#2c2622]">12h</div>
                  <div className="text-[10px] text-gray-400">共读时长</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-[#2c2622]">{posts.length}</div>
                  <div className="text-[10px] text-gray-400">贴吧动态</div>
                </div>
              </div>
            </div>

            {/* API Settings Section */}
            <div className="glass rounded-2xl p-5 space-y-3 border border-[#c89c94]/30 shadow-sm">
              <h3 className="text-xs font-bold text-[#2c2622] flex items-center gap-1.5">
                <Settings size={14} />
                休息室专属弹幕后端 API 设置
              </h3>
              <p className="text-[10px] text-gray-500">如果在此设置了专用API，休息室将优先调用此专属API；若留空则自动使用全局设置中的API。</p>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 mb-1 block">API 接口地址 (URL)</label>
                  <input 
                    type="text" 
                    value={apiUrlInput} 
                    onChange={e => setApiUrlInput(e.target.value)}
                    placeholder="留空则使用全局设置 (如 https://api.openai.com/v1)" 
                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 mb-1 block">API 密钥 (API Key)</label>
                  <input 
                    type="password" 
                    value={apiKeyInput} 
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="sk-..." 
                    className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-600">模型选择 (Model)</label>
                    <button 
                      onClick={handleFetchModels}
                      disabled={isTesting}
                      className="text-[10px] text-[#c89c94] font-bold hover:underline disabled:opacity-50"
                    >
                      {isTesting ? '获取中...' : '🔄 拉取模型'}
                    </button>
                  </div>
                  {availableModels.length > 0 ? (
                    <select
                      value={modelInput}
                      onChange={e => setModelInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={modelInput} 
                      onChange={e => setModelInput(e.target.value)}
                      placeholder="gemini-1.5-flash / gpt-4o" 
                      className="w-full px-3 py-2 bg-white/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                    />
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => {
                      onUpdateSettings({ 
                        restRoomApiUrl: apiUrlInput, 
                        restRoomApiKey: apiKeyInput,
                        restRoomModel: modelInput
                      });
                      alert('休息室专属 API 设置已保存！');
                    }}
                    className="flex-1 py-2 bg-[#c89c94] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#b0877f] transition-all"
                  >
                    保存设置
                  </button>
                  <button 
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 bg-white/80 border border-[#c89c94]/30 text-[#2c2622] rounded-xl text-xs font-bold hover:bg-white shadow-sm transition-all disabled:opacity-50"
                  >
                    测试连接
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 glass flex justify-around py-3 border-t border-[#c89c94]/20 z-30">
        <button 
          onClick={() => handleTabSwitch('bookrack')}
          className={cn("flex flex-col items-center transition-colors", activeTab === 'bookrack' ? "text-[#c89c94]" : "text-gray-400")}
        >
          <Book size={20} />
          <span className="text-[10px] mt-1 font-medium">书架</span>
        </button>
        <button 
          onClick={() => handleTabSwitch('read')}
          className={cn("flex flex-col items-center transition-colors", activeTab === 'read' ? "text-[#c89c94]" : "text-gray-400")}
        >
          <Bookmark size={20} />
          <span className="text-[10px] mt-1 font-medium">共读</span>
        </button>
        <button 
          onClick={() => handleTabSwitch('forum')}
          className={cn("flex flex-col items-center transition-colors", activeTab === 'forum' ? "text-[#c89c94]" : "text-gray-400")}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] mt-1 font-medium">贴吧</span>
        </button>
        <button 
          onClick={() => handleTabSwitch('mine')}
          className={cn("flex flex-col items-center transition-colors", activeTab === 'mine' ? "text-[#c89c94]" : "text-gray-400")}
        >
          <User size={20} />
          <span className="text-[10px] mt-1 font-medium">我的</span>
        </button>
      </nav>

      {/* Edit Book Metadata Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-[#c89c94]/30 bg-white">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#2c2622]">修改书籍信息与共读角色</h3>
              <button onClick={() => setEditingBook(null)} className="p-1 hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">书籍名称</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">作者</label>
                <input 
                  type="text" 
                  value={editAuthor} 
                  onChange={e => setEditAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">封面图片 URL</label>
                <input 
                  type="text" 
                  value={editCover} 
                  onChange={e => setEditCover(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">选择共读角色（通讯录）</label>
                <select 
                  value={selectedReaderId} 
                  onChange={e => setSelectedReaderId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                >
                  {friends.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setEditingBook(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  const updated = books.map(b => b.id === editingBook.id ? { 
                    ...b, 
                    title: editTitle, 
                    author: editAuthor, 
                    coverUrl: editCover,
                    selectedCharacterId: selectedReaderId
                  } : b);
                  updateBooks(updated);
                  setEditingBook(null);
                  alert('修改成功！');
                }}
                className="flex-1 py-2 bg-[#c89c94] text-white rounded-xl text-xs font-bold shadow-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-[#c89c94]/30 bg-white">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#2c2622]">发布贴吧话题</h3>
              <button onClick={() => setShowNewPostModal(false)} className="p-1 hover:text-red-500"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">标题</label>
                <input 
                  type="text" 
                  value={newPostTitle} 
                  onChange={e => setNewPostTitle(e.target.value)}
                  placeholder="请输入话题标题..."
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">内容</label>
                <textarea 
                  value={newPostContent} 
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="写下你的阅读心得或吐槽..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#c89c94]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowNewPostModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  if (!newPostTitle.trim() || !newPostContent.trim()) return alert('请填写标题和内容');
                  const newPost: RestRoomPost = {
                    id: `post-${Date.now()}`,
                    authorName: user.name,
                    authorAvatar: user.avatar,
                    title: newPostTitle,
                    content: newPostContent,
                    timestamp: Date.now(),
                    likes: 1,
                    commentsCount: 0,
                    comments: []
                  };
                  updatePosts([newPost, ...posts]);
                  setNewPostTitle('');
                  setNewPostContent('');
                  setShowNewPostModal(false);
                  alert('发布成功！');
                }}
                className="flex-1 py-2 bg-[#c89c94] text-white rounded-xl text-xs font-bold shadow-md"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
