import React from 'react';
import { LayoutDashboard, PenTool, Calendar, Settings, Zap, MessageSquare } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ViewType } from '../../types';

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useStore();

  const menuItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'generate', label: 'Tạo bài mới', icon: Zap },
    { id: 'comments', label: 'Quản lý bình luận', icon: MessageSquare },
    { id: 'schedule', label: 'Lịch đăng bài', icon: Calendar },
    { id: 'topics', label: 'Quản lý chủ đề', icon: PenTool },
  ];

  return (
    <div className="w-72 h-screen fixed left-0 top-0 z-20 flex flex-col bg-slate-900 text-white shadow-2xl">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="text-white w-6 h-6" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AutoViral<span className="text-blue-400">FB</span></h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">AI Automation</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-800/50 rounded-2xl p-1">
            <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === 'settings' 
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            >
            <Settings size={20} />
            <span className="font-medium">Cài đặt</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;