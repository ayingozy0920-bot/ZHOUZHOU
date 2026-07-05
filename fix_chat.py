
import sys
import re

path = 'src/components/Apps/Chat.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Reconstruct the missing/mangled pieces
fixed_section = """
                ) : isEditingLanguage ? (
                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="例如：普通话、粤语、英语、日语、韩语..."
                      className={cn(
                        "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                      )}
                    />
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className={cn(
                      "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                    )}
                  />
                )}
                {!isEditingVoice && (
                  <button 
                    onClick={() => {
                      if (isEditingAlias) saveEdit('alias');
                      if (isEditingPersona) saveEdit('persona');
                      if (isEditingAddress) saveEdit('address');
                      if (isEditingLanguage) saveEdit('language');
                    }}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-bold active:scale-95 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-green-600 text-white"
                    )}
                  >
                    保存修改
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FriendMoments({ 
  friend, settings, user, friends, onBack, onUpdateBackground, onToggleLike, onAddComment 
}: { 
  friend: Friend, 
  settings: AppSettings, 
  user: any,
  friends: Friend[],
  onBack: () => void, 
  onUpdateBackground: (url: string) => void,
  onToggleLike: (momentId: string, authorId: string) => void,
  onAddComment: (momentId: string, authorId: string, comment: any) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  const handleBgClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendComment = (momentId: string, authorId: string) => {
    if (!commentText.trim()) return;
    const comment = { authorId: 'user', authorName: user?.name ?? '用户', content: commentText, replyToId: replyTo?.id, replyToName: replyTo?.name };
    onAddComment(momentId, authorId, comment);
    setCommentText(''); setActiveCommentId(null); setReplyTo(null);
  };

  return (
    <div className={cn("flex flex-col h-full relative transition-all duration-500", settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-white")}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="p-1.5 rounded-full pointer-events-auto bg-black/20 text-white"><ChevronLeft size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 mb-12">
          <img src={friend.momentsBackground || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000'} className="w-full h-full object-cover cursor-pointer" onClick={handleBgClick} />
          <div className="absolute bottom-[-20px] right-4 flex items-center gap-3">
            <span className="text-white font-bold drop-shadow-md text-sm mb-4">{friend?.alias || friend?.name || '角色'}</span>
            <img src={friend.avatar} className="w-16 h-16 rounded-xl border-2 border-white bg-slate-200 shadow-lg object-cover" />
          </div>
        </div>
        <div className="px-4 space-y-8 pb-10">
          {friend.moments && friend.moments.length > 0 ? friend.moments.map((post, idx) => (
            <div key={`${post.id}-${idx}`} className="flex gap-3">
              <img src={friend.avatar} className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-sm block mb-1 text-blue-900">{friend?.alias || friend?.name || '角色'}</span>
                <p className="text-sm mb-2 text-slate-800">{post.content}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>{new Date(post.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )) : <div className="text-center py-20 text-slate-400">暂无动态</div>}
        </div>
      </div>
    </div>
  );
}

function DiscoverTab({ 
  user, friends, onUpdate, settings, getAllMoments, onToggleLike, onAddComment, onDeleteMoment, onShowMemoryApp 
}: { 
  user: any, friends: Friend[], onUpdate: (updates: any) => void, settings: AppSettings, getAllMoments: () => any[],
  onToggleLike: (momentId: string, authorId: string) => void, onAddComment: (momentId: string, authorId: string, comment: any) => void,
  onDeleteMoment: (momentId: string, authorId: string) => void, onShowMemoryApp: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const moments = getAllMoments() || [];

  const handleBgClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ momentsBackground: reader.result as string });
      reader.readAsDataURL(file);
    }
  };
  const handleSendComment = (momentId: string, authorId: string) => {
    if (!commentText.trim()) return;
    onAddComment(momentId, authorId, { authorId: 'user', authorName: user?.name ?? '用户', content: commentText, replyToId: replyTo?.id, replyToName: replyTo?.name });
    setCommentText(''); setActiveCommentId(null); setReplyTo(null);
  };

  return (
    <div className={cn("h-full flex flex-col transition-all duration-500", settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-100")}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="relative h-64">
          <img src={user.momentsBackground || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000'} className="w-full h-full object-cover cursor-pointer" onClick={handleBgClick} />
          <div className="absolute bottom-[-20px] right-4 flex items-center gap-3 z-10">
            <span className="text-white font-bold drop-shadow-lg text-base mb-4">{user?.name ?? '用户'}</span>
            <img src={user.avatar} className="w-16 h-16 rounded-xl border-4 border-white bg-slate-200 object-cover shadow-md" />
          </div>
        </div>
        <div className="bg-white pt-12 pb-20">
          {moments.map((moment, idx) => (
            <div key={`${moment.id}-${idx}`} className="p-4 flex gap-3 border-b border-slate-50">
              <img src={moment.authorAvatar} className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-sm block mb-1 text-blue-900">{moment.authorName}</span>
                <p className="text-sm mb-2 text-slate-800">{moment.content}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                  <span>{new Date(moment.timestamp).toLocaleString()}</span>
                  <button onClick={() => setActiveCommentId(moment.id)} className="p-1 rounded bg-slate-100"><MessageSquare size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"""

# Pattern to find the start of the mess (isEditingPersona textarea area)
start_marker = r'isEditingPersona \? \('
# Pattern to find the start of MeTab
end_marker = r'function MeTab'

# Use re.DOTALL to match across multiple lines
pattern = re.compile(re.escape('isEditingPersona ? (') + r'.*?' + re.escape('function MeTab'), re.DOTALL)

# We need to find the start of the first match and the start of the second marker
match = pattern.search(content)
if match:
    # We want to replace from 'isEditingPersona ? (' to 'function MeTab'
    # but the regex might be too greedy or match wrong things.
    # Let's use indices.
    start_pos = match.start()
    end_pos = content.find('function MeTab', start_pos)
    
    new_content = content[:start_pos] + "isEditingPersona ? (" + fixed_section + "\n" + content[end_pos:]
    
    with open('src/components/Apps/Chat.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("File successfully fixed.")
else:
    print("Could not find markers to fix the file.")
    sys.exit(1)
