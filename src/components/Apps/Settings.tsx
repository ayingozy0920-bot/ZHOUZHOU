import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Save, Globe, Key, Cpu, Brain, Palette, Sliders, Type, Image as ImageIcon, Trash2, Upload, Smartphone, Plus, Minus, Layout, Check, Database, Mic, ShieldAlert, Lock, Cloud, HelpCircle, Maximize, X, RefreshCw, Link2, Send, Zap, Moon, Heart } from 'lucide-react';
import { AppSettings, AppInfo } from '../../types';
import { cn } from '../../lib/utils';
import { get, set } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';
import PasswordLockScreen from '../PasswordLockScreen';
import ApiConsole from './ApiConsole';
import { apiFetch } from '../../lib/apiHelper';
import { unlockAudio, playBase64Audio } from '../../lib/voice';

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
  const [activeSection, setActiveSection] = useState<'main' | 'api' | 'memory' | 'style' | 'icons' | 'pages' | 'theme' | 'display' | 'ai' | 'data' | 'voice' | 'console' | 'help' | 'imageGen' | 'memoryApi'>('main');
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
  const [customFontNameInput, setCustomFontNameInput] = useState('');
  const [customFontUrlInput, setCustomFontUrlInput] = useState('');
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [expandedPastLog, setExpandedPastLog] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('✅ 成功添加到桌面！');
      }
      setDeferredPrompt(null);
    } else {
      showToast('请在浏览器菜单中选择“添加到主屏幕”或“安装应用”', 'success');
    }
  };

  const handleAddFontPreset = (name: string, url: string, applyNow = true) => {
    if (!url.trim()) {
      showToast('请输入字体直链或上传字体文件', 'error');
      return;
    }
    const finalName = name.trim() || url.split('/').pop()?.split('?')[0] || `自定义字体 ${(form.fontPresets?.length || 0) + 1}`;
    const newPreset = { id: 'font-' + Date.now(), name: finalName, url: url.trim() };
    const newPresets = [...(form.fontPresets || []), newPreset];
    const newSettings: AppSettings = { 
      ...form, 
      fontPresets: newPresets, 
      ...(applyNow ? { customFontUrl: url.trim() } : {})
    };
    setForm(newSettings);
    onSave(newSettings);
    setCustomFontNameInput('');
    setCustomFontUrlInput('');
    showToast(applyNow ? `字体 "${finalName}" 保存并已启用` : `字体预设 "${finalName}" 保存成功`);
  };

  const handleDeleteFontPreset = (id: string, url: string) => {
    const newPresets = (form.fontPresets || []).filter(p => p.id !== id);
    const newSettings: AppSettings = {
      ...form,
      fontPresets: newPresets,
      customFontUrl: form.customFontUrl === url ? '' : form.customFontUrl
    };
    setForm(newSettings);
    onSave(newSettings);
    showToast('已删除字体预设');
  };

  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const fontName = file.name.replace(/\.[^/.]+$/, "");
        setCustomFontUrlInput(dataUrl);
        if (!customFontNameInput.trim()) {
          setCustomFontNameInput(fontName);
        }
        showToast(`已加载本地字体文件：${fontName}`);
      }
    };
    reader.readAsDataURL(file);
    if (fontFileInputRef.current) fontFileInputRef.current.value = '';
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [apiLog, setApiLog] = useState('');

  const [isTestingTts, setIsTestingTts] = useState(false);
  const [ttsTestText, setTtsTestText] = useState('这是一段语音测试，测试成功。');
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);
  const [imageGenError, setImageGenError] = useState<string | null>(null);
  const [isFetchingImageModels, setIsFetchingImageModels] = useState(false);
  const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);
  const [isTestingImageConnection, setIsTestingImageConnection] = useState(false);
  const [imageConnectionStatus, setImageConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [imageConnectionError, setImageConnectionError] = useState<string | null>(null);

  const [isFetchingMemoryModels, setIsFetchingMemoryModels] = useState(false);
  const [availableMemoryModels, setAvailableMemoryModels] = useState<string[]>([]);
  const [isTestingMemoryConnection, setIsTestingMemoryConnection] = useState(false);
  const [memoryConnectionStatus, setMemoryConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [memoryConnectionError, setMemoryConnectionError] = useState<string | null>(null);

  const testMemoryConnection = async () => {
    if (!form.memoryApiKey) {
      showToast('请输入 API Key', 'error');
      return;
    }
    setIsTestingMemoryConnection(true);
    setMemoryConnectionStatus('idle');
    setMemoryConnectionError(null);
    try {
      const data = await apiFetch({
        endpoint: '/api/models',
        body: {
          baseUrl: form.memoryApiUrl,
          apiKey: form.memoryApiKey
        }
      });
      if (data.data) {
        setMemoryConnectionStatus('success');
        showToast('✅ 记忆API链接成功！');
        
        const models = data.data.map((m: any) => m.id);
        setAvailableMemoryModels(models);
        
        if (models.length > 0 && (!form.memoryModel || !models.includes(form.memoryModel))) {
          const updatedForm = { ...form, memoryModel: models[0] };
          setForm(updatedForm);
          onSave(updatedForm);
        }
      } else {
        throw new Error('未返回有效的模型列表数据');
      }
    } catch (e: any) {
      console.error('Test memory connection error:', e);
      setMemoryConnectionStatus('error');
      setMemoryConnectionError(e.message || '未知错误');
      showToast(`❌ 链接测试失败: ${e.message}`, 'error');
    } finally {
      setIsTestingMemoryConnection(false);
    }
  };

  const fetchMemoryModels = async () => {
    if (!form.memoryApiKey) return showToast('请输入 API Key', 'error');
    setIsFetchingMemoryModels(true);
    try {
      const data = await apiFetch({
        endpoint: '/api/models',
        body: {
          baseUrl: form.memoryApiUrl,
          apiKey: form.memoryApiKey
        }
      });
      if (data.data) {
        const models = data.data.map((m: any) => m.id);
        setAvailableMemoryModels(models);
        
        if (models.length > 0 && (!form.memoryModel || !models.includes(form.memoryModel))) {
          const updatedForm = { ...form, memoryModel: models[0] };
          setForm(updatedForm);
          onSave(updatedForm);
        }
        showToast(`✅ 成功拉取 ${data.data.length} 个模型`);
      }
    } catch (e: any) {
      showToast('❌ 模型拉取失败', 'error');
    } finally {
      setIsFetchingMemoryModels(false);
    }
  };

  const testImageConnection = async () => {
    if (!form.imageGenApiKey) {
      showToast('请输入 API Key', 'error');
      return;
    }
    setIsTestingImageConnection(true);
    setImageConnectionStatus('idle');
    setImageConnectionError(null);
    try {
      const data = await apiFetch({
        endpoint: '/api/image-models',
        body: {
          baseUrl: form.imageGenBaseUrl,
          apiKey: form.imageGenApiKey
        }
      });
      if (data.data) {
        setImageConnectionStatus('success');
        showToast('✅ API 链接成功！');
        
        const models = data.data
          .filter((m: any) => m.id.toLowerCase().includes('dall') || m.id.toLowerCase().includes('flux') || m.id.toLowerCase().includes('stable') || m.id.toLowerCase().includes('image'))
          .map((m: any) => m.id);
        const finalModels = models.length > 0 ? models : data.data.map((m: any) => m.id);
        setAvailableImageModels(finalModels);
        
        if (finalModels.length > 0 && (!form.imageGenModel || !finalModels.includes(form.imageGenModel))) {
          const updatedForm = { ...form, imageGenModel: finalModels[0] };
          setForm(updatedForm);
          onSave(updatedForm);
        }
      } else {
        throw new Error('未返回有效的模型列表数据');
      }
    } catch (e: any) {
      console.error('Test image connection error:', e);
      setImageConnectionStatus('error');
      setImageConnectionError(e.message || '未知错误');
      showToast(`❌ 链接测试失败: ${e.message}`, 'error');
    } finally {
      setIsTestingImageConnection(false);
    }
  };

  const fetchImageModels = async () => {
    if (!form.imageGenApiKey) return showToast('请输入 API Key', 'error');
    setIsFetchingImageModels(true);
    try {
      const data = await apiFetch({
        endpoint: '/api/image-models',
        body: {
          baseUrl: form.imageGenBaseUrl,
          apiKey: form.imageGenApiKey
        }
      });
      if (data.data) {
        const models = data.data
          .filter((m: any) => m.id.toLowerCase().includes('dall') || m.id.toLowerCase().includes('flux') || m.id.toLowerCase().includes('stable') || m.id.toLowerCase().includes('image'))
          .map((m: any) => m.id);
        const finalModels = models.length > 0 ? models : data.data.map((m: any) => m.id);
        setAvailableImageModels(finalModels);
        
        if (finalModels.length > 0 && (!form.imageGenModel || !finalModels.includes(form.imageGenModel))) {
          const updatedForm = { ...form, imageGenModel: finalModels[0] };
          setForm(updatedForm);
          onSave(updatedForm);
        }
        showToast(`✅ 成功拉取 ${data.data.length} 个模型`);
      }
    } catch (e: any) {
      showToast('❌ 模型拉取失败', 'error');
    } finally {
      setIsFetchingImageModels(false);
    }
  };

  const handleTestImageGen = async (testPrompt: string = '一只可爱的小猫咪') => {
    if (!form.imageGenApiKey) return showToast('请输入 API Key', 'error');
    setIsTestingImage(true);
    setTestImageUrl(null);
    setImageGenError(null);
    try {
      const data = await apiFetch({
        endpoint: '/api/image-gen',
        body: {
          prompt: testPrompt,
          negative_prompt: form.imageGenNegativePrompt || "",
          ratio: form.imageGenSize || "1024x1024",
          settings: form
        }
      });

      if (data.url) {
        setTestImageUrl(data.url);
        showToast('✅ 图片生成成功！');
      } else if (data.b64) {
        setTestImageUrl(`data:image/png;base64,${data.b64}`);
        showToast('✅ 图片生成成功！');
      } else {
        throw new Error('未获取到图片数据');
      }
    } catch (e: any) {
      console.error('Image Gen test error:', e);
      setImageGenError(e.message || '图片生成失败，请检查配置或通道');
      showToast(`❌ 生成失败: ${e.message}`, 'error');
    } finally {
      setIsTestingImage(false);
    }
  };

  const handleTestTts = async () => {
    if (!form.minimaxApiKey) return showToast('请输入 API Key', 'error');
    setIsTestingTts(true);
    try {
      // Synchronously unlock audio within the click event to satisfy browser restrictions
      unlockAudio();

      const data = await apiFetch({
        endpoint: '/api/tts',
        body: {
          text: ttsTestText || '这是一段语音测试，测试成功。',
          settings: form
        }
      });

      if (data.audio) {
        await playBase64Audio(data.audio);
        showToast('✅ 语音合成成功，正在播放');
      } else {
        throw new Error('未获取到音频数据');
      }
    } catch (e: any) {
      console.error('TTS test error:', e);
      showToast(`❌ 测试失败: ${e.message}`, 'error');
    } finally {
      setIsTestingTts(false);
    }
  };

  const fetchModels = async () => {
    setIsTestingConnection(true);
    setApiLog('开始连接 API 获取模型列表 (通过后端代理/直接连接)...\n');
    try {
      const apiKey = form.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        showToast('需要填写 API Key', 'error');
        setApiLog(prev => prev + '[错误] 未配置 API Key\n');
        return;
      }
      
      const data = await apiFetch({
        endpoint: '/api/models',
        body: {
          baseUrl: form.baseUrl,
          apiKey: apiKey
        }
      });

      setApiLog(prev => prev + `✅ 响应成功\n`);
      
      if (data.models || Array.isArray(data.data) || Array.isArray(data)) {
        const modelsData = data.models || data.data || data;
        const modelNames = modelsData.map((m: any) => (m.name || m.id || '').replace('models/', '')).filter(Boolean);
        setAvailableModels(modelNames);
        setApiLog(prev => prev + `连接成功！获取到 ${modelNames.length} 个模型。\n`);
        if (!modelNames.includes(form.modelName || '') && modelNames.length > 0) {
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
    setApiLog('开始测试模型对话能力 (通过后端代理/直接连接)...\n');
    try {
      const apiKey = form.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        showToast('连接失败：API密钥无效，请检查设置', 'error');
        setApiLog(prev => prev + '[错误] API密钥无效\n');
        return;
      }
      
      const model = form.modelName;
      setApiLog(prev => prev + `使用模型 ${model} 进行测试...\n`);
      
      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: 'You are a helpful assistant.',
          messages: [
            { 
              role: 'user', 
              parts: [{ text: '你是谁？返回一条短文本' }],
              content: '你是谁？返回一条短文本' 
            }
          ],
          settings: {
            ...form,
            modelName: model
          }
        }
      });

      setApiLog(prev => prev + `收到回复：${data.text}\n✅ 测试通过！\n`);
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
    imageGen: '生图设置',
    memoryApi: '记忆总结API',
    help: '更新日志',
  };

  return (
    <div className={cn(
      "h-full flex flex-col relative overflow-hidden transition-all duration-500",
      form.settingsBackgroundUrl ? "bg-transparent" : (form.themeId === 'pink-cat' ? "bg-[#fffafb]" : form.themeId === 'ocean-blue' ? "bg-[#f0f9ff]" : "bg-slate-50")
    )}>
      <div className={cn(
        "backdrop-blur-md border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-all duration-500",
        form.settingsBackgroundUrl ? "bg-white/40 border-white/20" : "bg-white/80"
      )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0.2, form.settingsBackgroundOpacity ?? 0.4)})` } : {}}>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors group">
            {activeSection === 'main' ? (
              <X size={22} className="text-slate-400 group-hover:text-slate-600" />
            ) : (
              <ChevronLeft size={24} className="text-slate-600" />
            )}
          </button>
          <span className="font-bold text-slate-800 tracking-tight">
            {activeSection === 'main' ? '系统设置' : sectionTitles[activeSection]}
          </span>
        </div>
        {activeSection === 'main' && (
          <button 
            onClick={() => {
              onSave(form);
              onBack();
            }}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            保存并返回
          </button>
        )}
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
              <button onClick={() => setActiveSection('memoryApi')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600"><Cloud size={18} /></div>
                  <span className="font-medium text-slate-800">记忆总结专用 API</span>
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
              <div className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Lock size={18} /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">启用锁屏界面</span>
                    <span className="text-[10px] text-slate-400">开启后每次加载都会显示锁屏 (滑动手势)</span>
                  </div>
                </div>
                <button
                  onClick={() => setForm({ ...form, lockScreenEnabled: !form.lockScreenEnabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    form.lockScreenEnabled !== false ? "bg-green-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    form.lockScreenEnabled !== false ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
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
                  <span className="font-medium text-slate-800">更新日志</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('voice')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Mic size={18} /></div>
                  <span className="font-medium text-slate-800">语音设置</span>
                </div>
                <ChevronLeft size={20} className="text-slate-400 rotate-180" />
              </button>
              <button onClick={() => setActiveSection('imageGen')} className="w-full px-4 py-4 flex items-center justify-between border-b hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><ImageIcon size={18} /></div>
                  <span className="font-medium text-slate-800">生图设置</span>
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cpu size={14} /> 模型温度 (Temperature)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {form.temperature !== undefined ? form.temperature : 0.7}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={form.temperature !== undefined ? form.temperature : 0.7}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.0 (严谨/确定)</span>
                  <span>0.7 (平衡)</span>
                  <span>2.0 (极具创意/随机)</span>
                </div>
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

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2"><Type size={14} /> 字体样式 (内置)</span>
                  <span className="text-[10px] text-slate-400 font-normal">点击已选中字体可取消并使用系统默认</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'sans', name: '标准无衬线', desc: 'Standard Sans' },
                    { id: 'serif', name: '优雅衬线体', desc: 'Elegant Serif' },
                    { id: 'mono', name: '极客等宽体', desc: 'Modern Mono' },
                    { id: 'rounded', name: '可爱圆体', desc: 'Soft Rounded' },
                    { id: 'cute-cheese', name: '可爱奶酪体', desc: 'Cute Cheese' },
                    { id: 'dynalight', name: '签名体', desc: 'Signature' },
                    { id: 'lxgw-wenkai', name: '霞鹜文楷', desc: 'Classical' },
                    { id: 'hanyi-senty', name: '手写下午茶', desc: 'Handwriting' },
                    { id: 'zcool-qingke', name: '庆科黄油', desc: 'Butter' },
                    { id: 'fira-code', name: 'Fira Code', desc: 'Developer' },
                  ] as const).map(font => (
                    <button
                      key={font.id}
                      onClick={() => {
                        const newFont = form.fontFamily === font.id ? undefined : font.id;
                        const newSettings = { ...form, fontFamily: newFont };
                        setForm(newSettings);
                        onSave(newSettings);
                      }}
                      className={cn(
                        "p-3 text-left border rounded-2xl transition-all relative overflow-hidden group",
                        form.fontFamily === font.id 
                          ? "bg-blue-50 border-blue-400 text-blue-600 shadow-md scale-[1.02]" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/10"
                      )}
                      style={{ 
                        fontFamily: font.id === 'serif' ? 'serif' : 
                                   font.id === 'mono' ? 'monospace' : 
                                   font.id === 'hanyi-senty' ? 'cursive' : 'sans-serif'
                      }}
                    >
                      <p className="text-sm font-black tracking-tight">{font.name}</p>
                      <p className="text-[10px] opacity-40">{font.desc}</p>
                      {form.fontFamily === font.id && (
                        <div className="absolute top-1 right-1">
                          <Check size={12} className="text-blue-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Link2 size={14} /> TTF 字体直链导入与预设管理
                </label>
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600">字体标题名称</label>
                    <input
                      type="text"
                      value={customFontNameInput}
                      onChange={e => setCustomFontNameInput(e.target.value)}
                      placeholder="例如：手写清爽体"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600">字体直链 URL 或本地上传</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFontUrlInput}
                        onChange={e => setCustomFontUrlInput(e.target.value)}
                        placeholder="输入 .ttf 字体直链 (例如: https://.../font.ttf)"
                        className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm"
                      />
                      <input type="file" ref={fontFileInputRef} className="hidden" accept=".ttf,.otf" onChange={handleFontFileUpload} />
                      <button
                        onClick={() => fontFileInputRef.current?.click()}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 shrink-0 shadow-sm font-bold"
                        title="上传本地 TTF 文件"
                      >
                        <Upload size={14} /> 本地上传
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddFontPreset(customFontNameInput, customFontUrlInput, false)}
                      className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      保存为预设
                    </button>
                    <button
                      onClick={() => handleAddFontPreset(customFontNameInput, customFontUrlInput, true)}
                      className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      保存并应用
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">支持输入网络图床直链 (.ttf) 或直接上传本地字体文件。填写标题与直链后可保存为预设或直接应用。</p>
                </div>

                {form.fontPresets && form.fontPresets.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">已保存的字体预设：</span>
                    <div className="grid grid-cols-1 gap-2">
                      {form.fontPresets.map(preset => {
                        const isActive = form.customFontUrl === preset.url;
                        return (
                          <div 
                            key={preset.id} 
                            className={cn(
                              "flex items-center justify-between p-3 border rounded-xl transition-all",
                              isActive ? "bg-blue-50/70 border-blue-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-blue-500 animate-pulse" : "bg-slate-300")} />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate">{preset.name}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{preset.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  const newSettings = { ...form, customFontUrl: preset.url };
                                  setForm(newSettings);
                                  onSave(newSettings);
                                  showToast(`已切换至字体：${preset.name}`);
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                  isActive ? "bg-blue-500 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                )}
                              >
                                {isActive ? '使用中' : '应用'}
                              </button>
                              <button
                                onClick={() => handleDeleteFontPreset(preset.id, preset.url)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="删除预设"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {form.customFontUrl && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span className="truncate">当前自定义字体直链：{form.customFontUrl}</span>
                    <button
                      onClick={() => {
                        const newSettings = { ...form, customFontUrl: '' };
                        setForm(newSettings);
                        onSave(newSettings);
                        showToast('已清除自定义字体，恢复系统内置字体');
                      }}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold shrink-0 ml-2"
                    >
                      停用自定义字体
                    </button>
                  </div>
                )}
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
                <Palette size={14} /> 系统主题选择
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setForm({ ...form, themeId: 'normal' })}
                  className={cn(
                    "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group",
                    form.themeId === 'normal' ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    form.themeId === 'normal' ? "bg-blue-500 text-white rotate-12 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                  )}>
                    <Zap size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm tracking-tight">默认主题</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Classic Modern</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const newSettings: AppSettings = { ...form, themeId: 'pink-cat' as const };
                    setForm(newSettings);
                    onSave(newSettings);
                  }}
                  className={cn(
                    "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group",
                    form.themeId === 'pink-cat' ? "border-pink-500 bg-pink-50/50 shadow-lg shadow-pink-500/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    form.themeId === 'pink-cat' ? "bg-pink-500 text-white -rotate-12 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                  )}>
                    <Send size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm tracking-tight">粉白小兔</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sweet & Pure</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const newSettings: AppSettings = { ...form, themeId: 'rainy-cat' as const };
                    setForm(newSettings);
                    onSave(newSettings);
                  }}
                  className={cn(
                    "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group",
                    form.themeId === 'rainy-cat' ? "border-slate-800 bg-slate-50/50 shadow-lg shadow-slate-900/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    form.themeId === 'rainy-cat' ? "bg-slate-900 text-white rotate-6 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                  )}>
                    <Moon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm tracking-tight">雨夜小猫</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nocturnal Calm</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const newSettings: AppSettings = { ...form, themeId: 'ocean-blue' as const };
                    setForm(newSettings);
                    onSave(newSettings);
                  }}
                  className={cn(
                    "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group",
                    form.themeId === 'ocean-blue' ? "border-sky-500 bg-sky-50/50 shadow-lg shadow-sky-500/10" : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    form.themeId === 'ocean-blue' ? "bg-sky-500 text-white -rotate-6 scale-110" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                  )}>
                    <Cloud size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm tracking-tight">大海浅蓝白</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ocean Frost</p>
                  </div>
                </button>

                <div className="p-6 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center gap-2 opacity-60">
                   <Plus size={20} className="text-slate-300" />
                   <span className="text-[10px] font-bold text-slate-400">更多主题待解锁</span>
                </div>
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

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600"><Smartphone size={20} /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">添加到手机桌面 (PWA 安装)</span>
                    <span className="text-[10px] text-slate-400">将小手机安装为主屏幕独立App</span>
                  </div>
                </div>
                <button
                  onClick={handleInstallPwa}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>{deferredPrompt ? '立即安装' : '查看安装指南'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl space-y-2 border">
                <p className="font-bold text-slate-700">📌 如何从谷歌浏览器/手机浏览器添加到桌面：</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li><strong>Google Chrome (安卓/电脑)</strong>：点击浏览器右上角菜单 <span className="font-bold">⋮</span>，选择 <span className="text-purple-600 font-bold">“添加到主屏幕”</span> 或 <span className="text-purple-600 font-bold">“安装应用”</span>。</li>
                  <li><strong>Safari (苹果 iPhone/iPad)</strong>：点击浏览器底部中间的 <span className="text-purple-600 font-bold">“分享”</span> 按钮（带有向上箭头的框），滚动并选择 <span className="text-purple-600 font-bold">“添加到主屏幕”</span>。</li>
                  <li><strong>优势</strong>：安装后将隐藏浏览器地址栏，支持全屏沉浸式体验、离线访问与独立桌面图标启动！</li>
                </ul>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-transparent border-white/10" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (form.settingsBackgroundOpacity ?? 0.8) * 0.2)})` } : {}}>
              <div className="px-5 py-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shadow-sm"><Mic size={20} /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">启用语音生成</span>
                      <span className="text-[10px] text-slate-400">开启后角色可以发送语音消息</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, minimaxEnabled: !form.minimaxEnabled })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      form.minimaxEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      form.minimaxEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="h-px bg-slate-100/50" />

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Key size={14} className="text-slate-300" /> API KEY
                    </label>
                    <input
                      type="password"
                      value={form.minimaxApiKey || ''}
                      onChange={e => setForm({ ...form, minimaxApiKey: e.target.value })}
                      placeholder="Minimax API Key"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Database size={14} className="text-slate-300" /> Group ID
                    </label>
                    <input
                      type="text"
                      value={form.minimaxGroupId || ''}
                      onChange={e => setForm({ ...form, minimaxGroupId: e.target.value })}
                      placeholder="Minimax Group ID"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-slate-300" /> 语音模型
                      </label>
                      <select
                        value={form.minimaxModel || 'speech-01-turbo'}
                        onChange={e => setForm({ ...form, minimaxModel: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all appearance-none"
                      >
                        <option value="speech-2.8-hd">Speech-2.8 HD (最新)</option>
                        <option value="speech-2.8-turbo">Speech-2.8 Turbo (最新)</option>
                        <option value="speech-2.6-hd">Speech-2.6 HD</option>
                        <option value="speech-2.6-turbo">Speech-2.6 Turbo</option>
                        <option value="speech-02-hd">Speech-02 HD</option>
                        <option value="speech-02-turbo">Speech-02 Turbo</option>
                        <option value="speech-01-hd">Speech-01 HD</option>
                        <option value="speech-01-turbo">Speech-01 Turbo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={14} className="text-slate-300" /> 服务区域
                      </label>
                      <select
                        value={form.minimaxRegion || 'china'}
                        onChange={e => setForm({ ...form, minimaxRegion: e.target.value as any })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all appearance-none"
                      >
                        <option value="china">中国版 (China)</option>
                        <option value="international">国际版 (Global)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mic size={14} className="text-slate-300" /> 全局默认音色 ID
                    </label>
                    <input
                      type="text"
                      value={form.minimaxVoiceId || ''}
                      onChange={e => setForm({ ...form, minimaxVoiceId: e.target.value })}
                      placeholder="例如: male-qn-qingse"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mic size={14} className="text-slate-300" /> 测试合成文本
                    </label>
                    <input
                      type="text"
                      value={ttsTestText}
                      onChange={e => setTtsTestText(e.target.value)}
                      placeholder="输入测试文本，例如：这是一段语音测试，测试成功。"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
                    />
                  </div>

                  <button 
                    onClick={handleTestTts}
                    disabled={isTestingTts}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]",
                      isTestingTts ? "bg-slate-100 text-slate-400" : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                    )}
                  >
                    {isTestingTts ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        正在合成测试语音...
                      </div>
                    ) : (
                      <>
                        <Mic size={18} /> 测试语音播放
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'imageGen' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-transparent border-white/10" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (form.settingsBackgroundOpacity ?? 0.8) * 0.2)})` } : {}}>
              <div className="px-5 py-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shadow-sm"><ImageIcon size={20} /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">启用 AI 生图</span>
                      <span className="text-[10px] text-slate-400">开启后角色可以发送图片消息</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, imageGenEnabled: !form.imageGenEnabled })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      form.imageGenEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      form.imageGenEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="h-px bg-slate-100/50" />

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Key size={14} className="text-slate-300" /> API KEY
                    </label>
                    <input
                      type="password"
                      value={form.imageGenApiKey || ''}
                      onChange={e => setForm({ ...form, imageGenApiKey: e.target.value })}
                      placeholder="OpenAI / Proxy API Key"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={14} className="text-slate-300" /> API 地址
                    </label>
                    <input
                      type="text"
                      value={form.imageGenBaseUrl || ''}
                      onChange={e => setForm({ ...form, imageGenBaseUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2"><Cpu size={14} className="text-slate-300" /> 生图模型</div>
                        <button 
                          onClick={fetchImageModels}
                          disabled={isFetchingImageModels}
                          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <RefreshCw size={12} className={cn("text-amber-500", isFetchingImageModels && "animate-spin")} />
                        </button>
                      </label>
                      <div className="relative">
                        <select
                          value={form.imageGenModel || 'gpt-image-2'}
                          onChange={e => setForm({ ...form, imageGenModel: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all appearance-none"
                        >
                          {availableImageModels.length > 0 ? (
                            availableImageModels.map(m => <option key={m} value={m}>{m}</option>)
                          ) : (
                            <>
                              <option value="gpt-image-2">gpt-image-2</option>
                              <option value="dall-e-3">dall-e-3</option>
                              <option value="dall-e-2">dall-e-2</option>
                              <option value="flux-schnell">flux-schnell</option>
                              <option value="flux-dev">flux-dev</option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronLeft size={14} className="-rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Maximize size={14} className="text-slate-300" /> 图片质量
                      </label>
                      <select
                        value={form.imageGenQuality || 'standard'}
                        onChange={e => setForm({ ...form, imageGenQuality: e.target.value as any })}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all appearance-none"
                      >
                        <option value="standard">标准 (Standard)</option>
                        <option value="hd">高清 (HD)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Layout size={14} className="text-slate-300" /> 图片比例
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1:1', value: '1024x1024' },
                        { label: '9:16', value: '1024x1792' },
                        { label: '16:9', value: '1792x1024' },
                        { label: '3:4', value: '768x1024' },
                        { label: '4:3', value: '1024x768' }
                      ].map(size => (
                        <button
                          key={size.value}
                          onClick={() => setForm({ ...form, imageGenSize: size.value as any })}
                          className={cn(
                            "py-2 px-1 text-[10px] font-bold rounded-lg border transition-all",
                            form.imageGenSize === size.value 
                              ? "bg-amber-500 text-white border-amber-600" 
                              : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                          )}
                        >
                          {size.label} ({size.value})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Plus size={14} className="text-slate-300" /> 正面提示词
                    </label>
                    <textarea
                      value={form.imageGenPositivePrompt || ''}
                      onChange={e => setForm({ ...form, imageGenPositivePrompt: e.target.value })}
                      placeholder="正面描述词..."
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Minus size={14} className="text-slate-300" /> 反面提示词
                    </label>
                    <textarea
                      value={form.imageGenNegativePrompt || ''}
                      onChange={e => setForm({ ...form, imageGenNegativePrompt: e.target.value })}
                      placeholder="反面描述词..."
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => testImageConnection()}
                        disabled={isTestingImageConnection || isTestingImage}
                        className={cn(
                          "py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] text-sm",
                          isTestingImageConnection ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        {isTestingImageConnection ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            正在测试...
                          </div>
                        ) : (
                          <>
                            <Link2 size={16} className="text-slate-500" /> 测试 API 链接
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => handleTestImageGen()}
                        disabled={isTestingImage || isTestingImageConnection}
                        className={cn(
                          "py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] text-sm",
                          isTestingImage ? "bg-slate-100 text-slate-400" : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                        )}
                      >
                        {isTestingImage ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            正在生成...
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={16} /> 测试图片生成
                          </>
                        )}
                      </button>
                    </div>

                    {imageConnectionStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        API 链接正常！已拉取并刷新可用模型。
                      </motion.div>
                    )}

                    {imageConnectionStatus === 'error' && imageConnectionError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 font-medium flex items-start gap-1.5 px-3 py-2 bg-rose-50/50 rounded-xl border border-rose-100/50"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span>链接失败: {imageConnectionError}</span>
                      </motion.div>
                    )}

                    {imageGenError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 font-medium flex items-start gap-1.5 px-3 py-2 bg-rose-50/50 rounded-xl border border-rose-100/50"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span>生成失败: {imageGenError}</span>
                      </motion.div>
                    )}
                  </div>

                  {testImageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl overflow-hidden border-4 border-white shadow-xl mt-4 bg-slate-50 min-h-[200px] flex items-center justify-center"
                    >
                      <img 
                        src={testImageUrl} 
                        className="w-full h-auto" 
                        alt="Test Result" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = 'https://placehold.co/600x600?text=Load+Failed+Check+Network';
                        }}
                      />
                      <button 
                        onClick={() => setTestImageUrl(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'memoryApi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div className={cn(
              "rounded-2xl border shadow-sm overflow-hidden transition-all duration-500",
              form.settingsBackgroundUrl ? "bg-transparent border-white/10" : "bg-white"
            )} style={form.settingsBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (form.settingsBackgroundOpacity ?? 0.8) * 0.2)})` } : {}}>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Key size={14} className="text-slate-300" /> API KEY
                    </label>
                    <input
                      type="password"
                      value={form.memoryApiKey || ''}
                      onChange={e => setForm({ ...form, memoryApiKey: e.target.value })}
                      placeholder="OpenAI / Proxy API Key"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={14} className="text-slate-300" /> API 地址
                    </label>
                    <input
                      type="text"
                      value={form.memoryApiUrl || ''}
                      onChange={e => setForm({ ...form, memoryApiUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-slate-300" /> 模型名称
                        <button 
                          onClick={fetchMemoryModels}
                          disabled={isFetchingMemoryModels}
                          className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md hover:bg-indigo-100 transition-colors"
                        >
                          <RefreshCw size={12} className={cn("text-indigo-500", isFetchingMemoryModels && "animate-spin")} />
                        </button>
                      </label>
                      <div className="relative">
                        <select
                          value={form.memoryModel || ''}
                          onChange={e => setForm({ ...form, memoryModel: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all appearance-none"
                        >
                          {availableMemoryModels.length > 0 ? (
                            availableMemoryModels.map(m => <option key={m} value={m}>{m}</option>)
                          ) : (
                            <option value={form.memoryModel || ''}>{form.memoryModel || '尚未拉取模型'}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={testMemoryConnection}
                    disabled={isTestingMemoryConnection}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                  >
                    {isTestingMemoryConnection ? <RefreshCw size={18} className="animate-spin" /> : <Link2 size={18} />}
                    {isTestingMemoryConnection ? '测试中...' : '测试连接并保存'}
                  </button>

                  <div className="space-y-2">
                    {memoryConnectionStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-600 font-medium flex items-start gap-1.5 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span>连接成功</span>
                      </motion.div>
                    )}
                    {memoryConnectionStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 font-medium flex items-start gap-1.5 px-3 py-2 bg-rose-50/50 rounded-xl border border-rose-100/50"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                        <span>链接失败: {memoryConnectionError}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'help' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            {/* 2026年7月11日更新 (最新) */}
            <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-500 text-white rounded-md text-[10px] font-bold">最新</span>
                  <h3 className="font-bold text-slate-800 text-base">2026年7月11日更新</h3>
                </div>
                <span className="text-xs text-slate-400">v1.2.0</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化了线下剧情输入卡顿问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化微博角色发表微博读取人设问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化微博聊天和线上聊天互通</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化私聊和朋友圈互通</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化微博私信交互：支持2-7条短句连发、无缝切入最新记录及“正在输入中”实时状态提示</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化微博聊天气泡：用户侧聊天气泡文字升级为清晰纯白色</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>升级聊天时间显示：消息列表智能区分今天（显示时间）与昨天/往期（显示日期与时间）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化了app顶部白条问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>开始完善位置功能</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化了全局字体适配</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>继续优化了日程生成问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>优化pwa添加到桌面</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>设置中“帮助和反馈”更名为“更新日志”</span>
                </li>
              </ul>
            </div>

            {/* 2026年7月10日更新 (折叠展开) */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedPastLog(!expandedPastLog)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">2026年7月10日更新 ^</span>
                  <span className="text-xs text-slate-400">({expandedPastLog ? '点击收起' : '点击展开'})</span>
                </div>
                <span className={cn("text-slate-400 font-mono transition-transform duration-300", expandedPastLog && "rotate-180")}>^</span>
              </button>

              {expandedPastLog && (
                <div className="px-5 pb-5 pt-1 border-t bg-slate-50/50 space-y-2 animate-in fade-in duration-200">
                  <ul className="space-y-2 text-sm text-slate-700 leading-relaxed pt-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>1、查手机与主动查岗功能优化：支持按设置数量逐个扫描所有好友聊天记录，支持关键词触发或随机概率触发“角色查用户岗”审讯互动</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>2、动作描写智能开关：线上聊天默认自动禁止带括号的动作描写，除非用户手动在角色设置中关闭限制</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span>3、日程与小组件增强：优化日程提醒交互，新增桌面便签、实时时钟与快捷查岗组件，提升桌面美化体验</span>
                    </li>
                  </ul>
                </div>
              )}
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
