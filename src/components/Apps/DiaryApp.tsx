import React, { useState } from 'react';
import { AppSettings } from '../../types';
import DiaryHome from './Diary/DiaryHome';
import DiaryBook from './Diary/DiaryBook';
import { Friend } from '../../types';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

export default function DiaryApp({ settings, onSave, onBack }: Props) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  
  if (selectedFriend) {
    return <DiaryBook settings={settings} friend={selectedFriend} onSave={onSave} onBack={() => setSelectedFriend(null)} />;
  }

  return (
    <DiaryHome settings={settings} onSave={onSave} onBack={onBack} onSelectFriend={setSelectedFriend} />
  );
}
