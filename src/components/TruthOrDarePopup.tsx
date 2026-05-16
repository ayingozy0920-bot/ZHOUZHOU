import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { categories } from '../data/truthOrDareQuestions';
import { ChatMessage, Friend } from '../types';
import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
  onSendMessage: (msg: ChatMessage) => void;
  friend: Friend;
}

const DiceIcon = ({ value }: { value: number }) => {
  const dots = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };
  return (
    <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-200 grid grid-cols-3 gap-1 p-1.5">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`rounded-full ${dots[value as keyof typeof dots]?.includes(i) ? 'bg-slate-800' : 'bg-transparent'}`} />
      ))}
    </div>
  );
};

export const TruthOrDarePopup: React.FC<Props> = ({ onClose, onSendMessage, friend }) => {
  const [userDice, setUserDice] = useState<number | null>(null);
  const [aiDice, setAiDice] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = async () => {
    setIsRolling(true);
    
    // Simulate a roll result
    const u = Math.floor(Math.random() * 6) + 1;
    const a = Math.floor(Math.random() * 6) + 1;
    
    // Send dice message to chat
    onSendMessage({
      role: 'user',
      content: u.toString(),
      timestamp: Date.now(),
      type: 'dice'
    });
    onSendMessage({
      role: 'assistant',
      content: a.toString(),
      timestamp: Date.now(),
      type: 'dice'
    });
    
    setUserDice(u);
    setAiDice(a);
    setIsRolling(false);
  };

  const sendQuestion = (question: string) => {
    onSendMessage({
      role: 'user',
      content: `真心话问题：${question}`,
      timestamp: Date.now(),
      type: 'text'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">真心话大冒险</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r p-4 flex flex-col items-center justify-center gap-4 bg-slate-50">
            <button onClick={rollDice} disabled={isRolling} className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition disabled:opacity-50">
              掷骰子
            </button>
            <div className="flex flex-col gap-2 items-center">
              {userDice && <DiceIcon value={userDice} />}
              <span className="text-xs text-slate-500">我</span>
            </div>
            <div className="flex flex-col gap-2 items-center">
              {aiDice && <DiceIcon value={aiDice} />}
              <span className="text-xs text-slate-500">{friend.name}</span>
            </div>
            {userDice && aiDice && !isRolling && (
              <div className="font-bold text-lg mt-2">
                {userDice > aiDice ? '你赢了！' : userDice < aiDice ? `${friend.name} 赢了` : '平局'}
              </div>
            )}
          </div>
          <div className="w-2/3 overflow-y-auto p-4">
            {categories.map(cat => (
              <div key={cat.id} className="mb-2">
                <button 
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  className="w-full text-left font-semibold p-2 bg-gray-100 rounded text-sm"
                >
                  {cat.name}
                </button>
                {expandedCategory === cat.id && (
                  <ul className="mt-2 space-y-1">
                    {cat.questions.map((q, i) => (
                      <li key={`${cat.id}-${i}`} onClick={() => sendQuestion(q)} className="p-2 text-sm hover:bg-pink-50 cursor-pointer rounded border-b border-slate-50">
                        {q}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
