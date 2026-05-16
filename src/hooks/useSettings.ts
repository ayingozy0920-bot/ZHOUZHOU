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
