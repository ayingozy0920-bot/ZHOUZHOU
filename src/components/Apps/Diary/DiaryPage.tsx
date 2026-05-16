import React, { useState } from 'react';
import { AppSettings, Friend } from '../../../types';
import { set } from 'idb-keyval';

interface Props {
  settings: AppSettings;
  friend: Friend;
  date: string;
  content: string;
  onComment: (comment: string) => void;
}

export default function DiaryPage({ settings, friend, date, content, onComment }: Props) {
  const [comment, setComment] = useState('');

  const handleAddComment = () => {
    if (!comment.trim()) return;
    set(`diary_comment_${friend.id}_${date}`, comment);
    onComment(comment);
    setComment('');
    alert("你偷看我的日记啦～"); // Placeholder for chat interaction
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl p-6 shadow-sm overflow-y-auto">
      <div className="flex-1 space-y-4">
        <h2 className="font-bold text-xl text-pink-400">【日记 · {date}】</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={comment} 
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下你的评语..."
          className="flex-1 p-2 bg-slate-50 rounded-lg text-sm"
        />
        <button 
          onClick={handleAddComment}
          className="px-4 py-2 bg-pink-400 text-white rounded-lg text-sm"
        >
          提交
        </button>
      </div>
    </div>
  );
}
