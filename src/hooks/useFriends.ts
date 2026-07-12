import { useState, useEffect } from 'react';
import { Friend, ChatMessage, UserPersona, FavoriteMessage, MomentPost, GroupChat, UserProfile, BankCard, Transaction } from '../types';
import { get, set } from 'idb-keyval';

export const formatMessageTimestamp = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) {
    return timeStr;
  } else if (isYesterday) {
    return `昨天 ${timeStr}`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日 ${timeStr}`;
  }
};

export type { BankCard, Transaction };

const FRIENDS_KEY = 'zhouzhou_ji_friends';
const CHATS_KEY = 'zhouzhou_ji_chats';
const GROUPS_KEY = 'zhouzhou_ji_groups';
const USER_PROFILE_KEY = 'zhouzhou_ji_user_profile';

const DEFAULT_USER: UserProfile = {
  name: '我的名字',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
  id: 'zhouzhou_ji_user',
  wechatId: 'zhouzhou_001',
  signature: '生活明朗，万物可爱',
  persona: '一个热爱生活、充满好奇心的普通人。',
  momentsBackground: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000',
  moments: [],
  favorites: [],
  personas: [],
  balance: 8888.88,
  bankCards: [
    {
      id: 'card-1',
      bankName: '招商银行',
      cardNumber: '**** **** **** 8888',
      balance: 50000,
      cardType: 'VISA 信用卡',
      theme: 'genshin-impact',
      backgroundUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000'
    },
    {
      id: 'card-kitty',
      bankName: '建设银行',
      cardNumber: '**** **** **** 6666',
      balance: 12000,
      cardType: 'Hello Kitty 联名卡',
      theme: 'hello-kitty',
      backgroundUrl: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=1000'
    },
    {
      id: 'card-dog',
      bankName: '工商银行',
      cardNumber: '**** **** **** 9999',
      balance: 8000,
      cardType: '线条小狗 联名卡',
      theme: 'line-dog',
      backgroundUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=1000'
    },
    {
      id: 'card-kuromi',
      bankName: '农业银行',
      cardNumber: '**** **** **** 7777',
      balance: 15000,
      cardType: '库洛米 联名卡',
      theme: 'kuromi',
      backgroundUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000'
    }
  ],
  transactions: [
    {
      id: 't-1',
      type: 'topup',
      amount: 10000,
      title: '充值',
      timestamp: Date.now() - 86400000
    }
  ]
};

const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'zhouzhou-assistant',
    name: '粥粥助手',
    avatar: 'https://iili.io/CltVPYF.png',
    persona: '你是一个乐于助人的粥粥助手，说话简洁明了。',
    address: '云端服务器',
    gender: 'other',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    momentsBackground: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000',
  moments: [
    { 
      id: '1', 
      authorId: 'zhouzhou-assistant',
      content: '大家好，我是你的粥粥助手！很高兴能为你服务。', 
      likes: [],
      comments: [],
      visibility: 'public',
      timestamp: Date.now() - 3600000 
    },
    { 
      id: '2', 
      authorId: 'zhouzhou-assistant',
      content: '今天的天气真不错，适合在云端漫步。', 
      images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=500'], 
      likes: [],
      comments: [],
      visibility: 'public',
      timestamp: Date.now() - 86400000 
    }
  ],
  momentsSettings: {
    autoPostEnabled: true,
    frequency: 1,
    scheduledTimes: ["10:00"]
  },
    lastMessage: '你好！我是你的粥粥助手。',
    lastTime: '12:00'
  }
];

export function useFriends() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const savedUser = await get(USER_PROFILE_KEY);
        const savedFriends = await get(FRIENDS_KEY);
        const savedGroups = await get(GROUPS_KEY);
        const savedChats = await get(CHATS_KEY);

        if (savedUser) setUser(savedUser);
        else {
          const localUser = localStorage.getItem(USER_PROFILE_KEY);
          if (localUser) setUser(JSON.parse(localUser));
        }

        if (savedFriends) setFriends(savedFriends);
        else {
          const localFriends = localStorage.getItem(FRIENDS_KEY);
          if (localFriends) setFriends(JSON.parse(localFriends));
        }

        if (savedGroups) setGroups(savedGroups);
        else {
          const localGroups = localStorage.getItem(GROUPS_KEY);
          if (localGroups) setGroups(JSON.parse(localGroups));
        }

        if (savedChats) setChats(savedChats);
        else {
          const localChats = localStorage.getItem(CHATS_KEY);
          if (localChats) setChats(JSON.parse(localChats));
        }
      } catch (e) {
        console.error('Failed to load friends data:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  const saveGroups = async (newGroups: GroupChat[]) => {
    setGroups(newGroups);
    await set(GROUPS_KEY, newGroups).catch(console.error);
  };

  const addGroupChat = (memberIds: string[], customName?: string) => {
    const memberNames = friends.filter(f => memberIds.includes(f.id)).map(f => f.name);
    const name = customName || (memberNames.slice(0, 3).join('、') + (memberNames.length > 3 ? '等' : '') + '的群聊');
    const avatar = friends.find(f => f.id === memberIds[0])?.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=group';
    const newGroup: GroupChat = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      memberIds,
      avatar,
      createdAt: Date.now(),
      lastMessage: '群聊已创建，开始聊天吧',
      lastTime: formatMessageTimestamp(Date.now())
    };
    saveGroups([newGroup, ...groups]);
    return newGroup.id;
  };

  const updateGroupChat = (id: string, updates: Partial<GroupChat>) => {
    const newGroups = groups.map(g => g.id === id ? { ...g, ...updates } : g);
    saveGroups(newGroups);
  };

  const deleteGroupChat = (id: string) => {
    const newGroups = groups.filter(g => g.id !== id);
    saveGroups(newGroups);
    const newChats = { ...chats };
    delete newChats[id];
    setChats(newChats);
    set(CHATS_KEY, newChats).catch(console.error);
  };

  const addGroupMessage = (groupId: string, message: ChatMessage) => {
    setChats(prevChats => {
      const newChats = {
        ...prevChats,
        [groupId]: [...(prevChats[groupId] || []), message]
      };
      set(CHATS_KEY, newChats).catch(console.error);
      return newChats;
    });

    setGroups(prevGroups => {
      const newGroups = prevGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            lastMessage: message.content,
            lastTime: formatMessageTimestamp(message.timestamp)
          };
        }
        return g;
      });
      set(GROUPS_KEY, newGroups).catch(console.error);
      return newGroups;
    });
  };

  const updateGroupMessage = (groupId: string, messageIndex: number, updates: Partial<ChatMessage>) => {
    setChats(prevChats => {
      const groupChats = prevChats[groupId] || [];
      if (messageIndex >= 0 && messageIndex < groupChats.length) {
        const updatedChats = [...groupChats];
        updatedChats[messageIndex] = { ...updatedChats[messageIndex], ...updates };
        const newChats = {
          ...prevChats,
          [groupId]: updatedChats
        };
        set(CHATS_KEY, newChats).catch(console.error);
        return newChats;
      }
      return prevChats;
    });
  };

  const importGroupMessages = (groupId: string, messages: ChatMessage[]) => {
    setChats(prevChats => {
      const newChats = {
        ...prevChats,
        [groupId]: messages
      };
      set(CHATS_KEY, newChats).catch(console.error);
      return newChats;
    });
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      setGroups(prevGroups => {
        const newGroups = prevGroups.map(g => {
          if (g.id === groupId) {
            return {
              ...g,
              lastMessage: lastMsg.content,
              lastTime: formatMessageTimestamp(lastMsg.timestamp)
            };
          }
          return g;
        });
        set(GROUPS_KEY, newGroups).catch(console.error);
        return newGroups;
      });
    }
  };

  const saveUser = async (newUser: UserProfile) => {
    setUser(newUser);
    await set(USER_PROFILE_KEY, newUser).catch(console.error);
  };

  const saveFriends = async (newFriends: Friend[]) => {
    setFriends(newFriends);
    await set(FRIENDS_KEY, newFriends).catch(console.error);
  };

  const saveChats = async (newChats: Record<string, ChatMessage[]>) => {
    setChats(newChats);
    await set(CHATS_KEY, newChats).catch(console.error);
  };

  const updateUser = (updates: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)) => {
    setUser(prevUser => {
      const newUpdates = typeof updates === 'function' ? updates(prevUser) : updates;
      const newUser = { ...prevUser, ...newUpdates };
      set(USER_PROFILE_KEY, newUser).catch(console.error);
      return newUser;
    });
  };

  const addFriend = (friend: Omit<Friend, 'id' | 'lastMessage' | 'lastTime' | 'createdAt'>) => {
    const newFriend: Friend = {
      ...friend,
      id: `friend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastMessage: '刚刚添加了你',
      lastTime: formatMessageTimestamp(Date.now())
    };
    saveFriends([newFriend, ...friends]);
  };

  const deleteFriend = (id: string) => {
    const newFriends = friends.filter(f => f.id !== id);
    saveFriends(newFriends);
    
    const newChats = { ...chats };
    delete newChats[id];
    saveChats(newChats);
  };

  const updateFriend = (id: string, updates: Partial<Friend>) => {
    const newFriends = friends.map(f => {
      if (f.id === id) {
        const newFriend = { ...f, ...updates };
        // If offline messages are updated, update the last message preview to the last offline message
        if (updates.isOfflineMode && updates.currentOfflineMessages && updates.currentOfflineMessages.length > 0) {
          const lastOffline = updates.currentOfflineMessages[updates.currentOfflineMessages.length - 1];
          newFriend.lastMessage = lastOffline.content;
          newFriend.lastTime = formatMessageTimestamp(lastOffline.timestamp);
        } else if (updates.isOfflineMode === false) {
          // If exiting offline mode, we might want to revert to the last real message?
          // For now, let's keep the last offline message as the preview if that was the most recent interaction
        }
        return newFriend;
      }
      return f;
    });
    saveFriends(newFriends);
  };

  const toggleBlock = (id: string) => {
    const newFriends = friends.map(f => f.id === id ? { ...f, isBlocked: !f.isBlocked } : f);
    saveFriends(newFriends);
  };

  const addMessage = (friendId: string, message: ChatMessage) => {
    setChats(prevChats => {
      const newChats = {
        ...prevChats,
        [friendId]: [...(prevChats[friendId] || []), message]
      };
      set(CHATS_KEY, newChats).catch(console.error);
      return newChats;
    });
    
    setFriends(prevFriends => {
      const newFriends = prevFriends.map(f => {
        if (f.id === friendId) {
          return {
            ...f,
            lastMessage: message.content,
            lastTime: formatMessageTimestamp(message.timestamp)
          };
        }
        return f;
      });
      set(FRIENDS_KEY, newFriends).catch(console.error);
      return newFriends;
    });

    window.dispatchEvent(new CustomEvent('zhouzhou_ji_chats_updated', { detail: { friendId, message } }));
  };

  const updateMessage = (friendId: string, messageIndex: number, updates: Partial<ChatMessage>) => {
    setChats(prevChats => {
      const friendChats = prevChats[friendId] || [];
      if (messageIndex >= 0 && messageIndex < friendChats.length) {
        const updatedChats = [...friendChats];
        updatedChats[messageIndex] = { ...updatedChats[messageIndex], ...updates };
        const newChats = {
          ...prevChats,
          [friendId]: updatedChats
        };
        set(CHATS_KEY, newChats).catch(console.error);
        return newChats;
      }
      return prevChats;
    });
  };

  const importMessages = (friendId: string, messages: ChatMessage[]) => {
    setChats(prevChats => {
      const newChats = {
        ...prevChats,
        [friendId]: messages
      };
      set(CHATS_KEY, newChats).catch(console.error);
      return newChats;
    });
    
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      setFriends(prevFriends => {
        const newFriends = prevFriends.map(f => {
          if (f.id === friendId) {
            return {
              ...f,
              lastMessage: lastMsg.content,
              lastTime: formatMessageTimestamp(lastMsg.timestamp)
            };
          }
          return f;
        });
        set(FRIENDS_KEY, newFriends).catch(console.error);
        return newFriends;
      });
    }
  };

  useEffect(() => {
    const handleDataImported = async () => {
      const savedUser = await get(USER_PROFILE_KEY);
      if (savedUser) setUser(savedUser);
      
      const savedFriends = await get(FRIENDS_KEY);
      if (savedFriends) setFriends(savedFriends);
      
      const savedChats = await get(CHATS_KEY);
      if (savedChats) setChats(savedChats);
    };
    window.addEventListener('data-imported', handleDataImported);
    return () => window.removeEventListener('data-imported', handleDataImported);
  }, []);

  const addFavorite = (fav: FavoriteMessage) => {
    const newFavorites = [...(user.favorites || []), fav];
    updateUser({ favorites: newFavorites });
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    if (transaction.paymentMethodId && transaction.paymentMethodId !== 'wallet') {
      // Update bank card balance
      updateBankCardBalance(transaction.paymentMethodId, transaction.amount, transaction.type === 'topup' || transaction.type === 'transfer-in');
      updateUser(prevUser => ({ transactions: [newTransaction, ...(prevUser.transactions || [])] }));
    } else {
      // Update wallet balance
      updateUser(prevUser => {
        let newBalance = prevUser.balance || 0;
        if (transaction.type === 'topup' || transaction.type === 'transfer-in') {
          newBalance += transaction.amount;
        } else {
          newBalance -= transaction.amount;
        }
        return { 
          transactions: [newTransaction, ...(prevUser.transactions || [])],
          balance: newBalance
        };
      });
    }
  };

  const updateBankCardBalance = (cardId: string, amount: number, isAddition: boolean) => {
    updateUser(prevUser => {
      const newCards = (prevUser.bankCards || []).map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            balance: isAddition ? card.balance + amount : card.balance - amount
          };
        }
        return card;
      });
      return { bankCards: newCards };
    });
  };

  const addMoment = (content: string, images?: string[], location?: string, visibility: 'public' | 'selected' | 'excluded' = 'public', visibleTo?: string[], hiddenFrom?: string[], authorId: string = 'user', isTextCard?: boolean, imageDescription?: string) => {
    const allParticipantIds = ['user', ...friends.map(f => f.id)].filter(id => id !== authorId);
    const newMoment: MomentPost = {
      id: `moment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      content,
      images,
      location,
      visibility,
      visibleTo,
      hiddenFrom,
      likes: allParticipantIds,
      comments: [],
      timestamp: Date.now(),
      isTextCard,
      imageDescription
    };
    
    if (authorId === 'user') {
      const newMoments = [newMoment, ...(user.moments || [])];
      updateUser({ moments: newMoments });
    } else {
      const newFriends = friends.map(f => {
        if (f.id === authorId) {
          return { ...f, moments: [newMoment, ...(f.moments || [])] };
        }
        return f;
      });
      saveFriends(newFriends);
    }
    return newMoment;
  };

  const toggleLikeMoment = (momentId: string, authorId: string) => {
    if (authorId === 'user') {
      const newMoments = (user.moments || []).map(m => {
        if (m.id === momentId) {
          const hasLiked = (m.likes || []).includes('user');
          return {
            ...m,
            likes: hasLiked ? m.likes.filter(id => id !== 'user') : [...m.likes, 'user']
          };
        }
        return m;
      });
      updateUser({ moments: newMoments });
    } else {
      const newFriends = friends.map(f => {
        if (f.id === authorId) {
          const newMoments = (f.moments || []).map(m => {
            if (m.id === momentId) {
              const hasLiked = (m.likes || []).includes('user');
              return {
                ...m,
                likes: hasLiked ? m.likes.filter(id => id !== 'user') : [...m.likes, 'user']
              };
            }
            return m;
          });
          return { ...f, moments: newMoments };
        }
        return f;
      });
      saveFriends(newFriends);
    }
  };

  const addCommentToMoment = (momentId: string, authorId: string, comment: { authorId: string, authorName: string, content: string, replyToId?: string, replyToName?: string }) => {
    const newComment = {
      ...comment,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      replies: []
    };

    const processComments = (comments: any[]) => {
      if (comment.replyToId) {
        return comments.map(c => {
          if (c.id === comment.replyToId) {
            const replies = c.replies || [];
            if (replies.some((r: any) => r.authorId === comment.authorId)) {
              return c; // 限制回楼回复一条
            }
            return {
              ...c,
              replies: [...replies, newComment]
            };
          }
          return c;
        });
      } else {
        if (comments.some((c: any) => c.authorId === comment.authorId)) {
          return comments; // 限制角色们互相评论一条
        }
        return [...comments, newComment];
      }
    };

    if (authorId === 'user') {
      const newMoments = (user.moments || []).map(m => {
        if (m.id === momentId) {
          return { ...m, comments: processComments(m.comments || []) };
        }
        return m;
      });
      updateUser({ moments: newMoments });
    } else {
      const newFriends = friends.map(f => {
        if (f.id === authorId) {
          const newMoments = (f.moments || []).map(m => {
            if (m.id === momentId) {
              return { ...m, comments: processComments(m.comments || []) };
            }
            return m;
          });
          return { ...f, moments: newMoments };
        }
        return f;
      });
      saveFriends(newFriends);
    }
    return newComment;
  };

  const deleteMoment = (momentId: string, authorId: string) => {
    if (authorId === 'user') {
      const newMoments = (user.moments || []).filter(m => m.id !== momentId);
      updateUser({ moments: newMoments });
    } else {
      const newFriends = friends.map(f => {
        if (f.id === authorId) {
          const newMoments = (f.moments || []).filter(m => m.id !== momentId);
          return { ...f, moments: newMoments };
        }
        return f;
      });
      saveFriends(newFriends);
    }
  };

  const updateFriendMomentsSettings = (friendId: string, settings: Partial<Friend['momentsSettings']>) => {
    const newFriends = friends.map(f => {
      if (f.id === friendId) {
        return {
          ...f,
          momentsSettings: {
            ...(f.momentsSettings || { autoPostEnabled: false, frequency: 1, scheduledTimes: [] }),
            ...settings
          }
        };
      }
      return f;
    });
    saveFriends(newFriends);
  };

  const getAllMoments = () => {
    const userMoments = (user?.moments || []).map(m => ({ ...m, authorName: user?.name || '我', authorAvatar: user?.avatar || '' }));
    const friendMoments = (friends || []).flatMap(f => 
      (f?.moments || []).map(m => ({ ...m, authorName: f?.name || '好友', authorAvatar: f?.avatar || '' }))
    );
    
    return [...userMoments, ...friendMoments].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));
  };

  const addBankCard = (card: Omit<BankCard, 'id'>) => {
    const newCard: BankCard = {
      ...card,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const newCards = [...(user.bankCards || []), newCard];
    updateUser({ bankCards: newCards });
  };

  const deleteBankCard = (id: string) => {
    const newCards = (user.bankCards || []).filter(c => c.id !== id);
    updateUser({ bankCards: newCards });
  };

  const updateBankCard = (id: string, updates: Partial<BankCard>) => {
    const newCards = (user.bankCards || []).map(c => c.id === id ? { ...c, ...updates } : c);
    updateUser({ bankCards: newCards });
  };

  const removeFavorite = (id: string) => {
    const newFavorites = (user.favorites || []).filter(f => f.id !== id);
    updateUser({ favorites: newFavorites });
  };

  const addPersona = (persona: Omit<UserPersona, 'id'>) => {
    const newPersona: UserPersona = {
      ...persona,
      id: `persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const newPersonas = [...(user.personas || []), newPersona];
    updateUser({ personas: newPersonas });
  };

  const updatePersona = (id: string, updates: Partial<UserPersona>) => {
    const newPersonas = (user.personas || []).map(p => p.id === id ? { ...p, ...updates } : p);
    updateUser({ personas: newPersonas });
  };

  const deletePersona = (id: string) => {
    const newPersonas = (user.personas || []).filter(p => p.id !== id);
    const updates: Partial<UserProfile> = { personas: newPersonas };
    if (user.activePersonaId === id) {
      updates.activePersonaId = undefined;
    }
    updateUser(updates);
  };

  const togglePersona = (id: string) => {
    const newPersonas = (user.personas || []).map(p => p.id === id ? { ...p, isEnabled: !p.isEnabled } : p);
    updateUser({ personas: newPersonas });
  };

  return { 
    user, 
    updateUser, 
    friends, 
    groups,
    chats, 
    addFriend, 
    deleteFriend, 
    updateFriend, 
    toggleBlock, 
    addMessage, 
    updateMessage,
    importMessages, 
    addGroupChat,
    updateGroupChat,
    deleteGroupChat,
    addGroupMessage,
    updateGroupMessage,
    importGroupMessages,
    isLoaded,
    addFavorite,
    removeFavorite,
    addPersona,
    updatePersona,
    deletePersona,
    togglePersona,
    addTransaction,
    updateBankCardBalance,
    addMoment,
    deleteMoment,
    toggleLikeMoment,
    addCommentToMoment,
    updateFriendMomentsSettings,
    getAllMoments,
    addBankCard,
    deleteBankCard,
    updateBankCard
  };
}
