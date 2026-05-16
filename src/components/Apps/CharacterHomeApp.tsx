import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface CharacterHomeAppProps {
  settings: any;
  friends: any[];
  onBack: () => void;
}

const CharacterHomeApp: React.FC<CharacterHomeAppProps> = ({ onBack }) => {
  return (
    <div className="w-full h-full bg-slate-50 flex flex-col">
      <div className="p-4 flex items-center bg-white border-b border-slate-200">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-2 font-bold text-lg">休息室</h1>
      </div>
      <div className="flex-1 flex items-center justify-center text-slate-500">
        休息室正在开发中...
      </div>
    </div>
  );
};

export default CharacterHomeApp;