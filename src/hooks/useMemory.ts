import { useState, useEffect } from 'react';
import { MemoryStore, OnlineMemoryEntry, OfflinePlotEntry } from '../types';

const STORAGE_KEY = 'zhouzhou_memory_store';

export function useMemory() {
  const [memoryStore, setMemoryStore] = useState<MemoryStore>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch (e) {
      console.warn("Storage quota exceeded for memory store", e);
    }
  }, [memoryStore]);

  const addOnlineMemory = (friendId: string, content: string, type: 'auto' | 'manual' = 'auto', source: 'chat' | 'weibo' = 'chat') => {
    setMemoryStore(prev => {
      const friendMemory = prev[friendId] || { onlineMemories: [], offlinePlots: [] };
      const newEntry: OnlineMemoryEntry = {
        id: Date.now().toString(),
        content,
        timestamp: Date.now(),
        type,
        source
      };
      return {
        ...prev,
        [friendId]: {
          ...friendMemory,
          onlineMemories: [newEntry, ...friendMemory.onlineMemories]
        }
      };
    });
  };

  const addOfflinePlot = (friendId: string, title: string, logs: any[], summary: string) => {
    setMemoryStore(prev => {
      const friendMemory = prev[friendId] || { onlineMemories: [], offlinePlots: [] };
      const newEntry: OfflinePlotEntry = {
        id: Date.now().toString(),
        title,
        timestamp: Date.now(),
        logs,
        summary
      };
      return {
        ...prev,
        [friendId]: {
          ...friendMemory,
          offlinePlots: [newEntry, ...friendMemory.offlinePlots]
        }
      };
    });
  };

  const getFriendMemory = (friendId: string) => {
    return memoryStore[friendId] || { onlineMemories: [], offlinePlots: [] };
  };

  return {
    memoryStore,
    addOnlineMemory,
    addOfflinePlot,
    getFriendMemory
  };
}
