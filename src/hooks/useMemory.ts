import { useState, useEffect, useCallback } from 'react';
import { MemoryStore, OnlineMemoryEntry, OfflinePlotEntry, CoreMemoryEntry } from '../types';

const STORAGE_KEY = 'zhouzhou_memory_store';
const MEMORY_UPDATE_EVENT = 'zhouzhou_memory_update';

export function useMemory() {
  const [memoryStore, setMemoryStore] = useState<MemoryStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail && typeof e.detail === 'object') {
        setMemoryStore(e.detail);
      }
    };
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setMemoryStore(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener(MEMORY_UPDATE_EVENT as any, handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(MEMORY_UPDATE_EVENT as any, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateAndBroadcast = useCallback((newStore: MemoryStore) => {
    setMemoryStore(newStore);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.warn("Storage quota exceeded for memory store", e);
    }
    window.dispatchEvent(new CustomEvent(MEMORY_UPDATE_EVENT, { detail: newStore }));
  }, []);

  const addOnlineMemory = useCallback((friendId: string, content: string, type: 'auto' | 'manual' = 'auto', source: 'chat' | 'weibo' = 'chat') => {
    setMemoryStore(prev => {
      const friendMemory = prev[friendId] || { onlineMemories: [], offlinePlots: [], coreMemories: [] };
      const newEntry: OnlineMemoryEntry = {
        id: Date.now().toString(),
        content,
        timestamp: Date.now(),
        type,
        source
      };
      const newStore = {
        ...prev,
        [friendId]: {
          ...friendMemory,
          onlineMemories: [newEntry, ...(friendMemory.onlineMemories || [])]
        }
      };
      setTimeout(() => updateAndBroadcast(newStore), 0);
      return newStore;
    });
  }, [updateAndBroadcast]);

  const addOfflinePlot = useCallback((friendId: string, title: string, logs: any[], summary: string) => {
    setMemoryStore(prev => {
      const friendMemory = prev[friendId] || { onlineMemories: [], offlinePlots: [], coreMemories: [] };
      const newEntry: OfflinePlotEntry = {
        id: Date.now().toString(),
        title,
        timestamp: Date.now(),
        logs,
        summary
      };
      const newStore = {
        ...prev,
        [friendId]: {
          ...friendMemory,
          offlinePlots: [newEntry, ...(friendMemory.offlinePlots || [])]
        }
      };
      setTimeout(() => updateAndBroadcast(newStore), 0);
      return newStore;
    });
  }, [updateAndBroadcast]);

  const addCoreMemory = useCallback((friendId: string, content: string) => {
    setMemoryStore(prev => {
      const friendMemory = prev[friendId] || { onlineMemories: [], offlinePlots: [], coreMemories: [] };
      const newEntry: CoreMemoryEntry = {
        id: Date.now().toString(),
        content,
        timestamp: Date.now()
      };
      const newStore = {
        ...prev,
        [friendId]: {
          ...friendMemory,
          coreMemories: [newEntry, ...(friendMemory.coreMemories || [])]
        }
      };
      setTimeout(() => updateAndBroadcast(newStore), 0);
      return newStore;
    });
  }, [updateAndBroadcast]);

  const deleteCoreMemory = useCallback((friendId: string, memoryId: string) => {
    setMemoryStore(prev => {
      if (!prev[friendId]) return prev;
      const friendMemory = prev[friendId];
      const newStore = {
        ...prev,
        [friendId]: {
          ...friendMemory,
          coreMemories: (friendMemory.coreMemories || []).filter(m => m.id !== memoryId)
        }
      };
      setTimeout(() => updateAndBroadcast(newStore), 0);
      return newStore;
    });
  }, [updateAndBroadcast]);

  const getFriendMemory = useCallback((friendId: string) => {
    const memory = memoryStore[friendId] || { onlineMemories: [], offlinePlots: [], coreMemories: [] };
    return {
      onlineMemories: memory.onlineMemories || [],
      offlinePlots: memory.offlinePlots || [],
      coreMemories: memory.coreMemories || []
    };
  }, [memoryStore]);

  return {
    memoryStore,
    addOnlineMemory,
    addOfflinePlot,
    addCoreMemory,
    deleteCoreMemory,
    getFriendMemory
  };
}
