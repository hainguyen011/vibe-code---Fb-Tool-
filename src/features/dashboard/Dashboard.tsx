import React from 'react';
import { useStore } from '../../context/StoreContext';
import { PostStatus } from '../../types';
import { ArrowUpRight, Calendar, CheckCircle2, FileText, BarChart3, TrendingUp, Users, RefreshCw, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { posts, pageProfile, syncData, isSyncing } = useStore();

  const publishedCount = posts.filter(p => p.status === PostStatus.PUBLISHED).length;
  const scheduledCount = posts.filter(p => p.status === PostStatus.SCHEDULED).length;
  
  const totalLikes = posts.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalComments = posts.reduce((acc, curr) => acc + (curr.comments || 0), 0);
  const totalShares = posts.reduce((acc, curr) => acc + (curr.shares || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Xin chào, {pageProfile ? 'Admin' : 'Khách'} 👋</h2>
                <p className="text-gray-500 mt-1">
                    {pageProfile ? `Báo cáo hiệu suất của "${pageProfile.name}"` : "Kết nối Fanpage để xem dữ liệu."}
                </p>
            </div>
            <button 
                onClick={syncData}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
            </button>
        </div>

        {/* Profile Card */}
        {pageProfile ? (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
                        <img src={pageProfile.picture} alt={pageProfile.name} className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="flex-1 min-w-0 z-10">
                    <h3 className="text-2xl font-bold text-gray-900 truncate">{pageProfile.name}</h3>
                    <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                         <span className="flex items-center gap-1"><Users size={16} /> {pageProfile.followers_count?.toLocaleString()} followers</span>
                         <span className="flex items-center gap-1"><CheckCircle2 size={16} /> Đã kết nối</span>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-4 text-amber-800">
                <AlertTriangle size={24} />
                <div>
                    <h3 className="font-bold text-lg">Chưa kết nối Fanpage</h3>
                    <p className="text-sm opacity-80">Vui lòng vào phần Cài đặt để nhập Access Token.</p>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-start mb-6">
                    <BarChart3 size={24} className="text-white/80" />
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">Total</span>
                </div>
                <p className="text-indigo-100 font-medium mb-1">Tổng tương tác</p>
                <h3 className="text-5xl font-bold tracking-tight">{(totalLikes + totalComments + totalShares).toLocaleString()}</h3>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                <CheckCircle2 size={24} className="text-green-600 mb-4" />
                <h3 className="text-3xl font-bold text-gray-800 mb-1">{publishedCount}</h3>
                <p className="text-gray-500 text-sm font-medium">Bài đã đăng</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                <Calendar size={24} className="text-blue-600 mb-4" />
                <h3 className="text-3xl font-bold text-gray-800 mb-1">{scheduledCount}</h3>
                <p className="text-gray-500 text-sm font-medium">Đang chờ đăng</p>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;