import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { get, set } from 'idb-keyval';


export function DataManagementPage({ onBack, userProfile }: { onBack: () => void, userProfile: any }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Define categorized keys
  const groups = [
    {
      name: '平行时空核心数据',
      keys: ['parallel_all_characters', 'parallel_custom_characters', 'parallel_world_books', 'user_profile_data', 'parallel_memory_summaries']
    },
    {
      name: '社交与聊天数据',
      keys: ['wechat-settings', 'wechat-friends', 'wechat-chats', 'wechat-user-profile']
    },
    {
      name: '沉浸式应用数据',
      keys: ['offline-memory', 'moon_shadow_movies', 'parallel_universe_beautify_config']
    },
    {
      name: '约会与互动数据',
      keys: ['yueyu_date_album', 'yueyu_postcards', 'yueyu_user_profile', 'yueyu_scene_backgrounds', 'yueyu_mall_cart']
    }
  ];

  const exportAllData = async () => {
    setIsExporting(true);
    setStatus('正在搜寻时空碎片 (所有数据)...');
    try {
      const backup: any = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        idb: {},
        localStorage: {}
      };

      // 1. Export from IndexedDB (idb-keyval)
      const allKeys = groups.flatMap(g => g.keys);
      for (const key of allKeys) {
        const value = await get(key);
        if (value !== undefined) backup.idb[key] = value;
      }

      // 2. Scan localStorage for dynamic keys (like diaries_ and specific app keys)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('diaries_') || 
          key.startsWith('meeting_settings_') || 
          key.startsWith('yueyu_') ||
          key === 'lockScreenPassword' ||
          key === 'desktop-current-page'
        )) {
          backup.localStorage[key] = localStorage.getItem(key);
        }
      }

      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Parallel_Universe_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      setStatus('导出成功！已保存所有时空记录。');
    } catch (e) {
      console.error(e);
      setStatus('导出失败，波函数塌缩异常。');
    } finally {
      setIsExporting(false);
    }
  };

  const importAllData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus('正在融合时空数据...');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string);
          
          // Legacy support (1.0)
          if (backup.version === '1.0' && backup.data) {
             for (const key in backup.data) {
               await set(key, backup.data[key]);
             }
          } 
          // New format (2.0)
          else if (backup.idb || backup.localStorage) {
            if (backup.idb) {
              for (const key in backup.idb) {
                await set(key, backup.idb[key]);
              }
            }
            if (backup.localStorage) {
              for (const key in backup.localStorage) {
                localStorage.setItem(key, backup.localStorage[key]);
              }
            }
          } else {
            throw new Error('格式不兼容');
          }
          
          setStatus('同步完成！系统即将重启以应用更改。');
          setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
          setStatus('错误：数据流损坏或格式不兼容。');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      setStatus('读取失败，外部干预。');
      setIsImporting(false);
    }
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[120] bg-white p-6 overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-slate-400"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-black">数据管理</h2>
      </header>

      <div className="space-y-6">
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-xs text-slate-600 flex gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <p>备份包含所有聊天记录、角色设定及美化配置。请妥善保管导出的文件，导入将覆盖当前所有应用数据。</p>
        </div>

        <button 
          onClick={exportAllData} 
          disabled={isExporting}
          className="w-full py-4 bg-slate-900 text-white rounded-full font-black flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Database className="animate-spin" size={20} /> : <Download size={20} />} 
          {isExporting ? '生成中...' : '导出所有项目备份 (.json)'}
        </button>

        <label className="w-full py-4 bg-pink-100 text-pink-600 rounded-full font-black flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer">
          {isImporting ? <Database className="animate-spin" size={20} /> : <Upload size={20} />} 
          {isImporting ? '恢复中...' : '一键导入 / 恢复备份'}
          <input type="file" className="hidden" accept=".json" onChange={importAllData} disabled={isImporting} />
        </label>

        {status && <p className="text-center text-sm font-bold text-slate-700 mt-4">{status}</p>}
      </div>
    </motion.div>
  );
}
