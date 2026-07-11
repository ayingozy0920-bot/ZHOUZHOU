import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ListTodo, Cloud, Sun, ChevronLeft, MoreVertical, RefreshCw, Plus, ChevronRight, X } from 'lucide-react';
import { AppSettings, Friend } from '../../types';
import { cn } from '../../lib/utils';
import { get, set } from 'idb-keyval';
import { apiFetch } from '../../lib/apiHelper';

interface ScheduleItem {
  time: string;
  task: string;
}

interface CharacterSchedule {
  friendId: string;
  date: string;
  items: ScheduleItem[];
}

export default function CalendarApp({ 
  settings, 
  onBack, 
  friends,
  onUpdateSettings,
  onUpdateFriend
}: { 
  settings: AppSettings; 
  onBack: () => void; 
  friends: Friend[];
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onUpdateFriend: (id: string, updates: Partial<Friend>) => void;
}) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'schedule'>('calendar');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [schedules, setSchedules] = useState<Record<string, CharacterSchedule>>({});
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Weather state
  const [city, setCity] = useState(settings.calendarCity || '上海');
  const [weather, setWeather] = useState({ temp: 22, condition: '晴朗' });
  const [showCityModal, setShowCityModal] = useState(false);
  const [tempCity, setTempCity] = useState(city);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const dateString = today.toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSchedules = await get('character_schedules') || {};
        const savedTemplates = await get('schedule_templates') || {};
        const savedWeather = await get('calendar_weather');
        
        setSchedules(savedSchedules);
        setTemplates(savedTemplates);
        if (savedWeather) setWeather(savedWeather);
      } catch (error) {
        console.error("Failed to load calendar data:", error);
      }
    };
    loadData();
  }, []);

  const fetchWeather = async (cityName: string) => {
    try {
      const prompt = `获取城市 "${cityName}" 的当前天气情况。
请返回一个 JSON 对象，包含以下字段：
- temp: 数字类型，当前的摄氏温度
- condition: 字符串类型，简短的天气描述（如：晴朗、多云、阴天、小雨、大雨、雪等）

只返回 JSON 代码块。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: "你是一个天气查询助手。请严格输出JSON格式的天气信息。",
          messages: [{ role: 'user', content: prompt }],
          settings
        }
      });

      let text = data.text || '';
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      const weatherData = JSON.parse(text);
      if (weatherData && typeof weatherData.temp === 'number' && weatherData.condition) {
        setWeather(weatherData);
        await set('calendar_weather', weatherData);
      }
    } catch (error) {
      console.error("Fetch weather error:", error);
    }
  };

  useEffect(() => {
    if (city) {
      fetchWeather(city);
    }
  }, [city]);

  const saveSchedules = async (newSchedules: Record<string, CharacterSchedule>) => {
    setSchedules(newSchedules);
    await set('character_schedules', newSchedules).catch(console.error);
  };

  const saveTemplates = async (newTemplates: Record<string, string>) => {
    setTemplates(newTemplates);
    await set('schedule_templates', newTemplates).catch(console.error);
  };

  const generateSchedule = async (friend: Friend) => {
    setIsGenerating(true);
    try {
      const template = templates[friend.id] || "常规日程";
      
      // Load user profile & recent chat history for context
      let userName = '用户';
      let chatContextSummary = '';
      try {
        const userProfile = await get('zhouzhou_ji_user_profile');
        if (userProfile?.name) userName = userProfile.name;
        const allChats = await get('zhouzhou_ji_chats') || {};
        const chatHistory = (allChats[friend.id] || []).slice(-10);
        if (chatHistory.length > 0) {
          chatContextSummary = chatHistory.map((m: any) => `${m.role === 'user' ? userName : friend.name}: ${m.content || m.parts?.[0]?.text || ''}`).join('\n');
        }
      } catch (e) {
        console.warn("Failed to load context for schedule:", e);
      }

      const prompt = `请扮演角色：${friend.name}。
角色档案与人设：${friend.persona || '性格正常，生活规律'}
用户称呼：${userName}
近期与用户的互动上下文：
${chatContextSummary || '暂无近期对话记录'}

参考日程主题或方向：${template}

请结合角色的性格人设、近期互动背景，以及符合正常人作息的生活规律，生成一份今天的详细日程安排（从早到晚 6-10 个时间点）。
要求：
1. 以第三人称客观描述角色的日常生活行为与作息安排（如工作、用餐、休息、日常事务或与用户的正常互动），重点体现行为活动与生活节奏，不过多渲染或描写内心心理活动。
2. 语言表达要符合角色的身份与习惯。
3. 必须输出且仅输出纯 JSON 数组格式，每个对象包含 time (格式如 "09:00") 和 task (具体的行为动作描述)。
4. 不要包含任何 markdown 代码块标记以外的文字，只输出严格的 JSON。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: "你是一个专业的日程生活规划助手。请严格输出JSON数组格式的日程安排，不要有多余文字。",
          messages: [{ role: 'user', content: prompt }],
          settings
        }
      });

      let text = data.text || '';
      
      // Clean up markdown code blocks if any
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      if (!text) {
        throw new Error("AI 未返回内容。");
      }
      
      const items = JSON.parse(text);
      if (Array.isArray(items)) {
        const newSchedules = {
          ...schedules,
          [friend.id]: {
            friendId: friend.id,
            date: dateString,
            items
          }
        };
        await saveSchedules(newSchedules);
      } else {
        throw new Error('Invalid JSON response format');
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isBlocked = errMsg.includes('PROHIBITED_CONTENT') || errMsg.includes('prompt_blocked') || errMsg.includes('safety') || errMsg.includes('blocked');
      if (isBlocked) {
        console.warn('Schedule generation safety block encountered, falling back to persona routine:', error);
      } else {
        console.warn('Generate schedule fallback triggered:', error);
      }
      
      const template = templates[friend.id] || "常规日程";
      const fallbackItems = [
        { time: "08:00", task: `${friend.name}的晨间签到与洗漱 (${template})` },
        { time: "10:00", task: "专注核心工作与日常事务推进" },
        { time: "12:30", task: "午餐时间与放松休憩" },
        { time: "15:00", task: "下午工作与协作交流" },
        { time: "18:30", task: "晚餐与休闲时间" },
        { time: "21:00", task: "夜间阅读与复盘总结" }
      ];
      const newSchedules = {
        ...schedules,
        [friend.id]: {
          friendId: friend.id,
          date: dateString,
          items: fallbackItems
        }
      };
      await saveSchedules(newSchedules);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    // Adjust for Monday start: Mon=1, ..., Sat=6, Sun=0
    // If Sun(0), we want 6 padding days. If Mon(1), 0. If Tue(2), 1.
    const paddingCount = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const padding = Array.from({ length: paddingCount }, () => null);
    const allDays = [...padding, ...days];

    const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    const isToday = (day: number) => {
      return day === today.getDate() && 
             month === today.getMonth() && 
             year === today.getFullYear();
    };

    const changeMonth = (offset: number) => {
      setCurrentMonth(new Date(year, month + offset, 1));
    };

    return (
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 hover:bg-pink-50 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-slate-800">日历</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Weather Module */}
        <div 
          onClick={() => { setTempCity(city); setShowCityModal(true); }}
          className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 flex items-center justify-between shadow-sm border border-white/20 cursor-pointer hover:bg-white/60 transition-all"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-pink-400">
              {today.getHours() > 18 || today.getHours() < 6 ? <Cloud size={20} /> : <Sun size={20} />}
              <span className="text-2xl font-black">{weather.temp}°C</span>
            </div>
            <p className="text-sm font-bold text-slate-500">{city} · {weather.condition}</p>
          </div>
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center shadow-inner">
            {today.getHours() > 18 || today.getHours() < 6 ? <Cloud className="text-pink-400" size={32} /> : <Sun className="text-pink-400" size={32} />}
          </div>
        </div>

        {showCityModal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">设置城市</h3>
                <button onClick={() => setShowCityModal(false)} className="text-slate-400"><X size={24} /></button>
              </div>
              <input 
                type="text"
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                placeholder="输入城市名称..."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-pink-300 transition-all"
              />
              <button 
                onClick={() => {
                  setCity(tempCity);
                  onUpdateSettings({ calendarCity: tempCity });
                  
                  // Update all friends to the same city by default
                  friends.forEach(f => {
                    onUpdateFriend(f.id, { address: tempCity });
                  });
                  
                  setShowCityModal(false);
                }}
                className="w-full py-4 bg-pink-400 text-white rounded-2xl font-black shadow-lg shadow-pink-200 active:scale-95 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="font-black text-slate-800">{year}年 {monthNames[month]}</h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-pink-50 rounded-full text-pink-400 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-pink-50 rounded-full text-pink-400 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-black text-pink-300 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 gap-x-2">
            {allDays.map((day, i) => (
              <div key={i} className="aspect-square flex items-center justify-center relative">
                {day && (
                  <div className={cn(
                    "w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold transition-all",
                    isToday(day) 
                      ? "bg-pink-400 text-white shadow-lg scale-110" 
                      : "text-slate-600 hover:bg-pink-50"
                  )}>
                    {day}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleList = () => {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600 hover:bg-pink-50 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-slate-800">通讯录日程</h2>
          <div className="w-10" />
        </div>
        
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 grid grid-cols-3 gap-6">
          {friends.map(friend => (
            <button 
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-[2rem] overflow-hidden shadow-md border-2 border-transparent group-hover:border-pink-300 transition-all relative">
                <img referrerPolicy="no-referrer"  src={friend.avatar} className="w-full h-full object-cover"  />
                {schedules[friend.id]?.date === dateString && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-600 truncate w-full text-center">{friend.name}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
              <Plus size={24} className="text-slate-400" />
            </div>
            <span className="text-xs font-bold text-slate-400">添加</span>
          </button>
        </div>
      </div>
    );
  };

  const renderFriendSchedule = (friend: Friend) => {
    const schedule = schedules[friend.id];
    const items = schedule?.items || [];

    return (
      <div className="absolute inset-0 z-50 bg-[#FFF5F7] flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <button onClick={() => setSelectedFriend(null)} className="p-2 bg-white rounded-full shadow-sm text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-800">{friend.name}的日程</h2>
            <span className="text-[10px] font-bold text-slate-400">{dateString}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setCurrentTemplate(templates[friend.id] || '');
                setShowTemplateModal(true);
              }}
              className="p-2 bg-white rounded-full shadow-sm text-slate-600"
            >
              <MoreVertical size={24} />
            </button>
            <button 
              onClick={() => generateSchedule(friend).catch(err => console.error('Schedule re-click error:', err))}
              disabled={isGenerating}
              className={cn(
                "p-2 bg-white rounded-full shadow-sm text-slate-600",
                isGenerating && "animate-spin"
              )}
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-4">
          <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 pl-2">
              <img referrerPolicy="no-referrer"  src={friend.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"  />
              <span className="text-sm font-black text-pink-400">今日安排</span>
            </div>
            <button 
              onClick={() => setShowTemplateModal(true)}
              className="bg-pink-400 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md"
            >
              自定义模板 <Plus size={12} />
            </button>
          </div>

          {items.length > 0 ? (
            items.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-white/50 group hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-400 group-hover:bg-pink-100 transition-colors">
                  <CalendarIcon size={20} />
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-sm font-black text-slate-400 w-12">{item.time}</span>
                  <span className="text-sm font-bold text-slate-700">{item.task}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-40">
              <CalendarIcon size={48} className="text-slate-400" />
              <p className="text-sm font-bold">暂无日程，点击刷新生成</p>
            </div>
          )}
        </div>

        {/* Template Modal */}
        <AnimatePresence>
          {showTemplateModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">自定义日程模板</h3>
                  <button onClick={() => setShowTemplateModal(false)} className="text-slate-400"><X size={24} /></button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  模板将作为 AI 生成日程的参考。您可以输入该角色每天的大致活动规律。
                </p>
                <textarea 
                  value={currentTemplate}
                  onChange={(e) => setCurrentTemplate(e.target.value)}
                  placeholder="例如：9:00 起床，10:00 工作，12:00 午餐..."
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-pink-300 transition-all resize-none"
                />
                <button 
                  onClick={() => {
                    saveTemplates({ ...templates, [friend.id]: currentTemplate });
                    setShowTemplateModal(false);
                  }}
                  className="w-full py-4 bg-pink-400 text-white rounded-2xl font-black shadow-lg shadow-pink-200 active:scale-95 transition-all"
                >
                  保存模板
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden font-sans transition-all duration-500",
      (settings.themeId === 'pink-cat' || settings.themeId === 'ocean-blue') ? "bg-transparent" : "bg-[#FFF5F7]"
    )}>
      <AnimatePresence>
        {selectedFriend && renderFriendSchedule(selectedFriend)}
      </AnimatePresence>

      {/* Main Content */}
      {activeTab === 'calendar' ? renderCalendar() : renderScheduleList()}

      {/* Bottom Navigation */}
      <div className="p-6 pb-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-full p-2 flex gap-2 shadow-xl border border-white/50">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "flex-1 py-4 rounded-full font-black text-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'calendar' 
                ? (settings.themeId === 'ocean-blue' ? "bg-sky-500 text-white shadow-lg" : "bg-pink-400 text-white shadow-lg") 
                : (settings.themeId === 'ocean-blue' ? "text-sky-400" : "text-pink-300")
            )}
          >
            <CalendarIcon size={20} /> 日历
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={cn(
              "flex-1 py-4 rounded-full font-black text-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'schedule' 
                ? (settings.themeId === 'ocean-blue' ? "bg-sky-500 text-white shadow-lg" : "bg-pink-400 text-white shadow-lg") 
                : (settings.themeId === 'ocean-blue' ? "text-sky-400" : "text-pink-300")
            )}
          >
            <ListTodo size={20} /> 日程
          </button>
        </div>
      </div>
    </div>
  );
}
