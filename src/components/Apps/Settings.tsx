import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Save, Globe, Key, Cpu, Brain, Palette, Sliders, Type, Image as ImageIcon, Trash2, Upload, Smartphone, Plus, Minus, Layout, Check, Database, Mic, ShieldAlert, Lock, Cloud, HelpCircle } from 'lucide-react';
import { AppSettings, AppInfo } from '../../types';
import { cn } from '../../lib/utils';
import { get, set } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';
import PasswordLockScreen from '../PasswordLockScreen';
import ApiConsole from './ApiConsole';

export default function SettingsApp({ 
  settings, 
  onSave, 
  onBack,
  apps 
}: { 
  settings: AppSettings; 
  onSave: (s: AppSettings) => void; 
  onBack: () => void;
  apps: AppInfo[];
}) {
  const [form, setForm] = useState<AppSettings>(settings);
  
  // 当外部 settings 改变时（例如从 App.tsx 更新），同步内部表单状态
  // 这样可以防止 SettingsApp 持有旧数据并在自动保存时覆盖新数据
  useEffect(() => {
    setForm(settings);
  }, [settings]);
  const [activeSection, setActiveSection] = useState<'main' | 'api' | 'memory' | 'style' | 'icons' | 'pages' | 'theme' | 'display' | 'ai' | 'data' | 'voice' | 'console' | 'help'>('main');
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [themePresetName, setThemePresetName] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const homeWallpaperInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const importDataRef = useRef<HTMLInputElement>(null);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [apiLog, setApiLog] = useState('');

  const fetchModels = async () => {
    setIsTestingConnection(true);
    setApiLog('开始连接 API 获取模型列表...\n');
    try {
      const apiKey = form.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        showToast('需要填写 API Key', 'error');
        setApiLog(prev => prev + '[错误] 未配置 API Key\n');
        return;
      }
      const url = form.baseUrl || 'https://generativelanguage.googleapis.com';
      const cleanUrl = url.replace(/\/+$/, '');
      
      const endpoints = [
        // 1. 对于标准的代理地址 (OneAPI/OpenAI格式，通常配有 /v1 尾部) 
        { 
          endpoint: `${cleanUrl}/models`, 
          headers: { 'Authorization': `Bearer ${apiKey}` },
          desc: 'OpenAI 兼容接口'
        },
        // 2. 将可能的 /v1 移除后重试
        { 
          endpoint: `${cleanUrl.replace(/\/v1$/, '')}/v1/models`, 
          headers: { 'Authorization': `Bearer ${apiKey}` },
          desc: 'OpenAI V1 补全接口'
        },
        // 3. 原生 Gemini 格式
        { 
          endpoint: `${cleanUrl}/v1beta/models?key=${apiKey}`, 
          headers: {},
          desc: 'Gemini 原生接口'
        }
      ];

      let res = null;
      let lastError = null;

      for (const { endpoint, headers, desc } of endpoints) {
        setApiLog(prev => prev + `尝试 ${desc}: GET ${endpoint}\n`);
        try {
          const fetchRes = await fetch(endpoint, { headers });
          if (fetchRes.ok) {
            res = fetchRes;
            setApiLog(prev => prev + `✅ ${desc} 响应成功 (${res.status})\n`);
            break;
          } else {
            setApiLog(prev => prev + `❌ ${desc} 失败: HTTP ${fetchRes.status}\n`);
            lastError = new Error(`HTTP Error ${fetchRes.status}: ${fetchRes.statusText}`);
          }
        } catch (err: any) {
          setApiLog(prev => prev + `❌ ${desc} 失败: ${err.message}\n`);
          lastError = err;
        }
      }

      if (!res) {
        throw lastError || new Error("所有模型获取端点均尝试失败");
      }
      
      const data = await res.json();
      if (data.models || Array.isArray(data.data) || Array.isArray(data)) {
        const modelsData = data.models || data.data || data;
        const modelNames = modelsData.map((m: any) => (m.name || m.id || '').replace('models/', '')).filter(Boolean);
        setAvailableModels(modelNames);
        setApiLog(prev => prev + `连接成功！获取到 ${modelNames.length} 个模型。\n`);
        if (!modelNames.includes(form.modelName) && modelNames.length > 0) {
          setForm(prev => ({ ...prev, modelName: modelNames[0] }));
        }
        showToast(`✅ 成功获取 ${modelNames.length} 个模型！`);
      } else {
        setApiLog(prev => prev + `未找到模型列表:\n${JSON.stringify(data)}\n`);
      }
    } catch (e) {
      setApiLog(prev => prev + `[错误] 连接失败: ${e instanceof Error ? e.message : String(e)}\n`);
      showToast('获取模型失败，请查看控制台日志', 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testConnection = async () => {
    if (!form.modelName) return showToast('请先选择一个模型再进行测试', 'error');
    setIsTestingConnection(true);
    setApiLog('开始测试模型对话能力...\n');
    try {
      const apiKey = form.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        showToast('连接失败：API密钥无效，请检查设置', 'error');
        setApiLog(prev => prev + '[错误] API密钥无效\n');
        return;
      }
      
      const { getGeminiClient } = await import('../../lib/gemini');
      const ai = getGeminiClient({ ...settings, ...form } as any);
      const model = form.modelName;
      setApiLog(prev => prev + `使用模型 ${model} 进行测试...\n`);
      const result = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: '你是谁？返回一条短文本' }] }]
      });
      
      setApiLog(prev => prev + `收到回复：${result.text}\n✅ 测试通过！\n`);
      showToast('✅ 链接成功！该配置已通过测试。');
      
      const newPreset = { 
        id: Date.now().toString(), 
        name: presetName || `预设-${form.modelName}-${new Date().toLocaleTimeString()}`, 
        baseUrl: form.baseUrl, 
        apiKey: form.apiKey, 
        modelName: form.modelName 
      };
      const newPresets = [...(form.apiPresets || []), newPreset];
      const newForm = { ...form, apiPresets: newPresets };
      setForm(newForm);
      onSave(newForm);
      setPresetName(''); // Clear preset name after saving
    } catch (error: any) {
      console.error('Test connection error:', error);
      const msg = error.message || '';
      setApiLog(prev => prev + `[错误] 测试异常: ${msg}\n`);
      showToast(`❌ 链接异常: ${msg}`, 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const deletePreset = (id: string) => {
    const newPresets = (form.apiPresets || []).filter(p => p.id !== id);
    setForm({ ...form, apiPresets: newPresets });
    onSave({ ...form, apiPresets: newPresets });
  };

  const savePreset = () => {
    const newPreset = { id: Date.now().toString(), name: presetName, baseUrl: form.baseUrl, apiKey: form.apiKey, modelName: form.modelName };
    const newPresets = [...(form.apiPresets || []), newPreset];
    setForm({ ...form, apiPresets: newPresets });
    onSave({ ...form, apiPresets: newPresets });
    alert('预设保存成功');
  };

  const saveThemePreset = () => {
    if (!themePresetName) return alert('请输入预设名称');
    const newPreset = {
      id: Date.now().toString(),
      name: themePresetName,
      settings: { ...form }
    };
    const newPresets = [...(form.themePresets || []), newPreset];
    setForm({ ...form, themePresets: newPresets });
    onSave({ ...form, themePresets: newPresets });
    setThemePresetName('');
    alert('主题预设保存成功');
  };

  const applyThemePreset = (preset: any) => {
    const newForm = { ...form, ...preset.settings, themePresets: form.themePresets };
    setForm(newForm);
    onSave(newForm);
    alert(`已应用主题: ${preset.name}`);
  };

  const deleteThemePreset = (id: string) => {
    const newPresets = (form.themePresets || []).filter(p => p.id !== id);
    setForm({ ...form, themePresets: newPresets });
    onSave({ ...form, themePresets: newPresets });
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm({ ...form, wallpaperUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 防抖处理保存
  useEffect(() => {
    const handler = setTimeout(() => {
      onSave(form);
    }, 500);
    return () => clearTimeout(handler);
  }, [form, onSave]);

  const handleHomeWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setForm(prev => ({ ...prev, homeWallpaperUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setForm(prev => ({ ...prev, settingsBackgroundUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingAppId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newIcons = { ...(form.customIcons || {}), [editingAppId]: event.target?.result as string };
        setForm({ ...form, customIcons: newIcons });
        setEditingAppId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = async () => {
    const data = {
      settings: await get('zhouzhou_ji_settings'),
      friends: await get('zhouzhou_ji_friends'),
      chats: await get('zhouzhou_ji_chats'),
      userProfile: await get('zhouzhou_ji_user_profile'),
      memories: await get('zhouzhou_ji_memories'),
      worldBookEntries: await get('zhouzhou_ji_world_book_entries'),
      characterProfiles: await get('zhouzhou_ji_character_profiles'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zhouzhou_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) await set('zhouzhou_ji_settings', data.settings);
        if (data.friends) await set('zhouzhou_ji_friends', data.friends);
        if (data.chats) await set('zhouzhou_ji_chats', data.chats);
        if (data.userProfile) await set('zhouzhou_ji_user_profile', data.userProfile);
        if (data.memories) await set('zhouzhou_ji_memories', data.memories);
        if (data.worldBookEntries) await set('zhouzhou_ji_world_book_entries', data.worldBookEntries);
        if (data.characterProfiles) await set('zhouzhou_ji_character_profiles', data.characterProfiles);
        
        window.dispatchEvent(new Event('data-imported'));
        if (data.settings) {
          const newSettings = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings;
          setForm(newSettings);
          onSave(newSettings);
        }
        alert('数据导入成功！已立即生效。');
      } catch (err) {
        console.error('Import error:', err);
        alert('导入失败，文件格式不正确。');
      }
    };
    reader.readAsText(file);
  };

  const getPagesFromLayout = () => {
    const layout = form.desktopLayout || [];
    const totalPages = form.totalPages || 1;
    const pages: string[][] = Array.from({ length: totalPages }, () => []);
    const seenAppIds = new Set<string>();
    
    layout.forEach(item => {
      if (item.type === 'app' && item.appId) {
        const pageIdx = item.position?.page || 0;
        if (pageIdx < 0 || pageIdx >= totalPages) return;
        // Ensure an app only appears on ONE page
        if (!seenAppIds.has(item.appId)) {
          pages[pageIdx].push(item.appId);
          seenAppIds.add(item.appId);
        }
      }
    });
    
    return pages;
  };

  const updateLayoutFromPages = (pages: string[][]) => {
    const newLayout: any[] = [];
    // Keep widgets
    const widgets = (form.desktopLayout || []).filter(item => item.type === 'widget');
    newLayout.push(...widgets);

    const seenIds = new Set<string>(widgets.map(w => w.id));

    pages.forEach((page, pageIdx) => {
      page.forEach((appId, appIdx) => {
        const existing = (form.desktopLayout || []).find(item => item.appId === appId);
        let newId = existing ? existing.id : `app-${appId}-${Date.now()}-${appIdx}`;
        
        // Ensure ID uniqueness
        if (seenIds.has(newId)) {
          newId = `app-${appId}-${Date.now()}-${appIdx}-${Math.random().toString(36).substr(2, 5)}`;
        }
        seenIds.add(newId);

        newLayout.push({
          id: newId,
          type: 'app',
          appId: appId,
          position: {
            x: appIdx % 4,
            y: Math.floor(appIdx / 4),
            page: pageIdx
          }
        });
      });
    });
    setForm({ ...form, desktopLayout: newLayout, totalPages: pages.length });
  };

  const addPage = () => {
    const newPages = [...getPagesFromLayout(), []];
    updateLayoutFromPages(newPages);
  };

  const removePage = (index: number) => {
    const newPages = [...getPagesFromLayout()];
    if (newPages.length <= 1) return;
    newPages.splice(index, 1);
    updateLayoutFromPages(newPages);
  };

  const toggleAppOnPage = (appId: string, pageIdx: number) => {
    const newPages = getPagesFromLayout().map(p => [...p]);
    const currentIdx = newPages.findIndex(p => (p || []).includes(appId));
    
    if (currentIdx === pageIdx) {
      newPages[pageIdx] = newPages[pageIdx].filter(id => id !== appId);
    } else {
      if (currentIdx !== -1) {
        newPages[currentIdx] = newPages[currentIdx].filter(id => id !== appId);
      }
      newPages[pageIdx].push(appId);
    }
    updateLayoutFromPages(newPages);
  };

  const handleBack = () => {
    if (activeSection === 'main') {
      onBack();
    } else {
      setActiveSection('main');
    }
  };

  const sectionTitles: Record<string, string> = {
    api: 'API配置',
    ai: 'AI设定',
    memory: '记忆总结',
    style: '全局美化',
    icons: '图标定制',
    pages: '分页管理',
    theme: '系统主题',
    display: '显示设置',
    data: '数据管理',
    voice: '语音设置',
    help: '帮助与反馈',
  };

  return (
    <div className={cn(
      "h-full flex flex-col relative overflow-hidden transition-all duration-500",
      form.settingsBackgroundUrl ? "bg-transparent" : (form.themeId === 'pink-cat' ? "bg-[#fffafb]" : "bg-slate-50")
    )}>
      <div className={cn(
        "backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 transition-all duration-500",
        form.settingsBackgroundUrl ? "bg-white/40 border-white/20" : "bg-white/80"
      )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0.2, form.settingsBackgroundOpacity ?? 0.4)})` } : {}}>
        <button onClick={handleBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-slate-800">
          {activeSection === 'main' ? '系统设置' : sectionTitles[activeSection]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 z-10">
        {activeSection === 'main' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-transparent border-white/10" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (form.settingsBackgroundOpacity ?? 0.8) * 0.2)})` } : {}}>
              <button onClick={() => setActiveSection('api')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600"><Globe size={18} /></div>
                  <span className="font-medium text-slate-800">API配置</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('console')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600"><Database size={18} /></div>
                  <span className="font-medium text-slate-800">API 控制台</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('ai')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100/50 flex items-center justify-center text-purple-600"><Brain size={18} /></div>
                  <span className="font-medium text-slate-800">AI设定</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('memory')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center text-green-600"><Brain size={18} /></div>
                  <span className="font-medium text-slate-800">记忆总结</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setShowPasswordSetup(true)} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Lock size={18} /></div>
                  <span className="font-medium text-slate-800">锁屏密码设置</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
            </div>

            {showPasswordSetup && (
              <PasswordLockScreen 
                onUnlock={() => {}} 
                onClose={() => setShowPasswordSetup(false)}
                isSettingMode={true}
                onSetPassword={(pwd) => {
                  console.log('DEBUG: Setting password to:', pwd);
                  localStorage.setItem('lockScreenPassword', pwd);
                  setForm({ ...form, lockScreenPin: pwd });
                  alert('密码已设置');
                }}
                themeId={form.themeId}
                wallpaperUrl={form.settingsBackgroundUrl}
              />
            )}

            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-transparent border-white/10" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (form.settingsBackgroundOpacity ?? 0.8) * 0.2)})` } : {}}>
              <button onClick={() => setActiveSection('style')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100/50 flex items-center justify-center text-pink-600"><Palette size={18} /></div>
                  <span className="font-medium text-slate-800">全局美化</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              
              <button onClick={() => setActiveSection('theme')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600"><ImageIcon size={18} /></div>
                  <span className="font-medium text-slate-800">系统主题</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('icons')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100/50 flex items-center justify-center text-yellow-600"><ImageIcon size={18} /></div>
                  <span className="font-medium text-slate-800">图标定制</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('pages')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center text-green-600"><Layout size={18} /></div>
                  <span className="font-medium text-slate-800">桌面排版</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
            </div>

            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-white/40 backdrop-blur-md border-white/20" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0.1, (form.settingsBackgroundOpacity ?? 0.8) * 0.5)})` } : {}}>
              <button onClick={() => setActiveSection('display')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><Smartphone size={18} /></div>
                  <span className="font-medium text-slate-800">显示设置</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('help')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><HelpCircle size={18} /></div>
                  <span className="font-medium text-slate-800">帮助与反馈</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('voice')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 border-b lg:border-b-0 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Mic size={18} /></div>
                  <span className="font-medium text-slate-800">语音设置</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('data')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Database size={18} /></div>
                  <span className="font-medium text-slate-800">数据管理</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {activeSection === 'api' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} /> API 预设
                </label>
                <div className="space-y-2">
                  {form.apiPresets?.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-white p-2 border rounded-xl shadow-sm">
                      <button
                        className="flex-1 text-left text-sm font-medium px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors"
                        onClick={() => setForm({ ...form, baseUrl: p.baseUrl, apiKey: p.apiKey, modelName: p.modelName })}
                      >
                        {p.name} <span className="text-[10px] text-slate-400 ml-2">({p.modelName})</span>
                      </button>
                      <button 
                        onClick={() => deletePreset(p.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!form.apiPresets || form.apiPresets.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-2 italic">暂无保存的预设</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} /> 预设名称
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="例如: DeepSeek"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} /> Base URL
                </label>
                <input
                  type="text"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Key size={14} /> API Key
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Key size={14} /> 个人 API Key (可选)
                </label>
                <input
                  type="password"
                  value={form.userApiKey || ''}
                  onChange={(e) => setForm({ ...form, userApiKey: e.target.value })}
                  className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  placeholder="输入您的 Gemini API Key"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} /> 模型
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={availableModels.includes(form.modelName || '') ? form.modelName : (form.modelName || '')}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setAvailableModels([]);
                      } else {
                        setForm({ ...form, modelName: e.target.value });
                      }
                    }}
                    className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  >
                    {!availableModels.includes(form.modelName || '') && form.modelName && (
                      <option value={form.modelName}>{form.modelName} (当前)</option>
                    )}
                    <option value="" disabled>选择拉取的模型</option>
                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">⚙️ 手动输入...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.modelName || ''}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    className="w-full p-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    placeholder="例如: gemini-2.0-flash 或自定义名称"
                  />
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={testConnection} 
                  disabled={isTestingConnection || !form.modelName}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    isTestingConnection ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                    !form.modelName ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  )}
                >
                  {isTestingConnection ? '测试中...' : '测试链接'}
                </button>
                <button 
                  onClick={fetchModels} 
                  disabled={isTestingConnection}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    isTestingConnection ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  {isTestingConnection ? '拉取中...' : '拉取模型'}
                </button>
              </div>

              {apiLog && (
                <div className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Cpu size={14}/> API 控制台信息</span>
                    <button onClick={() => setApiLog('')} className="text-xs text-slate-500 hover:text-white">清空</button>
                  </div>
                  <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap overflow-y-auto max-h-48 break-words leading-relaxed">
                    {apiLog}
                  </pre>
                </div>
              )}

              <button onClick={savePreset} className="w-full mt-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">保存当前预设</button>
            </div>
          </div>
        )}

        {activeSection === 'console' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ApiConsole settings={form} />
          </div>
        )}

        {activeSection === 'ai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} /> 时间与位置感知
              </label>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">时间日期感知功能</span>
                  <span className="text-xs text-slate-500">角色能感知实时时间与地点背景</span>
                </div>
                <button
                  onClick={() => setForm({ ...form, timeAwarenessEnabled: !form.timeAwarenessEnabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    form.timeAwarenessEnabled ? "bg-green-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    form.timeAwarenessEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'memory' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Brain size={14} /> 自动总结阈值 (对话轮数)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={form.autoSummaryThreshold}
                  onChange={(e) => setForm({ ...form, autoSummaryThreshold: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="w-12 text-center font-bold text-blue-600 bg-blue-50 py-1 rounded-lg border border-blue-100">
                  {form.autoSummaryThreshold}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'style' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={14} /> 主屏幕壁纸
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.homeWallpaperUrl || ''}
                    onChange={e => {
                      const newSettings = { ...form, homeWallpaperUrl: e.target.value };
                      setForm(newSettings);
                      onSave(newSettings);
                    }}
                    placeholder="输入壁纸直链"
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 transition-all"
                  />
                  <input type="file" ref={homeWallpaperInputRef} className="hidden" accept="image/*" onChange={handleHomeWallpaperChange} />
                  <button 
                    onClick={() => homeWallpaperInputRef.current?.click()}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-pink-500 transition-all"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">主屏幕美化</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={14} /> 主屏幕背景模糊 (0=清晰, 100=模糊)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.homeWallpaperBlur !== undefined ? (form.homeWallpaperBlur * 3.33) : (form.backgroundBlurIntensity || 0) * 3.33}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) / 3.33;
                        const newSettings = { ...form, homeWallpaperBlur: value };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <span className="text-xs font-bold text-pink-600 w-8">{Math.round((form.homeWallpaperBlur !== undefined ? (form.homeWallpaperBlur * 3.33) : (form.backgroundBlurIntensity || 0) * 3.33))}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={14} /> 主屏幕背景遮罩 (0=清晰, 100=覆盖)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((form.homeWallpaperOpacity ?? form.backgroundOpacity ?? 0) * 100)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) / 100;
                        const newSettings = { ...form, homeWallpaperOpacity: value };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <span className="text-xs font-bold text-pink-600 w-8">{Math.round((form.homeWallpaperOpacity ?? form.backgroundOpacity ?? 0) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">设置页面美化</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={14} /> 设置背景模糊 (0=清晰, 100=模糊)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.settingsBackgroundBlur !== undefined ? (form.settingsBackgroundBlur * 3.33) : (form.backgroundBlurIntensity || 0) * 3.33}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) / 3.33;
                        const newSettings = { ...form, settingsBackgroundBlur: value };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <span className="text-xs font-bold text-pink-600 w-8">{Math.round((form.settingsBackgroundBlur !== undefined ? (form.settingsBackgroundBlur * 3.33) : (form.backgroundBlurIntensity || 0) * 3.33))}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={14} /> 设置背景遮罩 (0=清晰, 100=覆盖)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((form.settingsBackgroundOpacity ?? form.backgroundOpacity ?? 0.8) * 100)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) / 100;
                        const newSettings = { ...form, settingsBackgroundOpacity: value };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <span className="text-xs font-bold text-pink-600 w-8">{Math.round((form.settingsBackgroundOpacity ?? form.backgroundOpacity ?? 0.8) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={14} /> 设置页面壁纸
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.settingsBackgroundUrl || ''}
                    onChange={e => {
                      const newSettings = { ...form, settingsBackgroundUrl: e.target.value };
                      setForm(newSettings);
                      onSave(newSettings);
                    }}
                    placeholder="输入壁纸直链"
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 transition-all"
                  />
                  <input type="file" ref={wallpaperInputRef} className="hidden" accept="image/*" onChange={handleSettingsWallpaperChange} />
                  <button 
                    onClick={() => wallpaperInputRef.current?.click()}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-pink-500 transition-all"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette size={14} /> 主题颜色
                </label>
                <div className="flex flex-wrap gap-3">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0f172a'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        const newSettings = { ...form, themeColor: color };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        form.themeColor === color ? "border-slate-800 scale-110 shadow-md" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Type size={14} /> 字体样式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sans', 'serif', 'mono', 'rounded', 'cute-cheese', 'dynalight', 'lxgw-wenkai'] as const).map(font => (
                    <button
                      key={font}
                      onClick={() => {
                        const newSettings = { ...form, fontFamily: font };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className={cn(
                        "py-2 px-3 text-sm border rounded-xl transition-all",
                        form.fontFamily === font 
                          ? "bg-blue-50 border-blue-500 text-blue-600 font-bold shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {font === 'sans' && '标准无衬线'}
                      {font === 'serif' && '优雅衬线体'}
                      {font === 'mono' && '极客等宽体'}
                      {font === 'rounded' && '可爱圆体'}
                      {font === 'cute-cheese' && '可爱奶酪体'}
                      {font === 'dynalight' && 'Dynalight'}
                      {font === 'lxgw-wenkai' && '霞鹜文楷'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">现代全局主题</p>
                    <p className="text-[10px] text-slate-400">开启后系统将应用更现代、更灵动的视觉风格</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newSettings = { ...form, modernTheme: !form.modernTheme };
                    setForm(newSettings);
                    onSave(newSettings);
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    form.modernTheme ? "bg-indigo-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    form.modernTheme ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={14} /> 自定义 CSS 样式
                </label>
                <textarea
                  value={form.customGlobalCss || ''}
                  onChange={(e) => setForm({ ...form, customGlobalCss: e.target.value })}
                  className="w-full h-32 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                  placeholder="/* 在这里输入自定义 CSS */"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'theme' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> 系统主题选择
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setForm({ ...form, themeId: 'normal' })}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                    form.themeId === 'normal' ? "border-blue-500 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-inner" />
                  <span className="font-bold text-slate-800">默认主题</span>
                  <span className="text-[10px] text-slate-500 text-center">清爽现代的默认外观</span>
                </button>
                  <button
                    onClick={() => {
                      const newSettings: AppSettings = { ...form, themeId: 'pink-cat' as const };
                      setForm(newSettings);
                      onSave(newSettings);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                      form.themeId === 'pink-cat' ? "border-pink-500 bg-pink-50 shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-pink-400 shadow-inner relative overflow-hidden" />
                    <span className="font-bold text-slate-800">粉白小兔</span>
                    <span className="text-[10px] text-slate-500 text-center">温柔沉浸式粉白体验</span>
                  </button>
                  <button
                    onClick={() => {
                      const newSettings: AppSettings = { ...form, themeId: 'rainy-cat' as const };
                      setForm(newSettings);
                      onSave(newSettings);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                      form.themeId === 'rainy-cat' ? "border-slate-800 bg-slate-900 shadow-md" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center">
                      <Cloud className="text-white/20" size={32} />
                    </div>
                    <span className="font-bold text-slate-800">雨夜小猫</span>
                    <span className="text-[10px] text-slate-500 text-center">静谧治愈的雨夜氛围</span>
                  </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'display' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Smartphone size={20} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">全屏沉浸模式</span>
                    <span className="text-[10px] text-slate-400">尝试开启浏览器原生全屏</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const isEntering = !form.fullScreenMode;
                    const newSettings = { ...form, fullScreenMode: isEntering };
                    setForm(newSettings);
                    onSave(newSettings);
                    
                    try {
                      const doc = document.documentElement as any;
                      if (isEntering) {
                        const requestFs = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
                        if (requestFs && !document.fullscreenElement) {
                          requestFs.call(doc).catch((err: any) => {
                            console.warn('[Fullscreen] Request failed:', err);
                          });
                        }
                      } else {
                        if (document.fullscreenElement) {
                          document.exitFullscreen().catch(() => {});
                        }
                      }
                    } catch (e) {}
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    form.fullScreenMode ? "bg-blue-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    form.fullScreenMode ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Globe size={20} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">在新标签页打开</span>
                    <span className="text-[10px] text-slate-400">解决底部功能栏遮挡问题</span>
                  </div>
                </div>
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                >
                  立即打开
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Layout size={20} /></div>
                  <span className="text-sm font-medium">隐藏状态栏</span>
                </div>
                <button
                  onClick={() => {
                    const newSettings = { ...form, hideStatusBar: !form.hideStatusBar };
                    setForm(newSettings);
                    onSave(newSettings);
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    form.hideStatusBar ? "bg-blue-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    form.hideStatusBar ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] text-blue-600 leading-relaxed">
                提示：如果全屏模式无法铺满，请点击“在新标签页打开”。这是因为预览环境的限制，独立页面可以获得最佳的沉浸式体验。
              </p>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Upload size={18} className="text-blue-500" /> 导出数据
                </h3>
                <button 
                  onClick={handleExportData}
                  className="mt-4 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> 导出全部数据
                </button>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database size={18} className="text-orange-500" /> 导入数据
                </h3>
                <button 
                  onClick={() => importDataRef.current?.click()}
                  className="mt-4 w-full py-3 bg-orange-50 text-orange-600 rounded-xl font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Database size={18} /> 选择文件导入
                </button>
                <input type="file" ref={importDataRef} className="hidden" accept=".json" onChange={handleImportData} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'voice' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Mic size={18} className="text-rose-500" /> Minimax 语音设置
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <input
                    type="password"
                    value={form.minimaxApiKey || ''}
                    onChange={e => setForm({ ...form, minimaxApiKey: e.target.value })}
                    placeholder="输入 Minimax API Key"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group ID</label>
                  <input
                    type="text"
                    value={form.minimaxGroupId || ''}
                    onChange={e => setForm({ ...form, minimaxGroupId: e.target.value })}
                    placeholder="输入 Group ID"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">语音名称 (用于定制)</label>
                  <input
                    type="text"
                    value={form.minimaxName || ''}
                    onChange={e => setForm({ ...form, minimaxName: e.target.value })}
                    placeholder="输入语音名称"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">自定义 API 地址 (可选)</label>
                  <input
                    type="text"
                    value={form.minimaxApiUrl || ''}
                    onChange={e => setForm({ ...form, minimaxApiUrl: e.target.value })}
                    placeholder="https://api.minimax.chat/v1/text_to_speech"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'icons' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-3 gap-4">
              {apps.map(app => (
                <div key={app.id} className="flex flex-col items-center gap-2">
                  <div 
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shadow-md relative group overflow-hidden",
                      !form.customIcons?.[app.id] && app.color
                    )}
                  >
                    {form.customIcons?.[app.id] ? (
                      <img src={form.customIcons[app.id]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white font-bold text-xs">默认</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingAppId(app.id);
                          iconInputRef.current?.click();
                        }}
                        className="p-1.5 bg-white rounded-full text-slate-800"
                      >
                        <Upload size={14} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">{app.name}</span>
                </div>
              ))}
            </div>
            <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={handleIconChange} />
          </div>
        )}

        {activeSection === 'pages' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layout size={14} /> 分页管理
              </label>
              <button 
                onClick={addPage}
                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Plus size={14} /> 添加页面
              </button>
            </div>
            <div className="space-y-6">
              {getPagesFromLayout().map((page, pageIdx) => (
                <div key={pageIdx} className="bg-white border rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-bold text-slate-800">第 {pageIdx + 1} 页</span>
                    {getPagesFromLayout().length > 1 && (
                      <button onClick={() => removePage(pageIdx)} className="text-red-500"><Minus size={18} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {apps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => toggleAppOnPage(app.id, pageIdx)}
                        className={cn(
                          "flex flex-col items-center gap-1 transition-all",
                          (page || []).includes(app.id) ? "opacity-100" : "opacity-30 grayscale"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", app.color)}>
                          <span className="text-[8px] text-white font-bold">App</span>
                        </div>
                        <span className="text-[8px] font-medium text-slate-500 truncate w-full text-center">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => {
              onSave(form);
              showToast('设置已保存并应用 ✅');
            }}
            className="w-full text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: form.themeColor || '#3b82f6' }}
          >
            <Save size={20} /> 保存并应用
          </button>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={cn(
                "fixed bottom-20 left-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 whitespace-nowrap",
                toast.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}
            >
              {toast.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
