import React, { useState, useRef } from 'react';
import { ChevronLeft, Plus, Book, List, CheckSquare, X, Check, Upload, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppSettings, WorldBookEntry, CharacterProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '世界观': <Book size={20} />,
  '角色设定': <List size={20} />,
  '背景故事': <CheckSquare size={20} />,
  'default': <Book size={20} />
};

export default function WorldBookApp({ settings, onSave, onBack }: Props) {
  const entries = settings.worldBookEntries || [];
  const profiles = settings.characterProfiles || [];
  
  const [activeTab, setActiveTab] = useState<'global' | 'character'>('global');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldBookEntry | null>(null);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = entries.filter(e => e.scope === activeTab);

  const handleToggleEnable = (id: string) => {
    const newEntries = entries.map(e => e.id === id ? { ...e, isEnabled: !e.isEnabled } : e);
    onSave({ ...settings, worldBookEntries: newEntries });
  };

  const handleEdit = (entry: WorldBookEntry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingEntry({
      id: Date.now().toString(),
      name: '',
      category: '世界观',
      isEnabled: true,
      scope: 'global',
      linkedCharacterIds: [],
      priority: 'medium',
      content: '',
      createdAt: Date.now()
    });
    setShowModal(true);
  };

  const handleSaveEntry = (entry: WorldBookEntry) => {
    const exists = entries.some(e => e.id === entry.id);
    let newEntries;
    if (exists) {
      newEntries = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      newEntries = [entry, ...entries];
    }
    onSave({ ...settings, worldBookEntries: newEntries });
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    onSave({ ...settings, worldBookEntries: newEntries });
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let newEntries = [...entries];

      if (file.name.endsWith('.json')) {
        const content = await file.text();
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          importedData.forEach((item: any) => {
            if (item.name && item.content) {
              newEntries.push({
                id: item.id || `wb-${Date.now()}-${Math.random()}`,
                name: item.name,
                category: item.category || '世界观',
                isEnabled: item.isEnabled !== false,
                scope: item.scope || 'global',
                linkedCharacterIds: item.linkedCharacterIds || [],
                priority: item.priority || 'medium',
                content: item.content,
                createdAt: item.createdAt || Date.now()
              });
            }
          });
        } else if (importedData.name && importedData.content) {
          newEntries.push({
            id: importedData.id || `wb-${Date.now()}`,
            name: importedData.name,
            category: importedData.category || '世界观',
            isEnabled: importedData.isEnabled !== false,
            scope: importedData.scope || 'global',
            linkedCharacterIds: importedData.linkedCharacterIds || [],
            priority: importedData.priority || 'medium',
            content: importedData.content,
            createdAt: importedData.createdAt || Date.now()
          });
        }
      } else if (file.name.endsWith('.txt')) {
        const content = await file.text();
        newEntries.push({
          id: `wb-${Date.now()}`,
          name: file.name.replace('.txt', ''),
          category: '世界观',
          isEnabled: true,
          scope: 'global',
          linkedCharacterIds: [],
          priority: 'medium',
          content: content,
          createdAt: Date.now()
        });
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        // Dynamic import mammoth to avoid building issues if it's large
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        newEntries.push({
          id: `wb-${Date.now()}`,
          name: file.name.replace('.docx', ''),
          category: '世界观',
          isEnabled: true,
          scope: 'global',
          linkedCharacterIds: [],
          priority: 'medium',
          content: text,
          createdAt: Date.now()
        });
      } else {
        alert('不支持的文件格式。请上传 .json, .txt 或 .docx 文件。');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      onSave({ ...settings, worldBookEntries: newEntries });
      alert(`导入成功！`);
    } catch (err) {
      console.error('Failed to import world book:', err);
      alert('导入失败：' + (err instanceof Error ? err.message : String(err)));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col font-sans transition-all duration-500",
      settings.themeId === 'pink-cat' ? "bg-transparent" : "bg-gradient-to-b from-blue-50 to-white"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-transparent">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-800">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-lg text-slate-800">世界书</span>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json,.txt,.docx" onChange={handleImport} />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-800 bg-white rounded-full shadow-sm">
            <Upload size={20} />
          </button>
          <button onClick={handleAdd} className="p-2 -mr-2 text-slate-800 bg-white rounded-full shadow-sm">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-2">
        <div className="flex w-full bg-white rounded-xl shadow-sm overflow-hidden p-1">
          <button 
            onClick={() => setActiveTab('global')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'global' ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            全局设定
          </button>
          <button 
            onClick={() => setActiveTab('character')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === 'character' ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            角色专属
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              暂无世界书
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <div key={entry.id} className={cn(
                "flex items-center p-4 transition-colors",
                index !== filteredEntries.length - 1 && "border-b border-slate-100"
              )}>
                <div 
                  className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center mr-4 cursor-pointer"
                  onClick={() => handleEdit(entry)}
                >
                  {CATEGORY_ICONS[entry.category] || CATEGORY_ICONS['default']}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => handleEdit(entry)}>
                  <div className="font-medium text-slate-800">{entry.name || '未命名'}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{entry.category}</div>
                </div>
                <button 
                  onClick={() => handleToggleEnable(entry.id)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    entry.isEnabled ? "bg-blue-500" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    entry.isEnabled ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingEntry && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">编辑世界书</span>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Name */}
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-slate-700">名称</span>
                  <input 
                    type="text" 
                    value={editingEntry.name}
                    onChange={e => setEditingEntry({...editingEntry, name: e.target.value})}
                    placeholder="请输入世界书名称"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Category */}
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-slate-700">分类</span>
                  <input 
                    type="text" 
                    value={editingEntry.category}
                    onChange={e => setEditingEntry({...editingEntry, category: e.target.value})}
                    placeholder="选择分类"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Scope */}
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-slate-700">生效范围</span>
                  <div className="flex-1 flex items-center gap-2">
                    <button 
                      onClick={() => setEditingEntry({...editingEntry, isEnabled: !editingEntry.isEnabled})}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative shrink-0",
                        editingEntry.isEnabled ? "bg-blue-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                        editingEntry.isEnabled ? "right-0.5" : "left-0.5"
                      )} />
                    </button>
                    
                    <div className="flex-1 flex bg-slate-100 rounded-lg p-0.5">
                      <button 
                        onClick={() => setEditingEntry({...editingEntry, scope: 'global'})}
                        className={cn(
                          "flex-1 py-1 text-xs font-medium rounded-md transition-all",
                          editingEntry.scope === 'global' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        全部生效
                      </button>
                      <button 
                        onClick={() => {
                          setEditingEntry({...editingEntry, scope: 'character'});
                          setShowCharacterSelector(true);
                        }}
                        className={cn(
                          "flex-1 py-1 text-xs font-medium rounded-md transition-all",
                          editingEntry.scope === 'character' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        部分生效
                      </button>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-slate-700">优先级</span>
                  <div className="flex-1 flex gap-2">
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setEditingEntry({...editingEntry, priority: p})}
                        className={cn(
                          "flex-1 py-1.5 text-sm rounded-lg border transition-all",
                          editingEntry.priority === p 
                            ? "border-blue-500 text-blue-600 bg-blue-50" 
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {p === 'high' ? '前' : p === 'medium' ? '中' : '后'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">内容</span>
                  <textarea 
                    value={editingEntry.content}
                    onChange={e => setEditingEntry({...editingEntry, content: e.target.value})}
                    placeholder="在此输入世界观、角色设定、背景故事..."
                    className="w-full h-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex gap-2">
                {entries.some(e => e.id === editingEntry.id) && (
                  <button 
                    onClick={() => handleDeleteEntry(editingEntry.id)}
                    className="px-4 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => handleSaveEntry(editingEntry)}
                  className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Character Selector Modal */}
      <AnimatePresence>
        {showCharacterSelector && editingEntry && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">选择绑定角色</span>
                <button onClick={() => setShowCharacterSelector(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                  <Check size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {profiles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    暂无角色，请先在角色资料手账中创建
                  </div>
                ) : (
                  profiles.map(profile => {
                    const isSelected = (editingEntry.linkedCharacterIds || []).includes(profile.id);
                    return (
                      <button
                        key={profile.id}
                        onClick={() => {
                          const newIds = isSelected 
                            ? editingEntry.linkedCharacterIds.filter(id => id !== profile.id)
                            : [...editingEntry.linkedCharacterIds, profile.id];
                          setEditingEntry({...editingEntry, linkedCharacterIds: newIds});
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                          isSelected ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <img src={profile.avatarUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover" />
                          <span className="font-medium text-slate-800">{profile.name}</span>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center",
                          isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300"
                        )}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
