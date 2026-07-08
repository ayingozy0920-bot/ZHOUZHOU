import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'zhouzhou_ji_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-3.5-turbo',
  autoSummaryThreshold: 10, // Default to 10 rounds
  callBackground: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?auto=format&fit=crop&q=80&w=1920',
  isCallBackgroundEnabled: true,
  themeColor: '#3b82f6', // blue-500
  glassOpacity: 0.8,
  fontSize: 'medium',
  fontFamily: 'cute-cheese',
  backgroundBlur: 10,
  wallpaperUrl: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?auto=format&fit=crop&q=80&w=1920',
  customIcons: {},
  hideStatusBar: false,
  customFontUrl: '',
  fontPresets: [],
  homePages: [['chat', 'world-book', 'meituan', 'weibo', 'shopping', 'parallel-universe', 'check-phone', 'dating', 'calendar', 'diary', 'settings', 'memory']],
  themeId: 'rainy-cat',
  desktopLayout: [
    { id: 'chat', type: 'app', appId: 'chat', position: { x: 0, y: 0, page: 0 } },
    { id: 'world-book', type: 'app', appId: 'world-book', position: { x: 1, y: 0, page: 0 } },
    { id: 'meituan', type: 'app', appId: 'meituan', position: { x: 2, y: 0, page: 0 } },
    { id: 'weibo', type: 'app', appId: 'weibo', position: { x: 3, y: 0, page: 0 } },
    { id: 'shopping', type: 'app', appId: 'shopping', position: { x: 0, y: 1, page: 0 } },
    { id: 'parallel-universe', type: 'app', appId: 'parallel-universe', position: { x: 1, y: 1, page: 0 } },
    { id: 'check-phone', type: 'app', appId: 'check-phone', position: { x: 2, y: 1, page: 0 } },
    { id: 'dating', type: 'app', appId: 'dating', position: { x: 3, y: 1, page: 0 } },
    { id: 'calendar', type: 'app', appId: 'calendar', position: { x: 0, y: 2, page: 0 } },
    { id: 'diary', type: 'app', appId: 'diary', position: { x: 1, y: 2, page: 0 } },
    { id: 'settings', type: 'app', appId: 'settings', position: { x: 2, y: 2, page: 0 } },
    { id: 'memory', type: 'app', appId: 'memory', position: { x: 3, y: 2, page: 0 } },
    { id: 'phone', type: 'app', appId: 'phone', position: { x: 0, y: 3, page: 0 } },
    { id: 'moon-shadow', type: 'app', appId: 'moon-shadow', position: { x: 1, y: 3, page: 0 } },
  ],
  timeAwarenessEnabled: true,
  apiPresets: [],
  fullScreenMode: false,
  lockScreenEnabled: true,
  minimaxApiKey: '',
  minimaxGroupId: '',
  minimaxModel: 'speech-01-turbo',
  minimaxRegion: 'china',
  minimaxVoiceId: 'male-qn-qingse',
  minimaxEnabled: false,
  imageGenEnabled: false,
  imageGenApiKey: '',
  imageGenBaseUrl: '',
  imageGenModel: 'gpt-image-2',
  imageGenSize: '1024x1024',
  imageGenQuality: 'standard',
  imageGenPositivePrompt: 'high quality, detailed, photorealistic',
  imageGenNegativePrompt: 'cel shaded, flat shading, harsh lighting, hard shadows, bad anatomy, poorly drawn face, ugly, deformed, extra fingers',
  diaryEntries: [],
  isCuteRabbitThemeEnabled: false,
  isDarkThemeEnabled: false,
  globalCustomCss: '',
  bubbleCustomCss: '',
  appBackgroundUrl: '',
  backgroundBlurIntensity: 10,
  backgroundOpacity: 0.2,
  chatWallpaperUrl: '',
  homeWallpaperUrl: '',
  totalPages: 1,
  chatThemes: [
    {
      id: 'imessage-theme',
      name: 'iMessage (蓝白经典)',
      css: `/* iMessage Pro Theme */
.chat-app-main { background-color: #ffffff !important; }
.chat-window-container { background-color: #ffffff !important; }
.chat-window-header { 
  background-color: rgba(255, 255, 255, 0.8) !important; 
  backdrop-filter: blur(20px) !important; 
  border-bottom: 0.5px solid #d1d1d6 !important; 
  color: #000 !important;
  height: 64px !important;
}
.chat-window-footer { 
  background-color: rgba(249, 249, 249, 0.9) !important; 
  backdrop-filter: blur(20px) !important; 
  border-top: 0.5px solid #d1d1d6 !important; 
  padding: 8px 12px !important;
}
.chat-input-area { 
  background-color: #ffffff !important; 
  border: 1px solid #d1d1d6 !important; 
  border-radius: 20px !important; 
  padding: 6px 12px !important;
}

/* Message Bubbles - User (Blue) */
.message-bubble-user { 
  background: #007aff !important; 
  color: #ffffff !important; 
  border-radius: 20px 20px 4px 20px !important; 
  padding: 8px 14px !important;
  font-size: 16px !important;
  line-height: 1.4 !important;
  box-shadow: none !important;
  border: none !important;
}

/* Message Bubbles - Friend (Gray) */
.message-bubble-assistant, .message-bubble-friend { 
  background-color: #e9e9eb !important; 
  color: #000000 !important; 
  border-radius: 20px 20px 20px 4px !important; 
  padding: 8px 14px !important;
  font-size: 16px !important;
  line-height: 1.4 !important;
  box-shadow: none !important;
  border: none !important;
}

/* Avatars - Round & Mini */
.chat-avatar { 
  border-radius: 50% !important; 
  width: 32px !important; 
  height: 32px !important;
  border: 0.5px solid rgba(0,0,0,0.1) !important;
}

/* Transfer Card Styling */
.message-type-transfer {
  background: #f8f8f8 !important;
  border-radius: 14px !important;
  border: 1px solid #e5e5ea !important;
  overflow: hidden !important;
}
.transfer-header { background: #ff9500 !important; color: #fff !important; }

/* Icons & Buttons */
.heart-beat-button { display: none !important; }
.send-button-icon { color: #007aff !important; }

/* Hide unnecessary UI for minimalist look */
.chat-window-header .friend-status { display: none !important; }
`
    },
    {
      id: 'modern-glass',
      name: '极简毛玻璃',
      css: `.chat-app-main { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important; }
.chat-window-header, .chat-window-footer { background: rgba(255, 255, 255, 0.4) !important; backdrop-filter: blur(10px) !important; border: none !important; }
.message-bubble-user { background: rgba(59, 130, 246, 0.8) !important; backdrop-filter: blur(5px) !important; border-radius: 20px 20px 0 20px !important; }
.message-bubble-assistant { background: rgba(255, 255, 255, 0.6) !important; backdrop-filter: blur(5px) !important; border-radius: 20px 20px 20px 0 !important; }`
    },
    {
      id: 'cream-yellow',
      name: '奶黄简约 (清新明亮)',
      css: `/* Cream Yellow Theme */
.chat-app-main { background-color: #fffdf2 !important; }
.chat-window-header { background-color: #fff9db !important; color: #856404 !important; border-bottom: 2px solid #ffec99 !important; }
.chat-window-footer { background-color: #fff9db !important; border-top: 2px solid #ffec99 !important; }
.chat-input-area { background-color: #ffffff !important; border: 2px solid #ffec99 !important; border-radius: 12px !important; }

/* Bubbles */
.message-bubble-user { 
  background-color: #fff3bf !important; 
  color: #856404 !important; 
  border: 2px solid #ffec99 !important;
  border-radius: 16px 16px 4px 16px !important;
}
.message-bubble-assistant { 
  background-color: #ffffff !important; 
  color: #495057 !important; 
  border: 2px solid #f1f3f5 !important;
  border-radius: 16px 16px 16px 4px !important;
}

/* Avatars - Square with border */
.chat-avatar { border-radius: 10px !important; border: 2px solid #ffec99 !important; padding: 2px !important; background: #fff !important; }
`
    }
  ],
  activeChatThemeId: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        let saved = await get(STORAGE_KEY);
        
        // Migration from localStorage
        if (!saved) {
          const localSaved = localStorage.getItem(STORAGE_KEY);
          if (localSaved) {
            try {
              saved = JSON.parse(localSaved);
              // Save to idb for future
              await set(STORAGE_KEY, saved);
            } catch (e) {
              console.error('Failed to parse localStorage settings:', e);
            }
          }
        }

        if (saved) {
          const parsed = saved;
          let finalSettings = parsed;

          // Ensure desktopLayout exists for existing users
          if (!parsed.desktopLayout || parsed.desktopLayout.length === 0) {
            // Migration from homePages
            if (parsed.homePages && parsed.homePages.length > 0) {
              const migratedLayout: any[] = [];
              parsed.homePages.forEach((page: string[], pageIdx: number) => {
                page.forEach((appId: string, appIdx: number) => {
                  migratedLayout.push({
                    id: `${appId}-${Date.now()}-${appIdx}-${Math.random().toString(36).substr(2, 9)}`,
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
              finalSettings = { ...parsed, desktopLayout: migratedLayout };
            } else {
              finalSettings = { ...parsed, desktopLayout: DEFAULT_SETTINGS.desktopLayout };
            }
          } else {
            // Ensure all default apps are present
            const existingAppIds = new Set(parsed.desktopLayout.map((item: any) => item.appId));
            const missingApps = DEFAULT_SETTINGS.desktopLayout!.filter(item => item.type === 'app' && !existingAppIds.has(item.appId));
            if (missingApps.length > 0) {
              finalSettings = { ...parsed, desktopLayout: [...parsed.desktopLayout, ...missingApps] };
            }
          }

          // Ensure totalPages is set
          if (!finalSettings.totalPages) {
            const layout = finalSettings.desktopLayout || [];
            const maxPageInLayout = Math.max(0, ...layout.map((item: any) => item.position?.page || 0));
            finalSettings.totalPages = maxPageInLayout + 1;
          }

          // Deduplicate desktopLayout IDs to prevent React duplicate key errors
          if (finalSettings.desktopLayout) {
            const seenIds = new Set();
            finalSettings.desktopLayout = finalSettings.desktopLayout.map((item: any, idx: number) => {
              if (seenIds.has(item.id)) {
                return { ...item, id: `${item.id}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}` };
              }
              seenIds.add(item.id);
              return item;
            });
          }

          setSettings(finalSettings);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSettings();
  }, []);

  const saveSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    try {
      // 仅保存到 idb，避免 localStorage 空间不足导致崩溃
      await set(STORAGE_KEY, newSettings);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  useEffect(() => {
    const handleDataImported = async () => {
      try {
        const saved = await get(STORAGE_KEY);
        if (saved) {
          setSettings(saved);
        } else {
          const localSaved = localStorage.getItem(STORAGE_KEY);
          if (localSaved) {
            setSettings(JSON.parse(localSaved));
          }
        }
      } catch (e) {
        console.error('Failed to load imported settings:', e);
      }
    };
    window.addEventListener('data-imported', handleDataImported);
    return () => window.removeEventListener('data-imported', handleDataImported);
  }, []);

  return { settings, saveSettings, isLoaded };
}
