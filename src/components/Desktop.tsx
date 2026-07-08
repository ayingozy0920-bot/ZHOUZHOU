import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { AppId, AppInfo, DesktopItem, Widget, AppSettings } from '../types';
import { cn } from '../lib/utils';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { Plus, X, Edit2, Check, Cloud, Sun, Music, Camera, Quote, Battery, Calendar as CalendarIcon, Clock, Trash2, History, RefreshCw, ListTodo, Timer, User, Heart, MessageSquare, StickyNote, Footprints, Smile as SmileIcon, Play, SkipBack, SkipForward, Upload } from 'lucide-react';

const GRID_COLS = 4;
const GRID_ROWS = 12;
const CELL_WIDTH = 68;
const CELL_HEIGHT = 68;
const GAP_X = 16;
const GAP_Y = 12;

interface DesktopProps {
  settings: AppSettings;
  onUpdateLayout: (layout: DesktopItem[]) => void;
  apps: AppInfo[];
  iconMap: Record<string, any>;
  onOpenApp: (id: AppId) => void;
  currentTime: Date;
}

function Desktop({ settings, onUpdateLayout, apps, iconMap, onOpenApp, currentTime }: DesktopProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('desktop-current-page');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('desktop-current-page', currentPage.toString());
  }, [currentPage]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DesktopItem | null>(null);
  const [history, setHistory] = useState<DesktopItem[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = settings.desktopLayout || [];
  const maxPage = Math.max((settings.totalPages || 1) - 1, ...layout.map(item => item.position.page));

  // Auto-add missing apps to desktop
  useEffect(() => {
    if (!settings.desktopLayout) return;
    
    let hasChanges = false;
    let currentLayout = [...settings.desktopLayout];
    
    // Find all apps currently on desktop (including inside folders)
    const appsOnDesktop = new Set<string>();
    currentLayout.forEach(item => {
      if (item.type === 'app' && item.appId) {
        appsOnDesktop.add(item.appId);
      } else if (item.type === 'folder' && item.folderItems) {
        item.folderItems.forEach(appId => appsOnDesktop.add(appId));
      }
    });

    // Find missing apps
    const missingApps = apps.filter(app => !appsOnDesktop.has(app.id));
    
    if (missingApps.length > 0) {
      hasChanges = true;
      
      // Find next available position
      let page = 0;
      let x = 0;
      let y = 0;
      
      missingApps.forEach(app => {
        // Find empty spot
        let foundSpot = false;
        while (!foundSpot) {
          const isOccupied = currentLayout.some(item => 
            item.position.page === page && 
            item.position.x === x && 
            item.position.y === y
          );
          
          if (!isOccupied) {
            foundSpot = true;
            currentLayout.push({
              id: `app-${app.id}-${Date.now()}`,
              type: 'app',
              appId: app.id,
              position: { x, y, page }
            });
          }
          
          x++;
          if (x >= GRID_COLS) {
            x = 0;
            y++;
            if (y >= GRID_ROWS) {
              y = 0;
              page++;
            }
          }
        }
      });
    }
    
    if (hasChanges) {
      onUpdateLayout(currentLayout);
    }
  }, [apps, settings.desktopLayout, onUpdateLayout]);

  const saveToHistory = (newLayout: DesktopItem[]) => {
    setHistory(prev => [...prev.slice(-9), layout]);
    onUpdateLayout(newLayout);
  };

  const handleDragEnd = (id: string, info: any) => {
    setDraggedItem(null);
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;

    // Calculate grid position
    const col = Math.floor(x / (CELL_WIDTH + GAP_X));
    const row = Math.floor(y / (CELL_HEIGHT + GAP_Y));

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      // Ensure the icon bottom (including label) doesn't overlap the dock
      // The container height already accounts for the dock via pb-[108px]
      // pb-[108px] ends 4px above the dock (which is at 104px from bottom)
      const itemY = row * (CELL_HEIGHT + GAP_Y);
      if (itemY + CELL_HEIGHT > rect.height) { 
        return;
      }

      const targetItem = layout.find(item => 
        item.position.x === col && 
        item.position.y === row && 
        item.position.page === currentPage &&
        item.id !== id
      );

      // Folder creation logic
      if (targetItem && targetItem.type === 'app') {
        const sourceItem = layout.find(i => i.id === id);
        if (sourceItem && sourceItem.type === 'app') {
          const newFolder: DesktopItem = {
            id: `folder-${Date.now()}`,
            type: 'folder',
            position: { x: col, y: row, page: currentPage },
            folderItems: [targetItem.appId!, sourceItem.appId!]
          };
          saveToHistory(layout.filter(i => i.id !== id && i.id !== targetItem.id).concat(newFolder));
          return;
        }
      }

      // Normal move
      const newLayout = layout.map(item => {
        if (item.id === id) {
          return { ...item, position: { x: col, y: row, page: currentPage } };
        }
        return item;
      });
      saveToHistory(newLayout);
    }
  };

  const removeItem = (id: string) => {
    saveToHistory(layout.filter(item => item.id !== id));
  };

  const resetLayout = () => {
    if (confirm('确定要重置桌面布局吗？')) {
      onUpdateLayout(DEFAULT_SETTINGS.desktopLayout || []);
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const last = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      onUpdateLayout(last);
    }
  };

  const addWidget = (widget: Widget) => {
    const newItem: DesktopItem = {
      id: `widget-${Date.now()}`,
      type: 'widget',
      widget,
      position: { x: 0, y: 0, page: currentPage }
    };
    saveToHistory([...layout, newItem]);
    setShowWidgetGallery(false);
  };

  const updateWidgetData = (id: string, data: any) => {
    saveToHistory(layout.map(item => {
      if (item.id === id && item.widget) {
        return { ...item, widget: { ...item.widget, data: { ...item.widget.data, ...data } } };
      }
      return item;
    }));
    setEditingWidget(null);
  };

  const lastPageTurnTime = useRef<number>(0);

  return (
    <motion.div 
      className="h-full w-full relative flex flex-col pt-8 pb-[108px]"
      onContextMenu={(e) => {
        e.preventDefault();
        setIsEditMode(true);
      }}
    >
      <div 
        className="flex-1 relative overflow-hidden"
        onDoubleClick={() => setIsEditMode(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.x > 50 && currentPage > 0) {
                setCurrentPage(currentPage - 1);
              } else if (info.offset.x < -50 && currentPage < maxPage) {
                setCurrentPage(currentPage + 1);
              }
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 flex justify-center"
          >
            <div className="relative w-[320px] h-full" ref={containerRef}>
              {layout
                .filter(item => item.position.page === currentPage && !(item.type === 'widget' && item.widget?.size === '1x1'))
                .map(item => (
                  <DesktopItemRenderer 
                    key={item.id}
                    item={item}
                    settings={settings}
                    apps={apps}
                    iconMap={iconMap}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    onOpenApp={onOpenApp}
                    onDragStart={() => setDraggedItem(item.id)}
                    onDragEnd={(info: any) => handleDragEnd(item.id, info)}
                    onDrag={(info: any) => {
                      const now = Date.now();
                      if (now - lastPageTurnTime.current < 1000) return; // 1 second cooldown
                      
                      if (info.point.x < 30 && currentPage > 0) {
                        setCurrentPage(currentPage - 1);
                        lastPageTurnTime.current = now;
                      } else if (info.point.x > window.innerWidth - 30 && currentPage < maxPage) {
                        setCurrentPage(currentPage + 1);
                        lastPageTurnTime.current = now;
                      }
                    }}
                    removeItem={removeItem}
                    setEditingWidget={setEditingWidget}
                    draggedItem={draggedItem}
                    currentTime={currentTime}
                  />
                ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Indicators */}
      <div className="absolute bottom-[108px] left-0 right-0 flex justify-center gap-2 z-30">
        {Array.from({ length: Math.max(1, maxPage + 1) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              currentPage === i ? "bg-white w-4" : "bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Edit Mode Controls */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-28 left-0 right-0 flex flex-col items-center gap-4 z-30"
          >
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white p-2 rounded-full shadow-xl disabled:opacity-30"
              >
                <History size={18} />
              </button>
              <button
                onClick={resetLayout}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white p-2 rounded-full shadow-xl"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowWidgetGallery(true)}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl"
              >
                <Plus size={18} /> 添加组件
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="bg-blue-500 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-xl"
              >
                <Check size={18} /> 完成
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Gallery */}
      <AnimatePresence>
        {showWidgetGallery && (
          <WidgetGallery 
            onAdd={addWidget} 
            onClose={() => onCloseGallery()} 
            settings={settings}
            currentTime={currentTime}
          />
        )}
      </AnimatePresence>

      {/* Widget Customization Modal */}
      <AnimatePresence>
        {editingWidget && (
          <WidgetCustomizer 
            item={editingWidget}
            onUpdate={(data) => updateWidgetData(editingWidget.id, data)}
            onClose={() => setEditingWidget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  function onCloseGallery() {
    setShowWidgetGallery(false);
  }
}

const DesktopItemRenderer = React.memo(({ item, settings, apps, iconMap, isEditMode, setIsEditMode, onOpenApp, onDragStart, onDragEnd, onDrag, removeItem, setEditingWidget, draggedItem, currentTime }: any) => {
  const isApp = item.type === 'app';
  const isFolder = item.type === 'folder';
  const app = isApp ? apps.find((a: any) => a.id === item.appId) : null;
  const Icon = app ? iconMap[app.icon] : null;
  const customIcon = app ? settings.customIcons?.[app.id] : null;

  const targetX = item.position.x * (CELL_WIDTH + GAP_X);
  const targetY = item.position.y * (CELL_HEIGHT + GAP_Y);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    if (isEditMode) return;
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.8, x: targetX, y: targetY }}
      animate={{
        opacity: 1,
        x: targetX,
        y: targetY,
        scale: draggedItem === item.id ? 1.1 : 1,
        rotate: isEditMode ? [0, -1, 0, 1, 0] : 0,
        zIndex: draggedItem === item.id ? 50 : 40,
      }}
      transition={{
        rotate: { repeat: Infinity, duration: 0.5, ease: "linear" },
        scale: { duration: 0.2 },
        x: { type: 'spring', damping: 30, stiffness: 250 },
        y: { type: 'spring', damping: 30, stiffness: 250 },
        opacity: { duration: 0.2 }
      }}
      drag={isEditMode}
      dragMomentum={false}
      dragElastic={0.05}
      onDragStart={onDragStart}
      onDrag={(_: any, info: any) => onDrag && onDrag(info)}
      onDragEnd={(_: any, info: any) => onDragEnd(info)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(
        "absolute z-40 touch-none",
        item.widget?.size === '5x2' ? 'w-[320px] h-[152px]' :
        item.widget?.size === '4x4' ? 'w-[320px] h-[320px]' :
        item.widget?.size === '4x2' ? 'w-[320px] h-[152px]' :
        item.widget?.size === '2x2' ? 'w-[152px] h-[152px]' : 
        item.widget?.size === '2x1' ? 'w-[152px] h-[68px]' : 
        'w-[68px] h-[68px]'
      )}
    >
      {item.type === 'app' && app && (
        <div className="flex flex-col items-center gap-1 w-full h-full pt-1">
          <div className="relative w-[50px] h-[50px]">
            <button
              onClick={() => !isEditMode && onOpenApp(app.id)}
              className={cn(
                "absolute inset-0 rounded-[12px] aspect-square flex items-center justify-center transition-all overflow-hidden z-10",
                settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-md border border-white/10" : app.color
              )}
            >
              {customIcon ? (
                <img src={customIcon} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Icon size={24} className={cn(
                  "text-white",
                  settings.themeId === 'rainy-cat' && "text-white/40"
                )} />
              )}
            </button>
          </div>
          <span className={cn(
            "text-[10px] font-medium drop-shadow-md truncate w-full text-center mt-1",
            settings.themeId === 'rainy-cat' ? "text-white/60" : "text-white"
          )}>
            {app.name}
          </span>
        </div>
      )}

      {isFolder && (
        <div className="flex flex-col items-center gap-1 w-full h-full p-2">
          <button
            onClick={() => !isEditMode && alert('文件夹功能开发中')}
            className={cn(
              "w-[50px] h-[50px] rounded-xl grid grid-cols-2 gap-0.5 p-1 shadow-lg transition-all overflow-hidden",
              settings.themeId === 'rainy-cat' ? "bg-white/10 backdrop-blur-md border border-white/20" : "bg-white/20 backdrop-blur-md"
            )}
          >
            {item.folderItems?.slice(0, 4).map((appId: string) => {
              const folderApp = apps.find((a: any) => a.id === appId);
              const FolderIcon = folderApp ? iconMap[folderApp.icon] : null;
              return (
                <div key={appId} className={cn("w-full h-full rounded-sm flex items-center justify-center", folderApp?.color || "bg-slate-400")}>
                  {FolderIcon && <FolderIcon size={8} className="text-white" />}
                </div>
              );
            })}
          </button>
          <span className="text-[10px] font-medium text-white drop-shadow-md truncate w-full text-center">
            文件夹
          </span>
        </div>
      )}

      {item.type === 'widget' && item.widget && (
        <div 
          className="w-full h-full cursor-pointer"
          onClick={() => isEditMode && setEditingWidget(item)}
        >
          <WidgetRenderer widget={item.widget} settings={settings} currentTime={currentTime} />
        </div>
      )}

      {isEditMode && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => removeItem(item.id)}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-20"
        >
          <X size={12} />
        </motion.button>
      )}
    </motion.div>
  );
});

export default Desktop;

function WidgetCustomizer({ item, onUpdate, onClose }: { item: DesktopItem; onUpdate: (data: any) => void; onClose: () => void }) {
  const [data, setData] = useState(item.widget?.data || {});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData({ ...data, [field]: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderFields = () => {
    switch (item.widget?.type) {
      case 'ins-split':
      case 'ins-split-v2':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">主图</label>
              <div className="flex gap-2">
                <input type="text" value={data.mainUrl || ''} onChange={(e) => setData({...data, mainUrl: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'mainUrl')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">拍立得图片</label>
              <div className="flex gap-2">
                <input type="text" value={data.subUrl || ''} onChange={(e) => setData({...data, subUrl: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
            {item.widget?.type === 'ins-split' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">英文文字</label>
                  <input type="text" value={data.textEn || ''} onChange={(e) => setData({...data, textEn: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">中文文字</label>
                  <input type="text" value={data.textCn || ''} onChange={(e) => setData({...data, textCn: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">署名</label>
                  <input type="text" value={data.author || ''} onChange={(e) => setData({...data, author: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
                </div>
              </>
            )}
          </>
        );
      case 'manga-blink':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">背景图片</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'film-frame':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">背景图片</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">顶部文字</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-large-calendar':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">左下角插画/动态图</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="图片 URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase">磨砂强度 (Blur: {data.blur !== undefined ? data.blur : 12}px)</label>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  value={data.blur !== undefined ? data.blur : 12} 
                  onChange={(e) => setData({...data, blur: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase">透明度 (Opacity: {data.opacity !== undefined ? data.opacity : 15}%)</label>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={data.opacity !== undefined ? data.opacity : 15} 
                  onChange={(e) => setData({...data, opacity: parseInt(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        );
      case 'ins-love-music':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">磨砂与透明</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-[10px] text-slate-500">磨砂: {data.blur || 12}px</p>
                   <input type="range" min="0" max="40" value={data.blur || 12} onChange={e => setData({...data, blur: parseInt(e.target.value)})} className="w-full" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] text-slate-500">透明: {data.opacity || 15}%</p>
                   <input type="range" min="0" max="100" value={data.opacity || 15} onChange={e => setData({...data, opacity: parseInt(e.target.value)})} className="w-full" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">恋爱信息</label>
              <input type="text" value={data.loveTitle || ''} onChange={e => setData({...data, loveTitle: e.target.value})} placeholder="顶部标题" className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm" />
              <input type="text" value={data.loveDays || ''} onChange={e => setData({...data, loveDays: e.target.value})} placeholder="恋爱天数" className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm" />
              <input type="text" value={data.loveSlogan || ''} onChange={e => setData({...data, loveSlogan: e.target.value})} placeholder="告白标语" className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">左侧头像 & 昵称</label>
                <div className="flex gap-1">
                  <input type="text" value={data.avatar1 || ''} onChange={e => setData({...data, avatar1: e.target.value})} placeholder="头像 URL" className="flex-1 px-3 py-1 bg-slate-100 rounded-lg text-xs" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-1 bg-slate-100 rounded-lg"><Upload size={14} /></button>
                </div>
                <input type="text" value={data.nick1 || ''} onChange={e => setData({...data, nick1: e.target.value})} placeholder="昵称" className="w-full px-3 py-1 bg-slate-100 rounded-lg text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">右侧头像 & 昵称</label>
                <div className="flex gap-1">
                  <input type="text" value={data.avatar2 || ''} onChange={e => setData({...data, avatar2: e.target.value})} placeholder="头像 URL" className="flex-1 px-3 py-1 bg-slate-100 rounded-lg text-xs" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-1 bg-slate-100 rounded-lg"><Upload size={14} /></button>
                </div>
                <input type="text" value={data.nick2 || ''} onChange={e => setData({...data, nick2: e.target.value})} placeholder="昵称" className="w-full px-3 py-1 bg-slate-100 rounded-lg text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">音乐播放</label>
              <input type="text" value={data.trackTitle || ''} onChange={e => setData({...data, trackTitle: e.target.value})} placeholder="当前歌名" className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm" />
              <input type="text" value={data.artist || ''} onChange={e => setData({...data, artist: e.target.value})} placeholder="歌手名" className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm" />
              <div className="flex gap-2">
                <input type="text" value={data.cover || ''} onChange={e => setData({...data, cover: e.target.value})} placeholder="封面 URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-sm" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
              </div>
            </div>
          </div>
        );
      case 'ticket':
      case 'ticket-v2':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">背景图片</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
            {item.widget?.type === 'ticket' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">顶部文字</label>
                  <input type="text" value={data.topText || ''} onChange={(e) => setData({...data, topText: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">底部文字</label>
                  <input type="text" value={data.bottomText || ''} onChange={(e) => setData({...data, bottomText: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
                </div>
              </>
            )}
          </>
        );
      case 'polaroid-stack':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">图片1</label>
              <div className="flex gap-2">
                <input type="text" value={data.url1 || ''} onChange={(e) => setData({...data, url1: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url1')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">图片2</label>
              <div className="flex gap-2">
                <input type="text" value={data.url2 || ''} onChange={(e) => setData({...data, url2: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url2')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">图片3</label>
              <div className="flex gap-2">
                <input type="text" value={data.url3 || ''} onChange={(e) => setData({...data, url3: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url3')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">底部文字</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'collage':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">主图</label>
              <div className="flex gap-2">
                <input type="text" value={data.mainUrl || ''} onChange={(e) => setData({...data, mainUrl: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'mainUrl')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">副图1</label>
              <div className="flex gap-2">
                <input type="text" value={data.subUrl1 || ''} onChange={(e) => setData({...data, subUrl1: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'subUrl1')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">副图2</label>
              <div className="flex gap-2">
                <input type="text" value={data.subUrl2 || ''} onChange={(e) => setData({...data, subUrl2: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'subUrl2')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">标题文字</label>
              <input type="text" value={data.title || ''} onChange={(e) => setData({...data, title: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-weather-calendar':
        return (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">提示文字</label>
            <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
          </div>
        );
      case 'ins-circle-widget':
      case 'ins-music-circle-widget':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">图片链接</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-photo-square':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">图片链接</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-profile-card':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">头像链接</label>
              <input type="text" value={data.avatarUrl || ''} onChange={(e) => setData({...data, avatarUrl: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">背景墙链接</label>
              <input type="text" value={data.bgUrl || ''} onChange={(e) => setData({...data, bgUrl: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">用户名</label>
              <input type="text" value={data.name || ''} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">个人简介</label>
              <input type="text" value={data.bio || ''} onChange={(e) => setData({...data, bio: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-photo-wall-v1':
      case 'ins-photo-wall-v2':
        return (
          <>
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">图片 {i} 链接</label>
                <div className="flex gap-2">
                  <input type="text" value={data[`url${i}`] || ''} onChange={(e) => setData({...data, [`url${i}`]: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, `url${i}`)} className="hidden" accept="image/*" />
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">文字内容</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      case 'ins-signature-v1':
      case 'ins-signature-v2':
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">背景图片链接</label>
              <div className="flex gap-2">
                <input type="text" value={data.url || ''} onChange={(e) => setData({...data, url: e.target.value})} placeholder="URL" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">个性签名文字</label>
              <input type="text" value={data.text || ''} onChange={(e) => setData({...data, text: e.target.value})} className="w-full px-4 py-2 bg-slate-100 rounded-xl" />
            </div>
          </>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">自定义图片 (URL 或 上传)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={data.url || ''} 
                  onChange={(e) => setData({...data, url: e.target.value})} 
                  placeholder="输入图片链接" 
                  className="flex-1 px-4 py-2 bg-slate-100 rounded-xl" 
                />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-slate-100 rounded-xl"><Upload size={18} /></button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'url')} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">自定义文字</label>
              <input 
                type="text" 
                value={data.text || ''} 
                onChange={(e) => setData({...data, text: e.target.value})} 
                placeholder="输入文字内容" 
                className="w-full px-4 py-2 bg-slate-100 rounded-xl" 
              />
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800">自定义组件</h3>
        {renderFields()}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
          <button 
            onClick={() => onUpdate(data)}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold"
          >
            保存
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function WidgetRenderer({ widget, settings, currentTime }: { widget: Widget; settings: AppSettings; currentTime: Date }) {
  const isRainy = settings.themeId === 'rainy-cat';
  
    const isLargeCalendar = widget.type === 'ins-large-calendar';
  const isLoveMusic = widget.type === 'ins-love-music';
  const customBlur = widget.data?.blur !== undefined ? widget.data.blur : 12;
  const customOpacity = widget.data?.opacity !== undefined ? widget.data.opacity : 15;
  
  const baseClass = cn(
    "w-full h-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col relative ring-1 ring-white/20",
    (!isLargeCalendar && !isLoveMusic) && "transition-all duration-500 p-4",
    (isLargeCalendar || isLoveMusic) ? "p-0" : "p-4",
    (isLargeCalendar || isLoveMusic)
      ? "border border-white/20"
      : isRainy 
        ? "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20" 
        : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100"
  );

  const containerStyle = (isLargeCalendar || isLoveMusic) ? {
    backgroundColor: `rgba(255, 255, 255, ${customOpacity / 100})`,
    backdropFilter: `blur(${customBlur}px)`,
    WebkitBackdropFilter: `blur(${customBlur}px)`,
  } : {};

  const customBg = widget.data?.url ? (
    <div className="absolute inset-0 z-0">
      <img src={widget.data.url} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  ) : null;

  const renderContent = () => {
    switch (widget.type) {
      case 'custom-generator': {
        const d = widget.data || {};
        const bgAlpha = d.bgAlpha !== undefined ? d.bgAlpha : 0.3;
        const blur = d.blur !== undefined ? d.blur : 10;
        const radius = d.radius !== undefined ? d.radius : 20;
        const bgColor = d.bgColor || '#ffffff';
        const textColor = d.textColor || '#000000';
        const title = d.title || '在你的盲点里寸步不移';
        const sub = d.sub || '今度会う時に花を送ってくれません';
        const curTime = d.curTime || '3:26';
        const totalTime = d.totalTime || '4:50';
        const progress = d.progress !== undefined ? d.progress : 35;

        let bgStyle = bgColor;
        if (bgColor.startsWith('#')) {
          const r = parseInt(bgColor.slice(1,3), 16);
          const g = parseInt(bgColor.slice(3,5), 16);
          const b = parseInt(bgColor.slice(5,7), 16);
          bgStyle = `rgba(${isNaN(r)?255:r}, ${isNaN(g)?255:g}, ${isNaN(b)?255:b}, ${bgAlpha})`;
        }

        const isCircle = d.sizeType === 'size-circle';
        const isVertical = d.sizeType === 'size-2x4';

        return (
          <div 
            className={cn(
              "w-full h-full flex justify-center gap-1.5 p-4 z-10 overflow-hidden relative shadow-md",
              isVertical ? "flex-col-reverse justify-end" : "flex-col justify-center"
            )}
            style={{
              backgroundColor: bgStyle,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              borderRadius: isCircle ? '999px' : `${radius}px`,
              color: textColor,
            }}
          >
            <div className="font-bold text-sm tracking-tight truncate" style={{ color: textColor }}>{title}</div>
            <div className="text-[11px] opacity-80 truncate" style={{ color: textColor }}>{sub}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] opacity-70" style={{ color: textColor }}>{curTime}</span>
              <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: textColor }} />
              </div>
              <span className="text-[10px] opacity-70" style={{ color: textColor }}>{totalTime}</span>
            </div>
          </div>
        );
      }
      case 'dynamic-cat':
        return (
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="relative w-20 h-20"
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border border-white/30" />
              <div className="absolute top-6 left-5 w-2 h-2 bg-slate-800 rounded-full" />
              <div className="absolute top-6 right-5 w-2 h-2 bg-slate-800 rounded-full" />
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 1] }}
                className="absolute top-6 left-5 w-2 h-2 bg-slate-800 rounded-full" 
              />
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 1] }}
                className="absolute top-6 right-5 w-2 h-2 bg-slate-800 rounded-full" 
              />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-slate-800 rounded-full" />
            </motion.div>
            <span className={cn("text-xs font-bold mt-2", isRainy ? "text-white/60" : "text-slate-600")}>
              {widget.data?.text || "喵~"}
            </span>
          </div>
        );
      case 'live-weather':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-between">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <Sun className="text-yellow-400 drop-shadow-lg" size={32} />
              </motion.div>
              <div className="text-right">
                <span className={cn("text-3xl font-black", isRainy ? "text-white" : "text-slate-800")}>28°</span>
                <p className={cn("text-[10px] font-bold opacity-60", isRainy ? "text-white" : "text-slate-500")}>
                  {widget.data?.text || "晴朗"}
                </p>
              </div>
            </div>
            <div className="mt-auto flex gap-2 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-1.5 flex flex-col items-center">
                  <span className="text-[8px] opacity-60">{i+12}时</span>
                  <Cloud size={10} className="text-blue-300 my-1" />
                  <span className="text-[8px] font-bold">26°</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'time':
        return (
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            {isRainy && (
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-20 h-20 border border-white rounded-full relative">
                  <div className="absolute top-6 left-4 w-1.5 h-1.5 bg-white rounded-full" />
                  <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-white rounded-full" />
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3 h-1.5 border-b border-white rounded-full" />
                </div>
              </div>
            )}
            <span className={cn("font-bold tracking-tighter", widget.size === '1x1' ? "text-lg" : "text-3xl", isRainy ? "text-white/60" : "text-slate-800")}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            {widget.size !== '1x1' && (
              <span className={cn("text-[10px] font-medium uppercase tracking-widest mt-1", isRainy ? "text-white/30" : "text-slate-400")}>
                {currentTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
              </span>
            )}
          </div>
        );
      case 'weather':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Sun className="text-yellow-400 drop-shadow-lg" size={widget.size === '1x1' ? 24 : 32} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white/40 backdrop-blur-sm rounded-full" />
              </div>
              <span className={cn("font-bold", widget.size === '1x1' ? "text-base" : "text-2xl", isRainy ? "text-white" : "text-slate-800")}>25°C</span>
            </div>
            <div className="mt-auto">
              <p className={cn("font-bold", widget.size === '1x1' ? "text-[8px]" : "text-xs", isRainy ? "text-white/80" : "text-slate-600")}>
                {widget.data?.text || "今日天气：晴"}
              </p>
              {widget.size !== '1x1' && <p className={cn("text-[8px] opacity-60 font-bold", isRainy ? "text-white/60" : "text-slate-400")}>空气质量：优</p>}
            </div>
          </div>
        );
      case 'music':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center border-2 border-white shadow-inner overflow-hidden">
                <img src="https://picsum.photos/seed/cat/100/100" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-pink-400/20" />
              </div>
              {widget.size !== '1x1' && (
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold truncate", isRainy ? "text-white" : "text-slate-800")}>猫咪摇篮曲</p>
                  <p className={cn("text-[8px] opacity-60 truncate font-bold", isRainy ? "text-white" : "text-slate-500")}>正在播放</p>
                </div>
              )}
            </div>
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-center gap-4">
                <SkipBack size={14} className={isRainy ? "text-white/40" : "text-slate-400"} />
                <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-white shadow-lg">
                  <Play size={14} fill="currentColor" />
                </div>
                <SkipForward size={14} className={isRainy ? "text-white/40" : "text-slate-400"} />
              </div>
              {widget.size !== '1x1' && (
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-pink-400" />
                </div>
              )}
            </div>
          </div>
        );
      case 'photo':
        return (
          <div className="absolute inset-0 z-0">
            <img 
              src={widget.data?.url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <p className="text-[10px] text-white font-bold drop-shadow-md">官富用添加</p>
              <div className="w-4 h-4 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <Camera size={8} className="text-white" />
              </div>
            </div>
          </div>
        );
      case 'quote':
        return (
          <div className="flex flex-col h-full z-10">
            <Quote className="text-pink-400 opacity-20 absolute top-2 right-2" size={24} />
            <div className="flex-1 flex items-center">
              <p className={cn("font-bold leading-relaxed italic", widget.size === '1x1' ? "text-[8px]" : "text-sm", isRainy ? "text-white/80" : "text-pink-800")}>
                {widget.data?.text || "生活就像猫咪，有时候需要一点点懒散。"}
              </p>
            </div>
            {widget.size !== '1x1' && <p className="mt-auto text-[8px] text-pink-400 font-bold text-right">— 喵星人</p>}
          </div>
        );
      case 'battery':
        return (
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            <div className="relative w-16 h-8 border-2 border-white/40 rounded-xl p-1 bg-white/5">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg shadow-lg" style={{ width: '85%' }} />
              <div className="absolute -right-2 top-2.5 w-1.5 h-3 bg-white/40 rounded-r-full" />
            </div>
            <span className={cn("text-sm font-black mt-3 tracking-tighter", isRainy ? "text-white" : "text-slate-800")}>85%</span>
          </div>
        );
      case 'calendar':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">4月</span>
              <CalendarIcon size={12} className="text-pink-400" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-black leading-none", isRainy ? "text-white" : "text-slate-800")}>07</span>
              <span className="text-[8px] font-bold text-pink-400/60 mt-1">星期二</span>
            </div>
          </div>
        );
      case 'todo':
        return (
          <div className="flex flex-col h-full z-10 space-y-2">
            <div className="flex items-center gap-2">
              <ListTodo size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
                {widget.data?.text || "今日计划"}
              </span>
            </div>
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {['买猫粮', '铲屎', '喂猫'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5">
                  <div className="w-3 h-3 rounded-full border border-pink-400/40 flex items-center justify-center">
                    {i === 0 && <Check size={8} className="text-pink-400" />}
                  </div>
                  <span className={cn("text-[10px] font-bold truncate", i === 0 ? "line-through opacity-40" : "", isRainy ? "text-white" : "text-slate-700")}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'countdown':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center gap-2 mb-2">
              <Timer size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">倒计时</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-pink-400/10 rounded-2xl border border-pink-400/20">
              <span className={cn("text-2xl font-black", isRainy ? "text-white" : "text-pink-600")}>
                {widget.data?.days || "3天"}
              </span>
              <span className="text-[8px] font-bold opacity-60">
                {widget.data?.text || "距离猫展还有"}
              </span>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12 rounded-full border-2 border-pink-400 p-0.5">
                <img src="https://picsum.photos/seed/girl/100/100" className="w-full h-full rounded-full object-cover" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center border border-white">
                  <Heart size={8} fill="white" className="text-white" />
                </div>
              </div>
              <div>
                <p className={cn("text-sm font-black", isRainy ? "text-white" : "text-slate-800")}>小橘</p>
                <p className="text-[8px] font-bold text-pink-400">宠物博主</p>
              </div>
            </div>
            <div className="mt-auto bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-bold opacity-60">电话: 135-6666-7777</span>
              <Play size={10} className="text-pink-400" fill="currentColor" />
            </div>
          </div>
        );
      case 'together':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-around mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-pink-400 p-0.5 overflow-hidden">
                  <img src="https://picsum.photos/seed/cat2/100/100" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center border border-pink-400">
                  <div className="w-3 h-3 bg-pink-400 rounded-tr-full rotate-[-15deg]" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Music size={16} className="text-pink-400 animate-bounce" />
                <span className="text-[8px] font-black text-pink-400">一起听</span>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-pink-400 p-0.5 overflow-hidden">
                  <img src="https://picsum.photos/seed/boy/100/100" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center border border-pink-400">
                  <div className="w-3 h-3 bg-pink-400 rounded-tl-full rotate-[15deg]" />
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="w-6 h-6 rounded-lg bg-pink-400 flex items-center justify-center">
                <Play size={12} fill="white" className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black truncate">猫咪摇篮曲</p>
                <div className="h-0.5 bg-white/20 rounded-full mt-1">
                  <div className="w-1/2 h-full bg-pink-400" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="flex flex-col h-full z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">日程安排</span>
              <History size={12} className="text-pink-400" />
            </div>
            <div className="space-y-2">
              {[
                { time: '09:00', task: '早起喂猫' },
                { time: '14:00', task: '猫咪午睡' },
                { time: '19:00', task: '陪玩时间' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[8px] font-black text-pink-400 w-8">{item.time}</span>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className={cn("text-[8px] font-bold", isRainy ? "text-white/80" : "text-slate-600")}>{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'memo':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">备忘录</span>
            </div>
            <div className="flex-1 bg-yellow-100/20 p-3 rounded-2xl border border-yellow-400/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400/10 rounded-bl-3xl" />
              <p className={cn("text-[10px] font-bold leading-relaxed", isRainy ? "text-white/80" : "text-slate-700")}>
                {widget.data?.text || "别忘了给猫咪剪指甲，还有买新的逗猫棒。"}
              </p>
            </div>
          </div>
        );
      case 'step':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-between mb-2">
              <Footprints size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">步数</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="226" strokeDashoffset="45" className="text-pink-400" strokeLinecap="round" />
                </svg>
                <div className="flex flex-col items-center">
                  <span className={cn("text-xl font-black leading-none", isRainy ? "text-white" : "text-slate-800")}>8542</span>
                  <span className="text-[8px] font-bold opacity-60">步</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'mood':
        return (
          <div className="flex flex-col h-full z-10">
            <div className="flex items-center justify-between mb-2">
              <SmileIcon size={14} className="text-pink-400" />
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">心情</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg mb-2">
                <SmileIcon size={24} fill="white" className="text-white" />
              </div>
              <span className={cn("text-xs font-black", isRainy ? "text-white" : "text-slate-800")}>
                {widget.data?.mood || "开心"}
              </span>
              <span className="text-[8px] font-bold opacity-60 mt-1">
                {widget.data?.text || "今天又是美好的一天"}
              </span>
            </div>
          </div>
        );
      case 'healing-battery':
        return (
          <div className="flex flex-col h-full z-10 items-center justify-center bg-white rounded-[28px] p-2 overflow-hidden">
            <div className="bg-slate-800 rounded-full px-4 py-1.5 flex items-center gap-2 relative shadow-lg z-20">
              <div className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <span className="text-[10px] font-black text-white tracking-tighter">疗愈值° .. 100% ⚡</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/20 rounded-full border border-white/10" />
            </div>
            
            <div className="flex-1 w-full flex justify-around items-start pt-1 px-4">
              {/* Left Pendant: Bow Capsule */}
              <motion.div 
                animate={{ rotate: [3, -3, 3] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center origin-top"
              >
                <div className="w-px h-10 bg-slate-800 border-l border-dotted border-slate-400" />
                <div className="relative -mt-1">
                  <div className="w-6 h-10 bg-blue-200 rounded-full border-2 border-slate-800 relative overflow-hidden shadow-md">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white" />
                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-10 h-6 text-pink-400">
                    <div className="w-full h-full relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-current rounded-full border border-slate-800" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-current rounded-full border border-slate-800" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-slate-800" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Pendant: Halo Cat */}
              <motion.div 
                animate={{ rotate: [-3, 3, -3] }} 
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center origin-top"
              >
                <div className="w-px h-14 bg-slate-800 border-l border-dotted border-slate-400" />
                <div className="relative -mt-1">
                  {/* Halo */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2 border border-yellow-400 rounded-full opacity-60" />
                  <div className="w-10 h-10 bg-white rounded-full border-2 border-slate-800 flex items-center justify-center shadow-md relative overflow-hidden">
                    <div className="absolute top-3 left-2 w-1 h-1 bg-slate-800 rounded-full" />
                    <div className="absolute top-3 right-2 w-1 h-1 bg-slate-800 rounded-full" />
                    <div className="w-4 h-2 border-b border-slate-800 rounded-full mt-2" />
                    <div className="absolute top-0 left-1 w-3 h-3 bg-white border-2 border-slate-800 rounded-tr-full" />
                    <div className="absolute top-0 right-1 w-3 h-3 bg-white border-2 border-slate-800 rounded-tl-full" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'ins-split':
        return (
          <div className="flex flex-col h-full z-10 bg-white rounded-[28px] overflow-hidden">
            <div className="h-2/3 relative">
              <img src={widget.data?.mainUrl || "https://picsum.photos/seed/eyes/400/300"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-4 h-4 text-blue-300"><SmileIcon size={16} /></div>
              </div>
              <div className="absolute bottom-2 right-2 w-16 h-20 bg-white p-1 shadow-xl rotate-6 border border-slate-100">
                <img src={widget.data?.subUrl || "https://picsum.photos/seed/girl2/100/120"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-400 rounded-full" />
              </div>
            </div>
            <div className="h-1/3 p-3 flex flex-col justify-center relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-800 opacity-20">
                <div className="w-full h-full border-2 border-current rounded-full flex items-center justify-center">
                  <div className="w-4 h-1 bg-current rotate-45" />
                  <div className="w-4 h-1 bg-current -rotate-45" />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-800 pl-6 italic">"{widget.data?.textEn || "Clouds are cotton candy for the sky."}"</p>
              <p className="text-[8px] font-bold text-slate-400 pl-6 mt-0.5">"{widget.data?.textCn || "巷子口的猫，在等一朵落下来的云。"}"</p>
              <p className="text-[7px] font-black text-slate-600 text-right mt-1">{widget.data?.author || "——普通人类小样"}</p>
            </div>
          </div>
        );
      case 'ticket':
        return (
          <div className="flex h-full z-10 bg-slate-100 rounded-[28px] p-2 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 flex overflow-hidden relative">
              <div className="w-2/3 h-full border-r border-dashed border-slate-300 relative">
                <img src={widget.data?.url || "https://picsum.photos/seed/ticket/300/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/60 backdrop-blur-md rounded-full text-[7px] font-black text-slate-800 uppercase tracking-tighter">
                  {widget.data?.topText || "Every single day counts"}
                </div>
              </div>
              <div className="w-1/3 h-full flex flex-col p-2 justify-between relative">
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-100 rounded-full border border-slate-200" />
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-slate-800 tracking-tighter">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </p>
                  <p className="text-[7px] font-bold text-slate-400">
                    {new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} {new Date().toLocaleDateString('zh-CN', { weekday: 'short' })}
                  </p>
                </div>
                <p className="text-[6px] font-black text-slate-300 leading-tight">
                  {widget.data?.bottomText || "——Fortune favors the bold"}
                </p>
              </div>
              <div className="absolute top-1 right-1 w-4 h-4 text-slate-400 rotate-45">
                <div className="w-full h-full border border-current rounded-full flex items-center justify-center">
                  <div className="w-px h-3 bg-current" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'collage':
        return (
          <div className="flex flex-col h-full z-10 bg-slate-50 rounded-[28px] p-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)', backgroundPosition: '0 0, 5px 5px', backgroundSize: '10px 10px' }} />
            <div className="relative flex-1">
              <div className="absolute top-0 left-4 w-24 h-24 bg-white p-1 shadow-xl rotate-[-5deg] border border-slate-200 z-10">
                <img src={widget.data?.mainUrl || "https://picsum.photos/seed/collage1/200/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute top-4 right-2 w-14 h-14 bg-white p-1 shadow-lg rotate-[10deg] border border-slate-200 z-20">
                <img src={widget.data?.subUrl1 || "https://picsum.photos/seed/collage2/100/100"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute bottom-2 left-2 w-12 h-12 bg-white p-1 shadow-lg rotate-[-12deg] border border-slate-200 z-20">
                <img src={widget.data?.subUrl2 || "https://picsum.photos/seed/collage3/100/100"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-slate-400 z-30">
                <div className="w-full h-full border border-current rounded-full flex items-center justify-center">
                  <div className="w-px h-4 bg-current" />
                </div>
              </div>
            </div>
            <div className="mt-auto flex flex-col items-end pr-2 z-30">
              <p className="text-[10px] font-black text-slate-800 tracking-widest uppercase">{widget.data?.title || "WECHAT"}</p>
              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.2em]">Click to jump</p>
            </div>
          </div>
        );
      case 'ins-split-v2':
        return (
          <div className="flex flex-col h-full z-10 bg-white rounded-[28px] overflow-hidden relative">
            <div className="h-3/4 relative">
              <img src={widget.data?.mainUrl || "https://picsum.photos/seed/ins1/400/300"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-6 h-6 text-blue-300 opacity-60"><SmileIcon size={24} /></div>
              </div>
              <div className="absolute bottom-[-10px] right-4 w-24 h-28 bg-white p-1 shadow-2xl rotate-3 border border-slate-100 z-20">
                <img src={widget.data?.subUrl || "https://picsum.photos/seed/ins2/200/240"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-slate-300 rounded-full" />
              </div>
            </div>
            <div className="h-1/4 p-4 flex flex-col justify-center bg-white">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-slate-800 opacity-20">
                  <div className="w-full h-full border-2 border-current rounded-full flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-current rotate-45" />
                    <div className="w-3 h-0.5 bg-current -rotate-45" />
                  </div>
                </div>
                <p className="text-xs font-black text-slate-800 italic truncate pr-24">
                  {widget.data?.text || "The world is a book and those who do not travel read only one page."}
                </p>
              </div>
            </div>
          </div>
        );
      case 'manga-blink':
        return (
          <div className="flex flex-col h-full z-10 bg-slate-900 rounded-[28px] overflow-hidden relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute top-4 left-4 z-20">
              <p className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '·')}
              </p>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-full h-32 bg-white relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-slate-100 opacity-50" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                {/* Torn Paper Effect */}
                <div className="absolute top-0 left-0 w-full h-4 bg-slate-900" style={{ clipPath: 'polygon(0 0, 10% 100%, 20% 0, 30% 100%, 40% 0, 50% 100%, 60% 0, 70% 100%, 80% 0, 90% 100%, 100% 0)' }} />
                <div className="absolute bottom-0 left-0 w-full h-4 bg-slate-900" style={{ clipPath: 'polygon(0 100%, 10% 0, 20% 100%, 30% 0, 40% 100%, 50% 0, 60% 100%, 70% 0, 80% 100%, 90% 0, 100% 100%)' }} />
                
                {/* Blinking Eyes */}
                <div className="flex gap-12 relative z-10">
                  {[0, 1].map(i => (
                    <div key={i} className="relative w-20 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 bg-blue-100 rounded-full border-2 border-slate-800 overflow-hidden">
                        <motion.div 
                          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                          transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
                          className="absolute inset-0 bg-white origin-center"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full translate-x-1 -translate-y-1" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-4 left-0 w-full flex justify-center gap-1">
                        <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-75" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 z-20">
              <p className="text-[10px] font-black text-white italic tracking-widest uppercase opacity-80">
                {widget.data?.text || "Now stormy, now crystalline."}
              </p>
            </div>
          </div>
        );
      case 'film-frame':
        return (
          <div className="flex flex-col h-full z-10 bg-white rounded-[28px] p-2 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="flex-1 border-[8px] border-slate-800 rounded-2xl relative overflow-hidden flex flex-col">
              <div className="h-6 bg-slate-800 flex items-center justify-center px-4">
                <p className="text-[10px] font-black text-white italic truncate">
                  {widget.data?.text || "Photo"}
                </p>
              </div>
              <div className="flex-1 relative">
                <img src={widget.data?.url || "https://picsum.photos/seed/film/300/300"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <div className="w-4 h-4 text-pink-400 fill-pink-400"><Heart size={16} /></div>
                  <div className="w-4 h-4 text-pink-400 fill-pink-400"><Heart size={16} /></div>
                </div>
                <div className="absolute top-2 right-2 w-8 h-8 text-pink-300 rotate-12">
                  <div className="w-full h-full border-2 border-current rounded-full flex items-center justify-center relative">
                    <div className="absolute w-6 h-2 bg-current rounded-full rotate-45" />
                    <div className="absolute w-6 h-2 bg-current rounded-full -rotate-45" />
                  </div>
                </div>
              </div>
              <div className="h-4 bg-slate-800 flex justify-around items-center px-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-2 h-1.5 bg-white/20 rounded-sm" />
                ))}
              </div>
            </div>
          </div>
        );
      case 'ticket-v2':
        return (
          <div className="flex h-full z-10 bg-white rounded-[28px] p-2 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="flex-1 bg-slate-50 rounded-2xl shadow-inner border border-slate-200 flex overflow-hidden relative">
              <div className="w-1/2 h-full border-r-2 border-dashed border-slate-300 relative p-1">
                <img src={widget.data?.url || "https://picsum.photos/seed/ticketv2/200/200"} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              </div>
              <div className="w-1/2 h-full flex flex-col p-3 justify-between relative bg-white">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border border-slate-200" />
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-800 tracking-tighter">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} · {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[8px] font-black text-slate-600 leading-tight uppercase tracking-tighter">
                    {widget.data?.text || "Fortune favors the bold"}
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-5 h-5 text-slate-300 rotate-45">
                <div className="w-full h-full border border-current rounded-full flex items-center justify-center">
                  <div className="w-px h-3 bg-current" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'polaroid-stack':
        return (
          <div className="flex flex-col h-full z-10 bg-white rounded-[28px] p-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div className="relative flex-1">
              <div className="absolute top-2 left-2 w-20 h-24 bg-white p-1 shadow-md rotate-[-8deg] border border-slate-100 z-10">
                <img src={widget.data?.url1 || "https://picsum.photos/seed/p1/200/240"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute top-4 left-6 w-20 h-24 bg-white p-1 shadow-lg rotate-[2deg] border border-slate-100 z-20">
                <img src={widget.data?.url2 || "https://picsum.photos/seed/p2/200/240"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute top-6 left-10 w-20 h-24 bg-white p-1 shadow-xl rotate-[12deg] border border-slate-100 z-30">
                <img src={widget.data?.url3 || "https://picsum.photos/seed/p3/200/240"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
            <div className="mt-auto flex justify-end pr-2 z-40">
              <p className="text-[10px] font-black text-slate-800 tracking-widest uppercase bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
                {widget.data?.text || "US"}
              </p>
            </div>
          </div>
        );
      case 'ins-large-v1':
        return (
          <div className="flex flex-col h-full z-10 bg-white/20 backdrop-blur-xl rounded-[32px] p-6 border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img src={widget.data?.url || "https://picsum.photos/seed/ins1/400/200"} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-xl font-light text-white tracking-widest leading-tight">
                {widget.data?.text || "Capture the moment."}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm" />
                <p className="text-xs text-white/70 font-medium">Ins Style</p>
              </div>
            </div>
          </div>
        );
      case 'ins-large-v2':
        return (
          <div className="flex h-full z-10 bg-white/10 backdrop-blur-2xl rounded-[32px] overflow-hidden border border-white/20 relative">
            <div className="w-1/2 relative">
              <img src={widget.data?.url || "https://picsum.photos/seed/ins2/200/400"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="w-1/2 p-6 flex flex-col justify-center gap-4">
              <p className="text-2xl font-serif italic text-white leading-snug">
                {widget.data?.text || "Life is beautiful."}
              </p>
              <div className="w-12 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        );
      case 'ins-weather-calendar':
        return (
          <div className="flex flex-col h-full z-10 bg-white/10 backdrop-blur-2xl rounded-[32px] p-6 border border-white/20 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <p className="text-4xl font-bold">24°</p>
                <p className="text-sm opacity-70">Sunny</p>
              </div>
              <div className="text-white text-right">
                <p className="text-2xl font-bold">13</p>
                <p className="text-xs opacity-70">APR</p>
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-white text-sm font-medium">Have a great day!</p>
            </div>
          </div>
        );
      case 'ins-circle-widget':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-white/90 rounded-[32px] shadow-sm" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-300 rounded-full shadow-[0_0_10px_#f472b6]" />
            </motion.div>
            <div className="w-[75%] h-[75%] rounded-full overflow-hidden border-4 border-white shadow-inner flex flex-col items-center justify-center">
              <img src={widget.data?.url || "https://picsum.photos/seed/circle/400/400"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <p className="absolute bottom-4 text-slate-800 font-bold text-xs text-center">{widget.data?.text || "Hello"}</p>
            </div>
          </div>
        );
      case 'ins-music-circle-widget':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-white/90 rounded-[32px] shadow-sm" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_10px_#60a5fa]" />
            </motion.div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-[75%] h-[75%] rounded-full overflow-hidden border-4 border-white shadow-inner flex items-center justify-center"
            >
              <img src={widget.data?.url || "https://picsum.photos/seed/music/400/400"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute w-1/3 h-1/3 bg-black/20 rounded-full border-4 border-white/30" />
            </motion.div>
            <p className="absolute bottom-4 text-slate-800 font-bold text-xs">{widget.data?.text || "Music"}</p>
          </div>
        );
      case 'ins-photo-wall-v1':
        return (
          <div className="flex gap-2 p-2 h-full z-10 bg-white/90 backdrop-blur-md rounded-[32px] border border-white/50 shadow-lg overflow-hidden">
            {[1, 2].map(i => (
              <img key={i} src={widget.data?.[`url${i}`] || `https://picsum.photos/seed/wall1-${i}/400/400`} className="flex-1 h-full object-cover rounded-[20px] border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            ))}
            <p className="absolute bottom-2 left-0 right-0 text-slate-800 font-bold text-xs text-center">{widget.data?.text || "Photo Wall"}</p>
          </div>
        );
      case 'ins-photo-wall-v2':
        return (
          <div className="flex gap-2 p-2 h-full z-10 bg-white/90 backdrop-blur-md rounded-[32px] border border-white/50 shadow-lg overflow-hidden">
            <img src={widget.data?.url1 || "https://picsum.photos/seed/wall2-1/400/400"} className="w-1/2 h-full object-cover rounded-[20px] border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            <img src={widget.data?.url2 || "https://picsum.photos/seed/wall2-2/400/400"} className="w-1/2 h-full object-cover rounded-[20px] border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            <p className="absolute bottom-2 left-0 right-0 text-slate-800 font-bold text-xs text-center">{widget.data?.text || "Photo Wall"}</p>
          </div>
        );
      case 'ins-signature-v1':
        return (
          <div className="relative h-full z-10 bg-white/30 backdrop-blur-xl rounded-[48px] border border-white/40 shadow-lg flex items-center p-6 gap-6 overflow-hidden">
            <img src={widget.data?.url || "https://picsum.photos/seed/sig1/400/400"} className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-md" referrerPolicy="no-referrer" />
            <p className="text-white font-bold text-xl italic tracking-wide">{widget.data?.text || "在这里输入您的个性签名..."}</p>
          </div>
        );
      case 'ins-signature-v2':
        return (
          <div className="relative h-full z-10 bg-white/20 backdrop-blur-xl rounded-[48px] border border-white/30 shadow-lg flex flex-col justify-center p-6 overflow-hidden">
            <img src={widget.data?.url || "https://picsum.photos/seed/sig2/800/400"} className="absolute inset-0 w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
            <p className="relative text-white font-black text-2xl tracking-widest uppercase">{widget.data?.text || "SIGNATURE"}</p>
          </div>
        );
      case 'ins-photo-square':
        return (
          <div className="h-full z-10 rounded-[32px] overflow-hidden border border-white/20 relative">
            <img src={widget.data?.url || "https://picsum.photos/seed/photo/400/400"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        );
      case 'ins-profile-card':
        return (
          <div className="flex flex-col h-full z-10 bg-white/10 backdrop-blur-2xl rounded-[32px] border border-white/20 relative overflow-hidden">
            <div className="h-24 bg-white/20 relative">
              <img src={widget.data?.bgUrl || "https://picsum.photos/seed/bg/400/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="px-6 pb-6 pt-10 relative">
              <div className="absolute -top-8 left-6 w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden">
                <img src={widget.data?.avatarUrl || "https://picsum.photos/seed/avatar/100/100"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <p className="text-white font-bold text-lg">{widget.data?.name || "Username"}</p>
              <p className="text-white/70 text-sm">{widget.data?.bio || "Bio text here..."}</p>
            </div>
          </div>
        );
      case 'ins-large-calendar':
        const currentDay = currentTime.getDate();
        const currentMonth = currentTime.getMonth();
        const currentYear = currentTime.getFullYear();
        const weekday = currentTime.toLocaleDateString('zh-CN', { weekday: 'short' });
        const dateStr = `${currentYear}.${String(currentMonth + 1).padStart(2, '0')}.${String(currentDay).padStart(2, '0')}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const calendarDays = [];
        const headers = ['日', '一', '二', '三', '四', '五', '六'];

        for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
        for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

        return (
          <div className="flex h-full w-full z-10 p-4 gap-4 overflow-hidden">
            {/* Left Area */}
            <div className="w-[35%] flex flex-col items-center justify-center relative">
              <div className="text-center mb-1">
                <h1 className="text-[60px] font-black text-black leading-[0.9] tracking-tighter">
                  {currentDay}
                </h1>
                <p className="text-[10px] font-bold text-black opacity-80 whitespace-nowrap mt-1">
                  {dateStr} {weekday}
                </p>
              </div>
              <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden mt-1">
                <img 
                  src={widget.data?.url || "https://picsum.photos/seed/cutebear/400/400"} 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Right Area */}
            <div className="flex-1 h-full min-h-0">
              <div className="h-full bg-white/5 border-[1.2px] border-black/60 border-dashed rounded-[28px] p-2.5 relative flex flex-col justify-center overflow-hidden">
                <div className="grid grid-cols-7 mb-1.5 px-1">
                  {headers.map(h => (
                    <span key={h} className="text-[9px] text-slate-400 font-medium text-center">{h}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 px-1 pb-1">
                  {calendarDays.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-center h-5 w-full">
                      {day && (
                        <span className={cn(
                          "text-[10px] w-5 h-5 flex items-center justify-center rounded-md font-bold",
                          day === currentDay ? "bg-black text-white shadow-md" : "text-slate-400"
                        )}>
                          {day}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* CSS Moon decoration */}
                <div className="absolute bottom-2 right-2 pointer-events-none opacity-80">
                   <div className="w-4 h-4 rounded-full shadow-[inset_5px_-3px_0_0_#fde68a] rotate-[-15deg]"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ins-love-music':
        const avatar1 = widget.data?.avatar1 || "https://picsum.photos/seed/love1/200/200";
        const avatar2 = widget.data?.avatar2 || "https://picsum.photos/seed/love2/200/200";
        const loveDays = widget.data?.loveDays || "445";
        const nick1 = widget.data?.nick1 || "小乖";
        const nick2 = widget.data?.nick2 || "小宝";
        const loveTitle = widget.data?.loveTitle || "我们已经相爱";
        const loveSlogan = widget.data?.loveSlogan || "请靠近我和我的心 ๑°⌓°๑";
        
        return (
          <div className="flex flex-col h-full w-full z-10 overflow-hidden font-sans">
            {/* Top Section - Lovers */}
            <div className="flex-shrink-0 p-4 pb-2 flex flex-col items-center bg-white/10">
              <div className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mb-3 px-3 py-1 bg-white/40 rounded-full">
                {loveTitle}
              </div>
              
              <div className="flex items-center justify-center gap-4 relative">
                {/* Avatar 1 */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="relative">
                    {/* Wings Left Overlay */}
                    <div className="absolute -left-6 top-1/4 w-8 h-8 pointer-events-none">
                      <svg viewBox="0 0 24 24" fill="white" className="w-full h-full opacity-60 drop-shadow-sm rotate-[-10deg]">
                        <path d="M12,2C12,2 11,2 8,3C5,4 2,8 2,12C2,16 5,17 7,17C9,17 11,16 12,14C13,16 15,17 17,17C19,17 22,16 22,12C22,8 19,4 16,3C13,2 12,2 12,2Z" />
                      </svg>
                    </div>
                    <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-pink-100">
                      <img src={avatar1} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-black px-2 py-0.5 bg-white/50 rounded-full shadow-sm">{nick1}</div>
                </div>

                {/* Love Heart Center */}
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Heart className="w-12 h-12 fill-white text-white drop-shadow-md" strokeWidth={1} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-black font-black pt-1">
                      <span className="text-[10px] leading-none mb-0.5">{loveDays}</span>
                      <span className="text-[6px] opacity-40">DAYS</span>
                    </div>
                  </div>
                </div>

                {/* Avatar 2 */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="relative">
                    {/* Wings Right Overlay */}
                    <div className="absolute -right-6 top-1/4 w-8 h-8 pointer-events-none scale-x-[-1]">
                      <svg viewBox="0 0 24 24" fill="white" className="w-full h-full opacity-60 drop-shadow-sm rotate-[-10deg]">
                        <path d="M12,2C12,2 11,2 8,3C5,4 2,8 2,12C2,16 5,17 7,17C9,17 11,16 12,14C13,16 15,17 17,17C19,17 22,16 22,12C22,8 19,4 16,3C13,2 12,2 12,2Z" />
                      </svg>
                    </div>
                    <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-pink-100">
                      <img src={avatar2} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-black px-2 py-0.5 bg-white/50 rounded-full shadow-sm">{nick2}</div>
                </div>
              </div>

              <div className="mt-3 text-[10px] text-black/60 italic font-medium px-4 py-1 bg-white/30 rounded-full backdrop-blur-sm">
                {loveSlogan}
              </div>
            </div>

            {/* Middle Section - Track List */}
            <div className="flex-1 px-4 py-2 flex flex-col gap-1.5 overflow-hidden">
               <div className="flex items-center justify-between opacity-40 mb-1">
                 <Clock size={10} />
                 <div className="flex gap-4">
                   <SkipBack size={10} />
                   <Timer size={10} />
                   <SkipForward size={10} />
                 </div>
               </div>
               
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-black/5 flex items-center justify-center overflow-hidden">
                      <div className="w-2 h-2 rounded-full border border-black/20" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center">
                       <span className="text-[10px] font-medium text-black/40 mr-2 italic">0{i}</span>
                       <div className="flex-1 h-[1px] bg-black/5 border-t border-dotted border-black/20 mr-2" />
                       <span className="text-[9px] font-bold text-black/60">Music Track {i}</span>
                    </div>
                    <span className="text-[8px] text-black/30 font-mono">1:22</span>
                 </div>
               ))}
            </div>

            {/* Bottom Playbar */}
            <div className="flex-shrink-0 p-3 bg-white/40 backdrop-blur-md flex items-center gap-3 border-t border-white/20">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white shadow-sm flex-shrink-0">
                <img src={widget.data?.cover || "https://picsum.photos/seed/cover/200/200"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-black leading-tight truncate">{widget.data?.trackTitle || "あなたを想う感情を言えば"}</div>
                <div className="text-[8px] text-black/40 font-bold truncate tracking-wider">{widget.data?.artist || "Artist Name"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><Play size={12} fill="currentColor" /></button>
                <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><X size={10} /></button>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="z-10">Widget</div>;
    }
  };

  return (
    <div className={baseClass} style={containerStyle}>
      {customBg}
      {renderContent()}
    </div>
  );
}

function WidgetGallery({ onAdd, onClose, settings, currentTime }: { onAdd: (w: Widget) => void; onClose: () => void; settings: AppSettings, currentTime: Date }) {
  const [activeTab, setActiveTab] = useState<'library' | 'generator'>('library');

  // Custom Generator state
  const STORAGE_KEY = "custom_widgets_list";
  const [sizeType, setSizeType] = useState('size-4x2');
  const [radius, setRadius] = useState(20);
  const [bgAlpha, setBgAlpha] = useState(0.3);
  const [blur, setBlur] = useState(10);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [title, setTitle] = useState('在你的盲点里寸步不移');
  const [sub, setSub] = useState('今度会う時に花を送ってくれません');
  const [curTime, setCurTime] = useState('3:26');
  const [totalTime, setTotalTime] = useState('4:50');
  const [progress, setProgress] = useState(35);
  
  const [savedList, setSavedList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const getCurrentWidgetData = () => ({
    sizeType, radius, bgAlpha, blur, bgColor, textColor, title, sub, curTime, totalTime, progress
  });

  const getCustomWidgetObject = (cfg?: any): Widget => {
    const data = cfg || getCurrentWidgetData();
    const size: Widget['size'] = data.sizeType === 'size-circle' ? 'circle' :
                                 data.sizeType === 'size-2x4' ? '2x4' :
                                 data.sizeType === 'size-2x2' ? '2x2' : '4x2';
    return {
      id: `custom-${Date.now()}`,
      type: 'custom-generator' as const,
      size,
      category: 'Custom Generator',
      data
    };
  };

  const handleSaveToLocalStorage = () => {
    const cfg = {
      id: Date.now().toString(),
      ...getCurrentWidgetData()
    };
    const updated = [...savedList, cfg];
    setSavedList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    alert("组件保存成功！");
  };

  const handleAddCustomToDesktop = (cfg?: any) => {
    const w = getCustomWidgetObject(cfg);
    onAdd(w);
  };

  const handleLoadConfig = (item: any) => {
    setSizeType(item.sizeType || 'size-4x2');
    setRadius(item.radius !== undefined ? item.radius : 20);
    setBgAlpha(item.bgAlpha !== undefined ? item.bgAlpha : 0.3);
    setBlur(item.blur !== undefined ? item.blur : 10);
    setBgColor(item.bgColor || '#ffffff');
    setTextColor(item.textColor || '#000000');
    setTitle(item.title || '');
    setSub(item.sub || '');
    setCurTime(item.curTime || '3:26');
    setTotalTime(item.totalTime || '4:50');
    setProgress(item.progress !== undefined ? item.progress : 35);
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedList.filter(item => item.id !== id);
    setSavedList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const [importCodeText, setImportCodeText] = useState('');

  const cleanWordText = (text: string) => {
    return text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  };

  const parseHtmlWidget = (rawCode: string) => {
    const html = cleanWordText(rawCode);
    const cfg = {
      sizeType: "size-4x2",
      radius: 20,
      bgAlpha: 0.3,
      blur: 10,
      bgColor: "#ffffff",
      textColor: "#000000",
      title: "",
      sub: "",
      curTime: "",
      totalTime: "",
      progress: 0
    };

    const titleMatch = html.match(/<div class="title">([\s\S]*?)<\/div>/);
    if (titleMatch) cfg.title = titleMatch[1].trim();

    const subMatch = html.match(/<div class="sub">([\s\S]*?)<\/div>/);
    if (subMatch) cfg.sub = subMatch[1].trim();

    const spanArr = html.match(/<span>(.*?)<\/span>/g) || [];
    const timeList = spanArr.map(s => s.replace(/<\/?span>/g, "").trim());
    if (timeList.length >= 2) {
      cfg.curTime = timeList[0];
      cfg.totalTime = timeList[1];
    }

    const proMatch = html.match(/width:\s*(\d+)%/);
    if (proMatch) cfg.progress = Number(proMatch[1]);

    const radiusMatch = html.match(/border-radius:\s*(\d+)/);
    if (radiusMatch) cfg.radius = Number(radiusMatch[1]);

    const blurMatch = html.match(/blur\((\d+px)/);
    if (blurMatch) cfg.blur = Number(blurMatch[1].replace("px", ""));

    const rgbaMatch = html.match(/rgba\([\d, ]+,\s*([0-9.]+)\)/);
    if (rgbaMatch) cfg.bgAlpha = Number(rgbaMatch[1]);

    return cfg;
  };

  const handleImportHtml = () => {
    const code = importCodeText.trim();
    if (!code) return alert("请粘贴组件HTML代码！");
    try {
      const config = parseHtmlWidget(code);
      handleLoadConfig(config);
      alert("HTML组件解析完成，已自动加载配置！");
    } catch (e) {
      alert("解析失败，请检查代码格式是否为标准widget组件代码");
      console.error(e);
    }
  };

  const handleImportJson = () => {
    const text = importCodeText.trim();
    if (!text) return alert("请粘贴JSON配置文本！");
    try {
      const cfg = JSON.parse(text);
      handleLoadConfig(cfg);
      alert("JSON配置导入成功！");
    } catch (e) {
      alert("JSON格式错误，无法解析");
      console.error(e);
    }
  };

  const widgets: Widget[] = [
    { id: 'w2', type: 'weather', size: '2x1' },
    { id: 'w29', type: 'ins-split-v2', size: '5x2' },
    { id: 'w43', type: 'ins-photo-wall-v1', size: '5x2', category: 'Photo Wall' },
    { id: 'w44', type: 'ins-photo-wall-v2', size: '5x2', category: 'Photo Wall' },
    { id: 'w50', type: 'ins-large-calendar', size: '5x2', category: 'Calendar' },
    { id: 'w51', type: 'ins-love-music', size: '4x4', category: 'Love' },
  ];

  const groupedWidgets = widgets.reduce((acc, w) => {
    const key = w.category || w.size;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {} as Record<string, Widget[]>);

  const categories = ['2x1', '2x2', '4x2', '4x4', '5x2', '6x2', 'Circle', 'Photo Wall', 'Calendar', 'Love'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="absolute inset-0 z-50 bg-pink-50/90 backdrop-blur-2xl flex flex-col"
    >
      <div className="p-6 flex items-center justify-between border-b border-white/50">
        <div className="flex items-center gap-4">
          <h3 className="text-slate-800 font-bold text-lg">添加小组件</h3>
          <div className="flex bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('library')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'library' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >
              精选组件库
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeTab === 'generator' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >
              🎨 自定义生成器
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
          <X size={24} />
        </button>
      </div>
      
      {activeTab === 'library' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {categories.map(category => groupedWidgets[category] && (
            <div key={category} className="space-y-4">
              <h4 className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] px-2">{category}</h4>
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide px-2">
                {groupedWidgets[category].map(w => (
                  <div key={w.id} className="flex-shrink-0 space-y-3">
                    <div 
                      className={cn(
                        "rounded-[32px] overflow-hidden border-2 border-white/60 hover:border-pink-400 transition-all cursor-pointer group relative shadow-2xl shadow-pink-900/5",
                        w.size === '1x1' ? 'w-[120px] h-[120px]' :
                        w.size === '2x1' ? 'w-[260px] h-[120px]' :
                        w.size === '2x2' ? 'w-[260px] h-[260px]' :
                        w.size === '4x4' ? 'w-[320px] h-[320px]' :
                        w.size === '4x2' ? 'w-[320px] h-[160px]' :
                        w.size === '5x2' ? 'w-[400px] h-[160px]' :
                        w.size === '6x2' ? 'w-[480px] h-[160px]' : 'w-[120px] h-[120px]'
                      )}
                      onClick={() => onAdd(w)}
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:bg-white/40 transition-colors" />
                      <div className="w-full h-full">
                        <WidgetRenderer widget={w} settings={settings} currentTime={currentTime} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-sm">
                        <div className="bg-pink-400 text-white p-3 rounded-full shadow-xl scale-110">
                          <Plus size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="px-2">
                      <span className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">{w.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Editor Panel */}
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl space-y-4">
            <h4 className="text-slate-800 font-extrabold text-sm border-b pb-2">自定义小组件配置</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">组件版型</label>
                <select value={sizeType} onChange={e => setSizeType(e.target.value)} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
                  <option value="size-4x2">横版4×2</option>
                  <option value="size-2x4">竖版2×4</option>
                  <option value="size-2x2">方形2×2</option>
                  <option value="size-circle">圆形</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">圆角大小 (px)</label>
                <input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">背景透明度 (0~1)</label>
                <input type="number" step="0.05" min="0" max="1" value={bgAlpha} onChange={e => setBgAlpha(Number(e.target.value))} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">毛玻璃强度 (Blur)</label>
                <input type="number" value={blur} onChange={e => setBlur(Number(e.target.value))} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">背景色</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 p-2 bg-slate-100 rounded-xl text-xs font-bold" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">文字颜色</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="flex-1 p-2 bg-slate-100 rounded-xl text-xs font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">主标题文字</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">副标题文字</label>
                <input type="text" value={sub} onChange={e => setSub(e.target.value)} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">当前时长</label>
                <input type="text" value={curTime} onChange={e => setCurTime(e.target.value)} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">总时长</label>
                <input type="text" value={totalTime} onChange={e => setTotalTime(e.target.value)} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">进度百分比</label>
                <input type="number" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full p-2.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200" />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSaveToLocalStorage}
                className="flex-1 py-3 bg-pink-100 text-pink-700 rounded-xl text-xs font-bold hover:bg-pink-200 transition-colors shadow-sm"
              >
                保存到本地列表
              </button>
              <button
                onClick={() => handleAddCustomToDesktop()}
                className="flex-1 py-3 bg-pink-100 text-pink-700 rounded-xl text-xs font-bold hover:bg-pink-200 transition-colors shadow-sm"
              >
                直接添加至桌面
              </button>
            </div>

            {/* Import Module */}
            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
              <h5 className="text-xs font-extrabold text-slate-700">导入组件代码 / JSON配置</h5>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">粘贴HTML代码 / JSON文本（支持Word复制内容）</label>
                <textarea 
                  value={importCodeText} 
                  onChange={e => setImportCodeText(e.target.value)} 
                  placeholder="粘贴docx内的widget完整HTML代码，或本地导出的JSON配置"
                  className="w-full p-2.5 bg-white rounded-xl text-xs font-medium border border-slate-200 min-h-[90px] resize-vertical"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleImportHtml}
                  className="flex-1 py-2 bg-pink-100 text-pink-700 rounded-xl text-xs font-bold hover:bg-pink-200 transition-colors shadow-sm"
                >
                  解析HTML小组件
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="flex-1 py-2 bg-pink-100 text-pink-700 rounded-xl text-xs font-bold hover:bg-pink-200 transition-colors shadow-sm"
                >
                  解析JSON存档
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Preview & Saved List */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl space-y-4">
              <h4 className="text-slate-800 font-extrabold text-sm border-b pb-2">实时效果预览</h4>
              <div className="flex justify-center items-center py-6 bg-slate-100/50 rounded-2xl min-h-[220px]">
                <div className={cn(
                  "shadow-2xl overflow-hidden transition-all",
                  sizeType === 'size-circle' ? 'w-[160px] h-[160px]' :
                  sizeType === 'size-2x4' ? 'w-[152px] h-[320px]' :
                  sizeType === 'size-2x2' ? 'w-[152px] h-[152px]' : 'w-[320px] h-[152px]'
                )}>
                  <WidgetRenderer widget={getCustomWidgetObject()} settings={settings} currentTime={currentTime} />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl space-y-3">
              <h4 className="text-slate-800 font-extrabold text-sm border-b pb-2">已保存的自定义小组件 ({savedList.length})</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {savedList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">暂无保存的小组件，点击“保存到本地列表”即可查看</p>
                ) : (
                  savedList.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                      <div className="truncate flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">【{item.title || '无标题'}】</p>
                        <p className="text-[10px] text-slate-400">版型: {item.sizeType} | 透明度: {item.bgAlpha}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLoadConfig(item)}
                          className="px-2.5 py-1 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg text-[10px] font-bold"
                        >
                          加载
                        </button>
                        <button
                          onClick={() => handleAddCustomToDesktop(item)}
                          className="px-2.5 py-1 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg text-[10px] font-bold"
                        >
                          添加
                        </button>
                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          className="p-1 text-red-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
