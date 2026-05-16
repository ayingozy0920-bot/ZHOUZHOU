import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { ReceivedGift } from '../types';

const GIFTS_KEY = 'zhouzhou_ji_gifts';

export function useGifts() {
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);

  const loadGifts = async () => {
    const val = await get(GIFTS_KEY);
    if (val) setGifts(val);
  };

  useEffect(() => {
    loadGifts();

    const handleSync = () => {
      loadGifts();
    };

    window.addEventListener('zhouzhou_ji_gifts_updated', handleSync);
    return () => {
      window.removeEventListener('zhouzhou_ji_gifts_updated', handleSync);
    };
  }, []);

  const addGift = async (gift: ReceivedGift) => {
    const newGifts = [gift, ...gifts];
    setGifts(newGifts);
    await set(GIFTS_KEY, newGifts);
    window.dispatchEvent(new Event('zhouzhou_ji_gifts_updated'));
  };

  const removeGift = async (id: string) => {
    const newGifts = gifts.filter(g => g.id !== id);
    setGifts(newGifts);
    await set(GIFTS_KEY, newGifts);
    window.dispatchEvent(new Event('zhouzhou_ji_gifts_updated'));
  };

  return { gifts, addGift, removeGift };
}
