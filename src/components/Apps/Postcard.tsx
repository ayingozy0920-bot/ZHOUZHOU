import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Trash2, Edit3, Image as ImageIcon, Link as LinkIcon, X, Upload } from 'lucide-react';

interface PostcardProps {
  postcard: {
    id: string;
    friendId: string;
    summary: string;
    photoUrl: string;
    date: string;
    theme: string;
  };
  onDelete?: () => void;
  onUpdate?: (updated: any) => void;
}

const Postcard: React.FC<PostcardProps> = ({ 
  postcard,
  onDelete,
  onUpdate
}) => {
  const { summary, photoUrl, date } = postcard;
  const characterName = ""; // We can derive this if needed, but for now we use the props from postcard
  const [showImageModal, setShowImageModal] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const onChangeImage = (newUrl: string) => {
    if (onUpdate) {
      onUpdate({ ...postcard, photoUrl: newUrl });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Postcard Body */}
      <div className="bg-white shadow-2xl rounded-sm p-8 aspect-[1.6/1] w-full max-w-2xl mx-auto flex flex-col relative border border-slate-100">
        {/* Stamp Area / Date Time */}
        <div className="absolute top-6 right-8 flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-5 h-7 border border-slate-200 rounded-sm bg-slate-50/50" />
            ))}
          </div>
          <div className="text-[10px] font-serif text-slate-400 font-bold tracking-wider">
            {date}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 flex gap-8 mt-4">
          {/* Left Side: Text Lines */}
          <div className="flex-[1.2] flex flex-col justify-start">
            <div className="relative w-full h-full">
              {/* Decorative Lines */}
              <div className="absolute inset-0 flex flex-col pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="border-b border-slate-200 h-8 w-full" />
                ))}
              </div>
              {/* Actual Text */}
              <div className="relative z-10 text-slate-600 font-serif text-[11px] leading-[2rem] px-1 pt-1 overflow-y-auto max-h-[384px] custom-scrollbar">
                {summary}
              </div>
            </div>
          </div>

          {/* Middle Divider */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-[1px] h-full bg-slate-200 relative">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white py-4 text-[10px] font-serif text-slate-400 tracking-[0.5em] uppercase rotate-90 whitespace-nowrap">
                LEAVE
              </span>
            </div>
          </div>

          {/* Right Side: Photo */}
          <div className="flex-[1.2] flex flex-col items-center justify-center gap-4">
            <div 
              className="relative aspect-[3/4] w-full shadow-2xl group/photo overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 border-[10px] border-slate-900 z-10 pointer-events-none" />
              <img 
                src={photoUrl} 
                alt="Date Moment" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110 cursor-pointer"
                referrerPolicy="no-referrer"
                onClick={() => setShowZoom(true)}
              />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20">
                <span className="text-[8px] text-white/90 font-serif tracking-[0.2em] uppercase drop-shadow-md">
                  MEMORIES © 2026
                </span>
              </div>
              
              {/* Change Image Overlay */}
              <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(true);
                  }}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 font-serif text-[10px] tracking-wider">
            If parting has no meaning, then what is the significance of meeting
          </p>
        </div>

        {/* Metadata Overlay (Optional, for UI) */}
        <div className="absolute top-4 left-6 flex flex-col">
          <div className="w-12 h-16 border-2 border-slate-100 rounded-sm mb-2" />
          <span className="text-[10px] font-serif text-slate-300 uppercase tracking-tighter">{characterName} · {date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button 
          onClick={onDelete}
          className="p-3 bg-white/80 backdrop-blur-md shadow-lg rounded-full text-rose-400 hover:bg-rose-50 transition-colors border border-rose-100"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {showZoom && (
          <div 
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowZoom(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-full flex items-center justify-center"
            >
              <img 
                src={photoUrl} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setShowZoom(false)}
                className="absolute -top-12 right-0 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Image Change Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">更换约会照片</h3>
                <button onClick={() => setShowImageModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Upload Option */}
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onChangeImage) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            onChangeImage(event.target.result as string);
                            setShowImageModal(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border-2 border-dashed border-rose-200 group-hover:bg-rose-100 transition-colors">
                    <div className="w-10 h-10 bg-rose-400 rounded-xl flex items-center justify-center text-white">
                      <Upload size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-rose-600">从相册上传</div>
                      <div className="text-[10px] text-rose-400">选择手机里的珍贵瞬间</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase">或者</span>
                  <div className="h-[1px] flex-1 bg-slate-100" />
                </div>

                {/* URL Option */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <LinkIcon size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="输入图床 URL..."
                      className="flex-1 bg-transparent border-none outline-none text-xs text-slate-600"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (tempUrl.trim() && onChangeImage) {
                        onChangeImage(tempUrl.trim());
                        setShowImageModal(false);
                        setTempUrl('');
                      }
                    }}
                    className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-200"
                  >
                    确认保存
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Postcard;
