import React from 'react';
import { PageProfile, Post, PostStatus } from '../types';
import { ArrowUpRight, Calendar, CheckCircle2, FileText, BarChart3, TrendingUp, Users, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  posts: Post[];
  pageProfile: PageProfile | null;
  onSync: () => void;
  isSyncing: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ posts, pageProfile, onSync, isSyncing }) => {
  const publishedCount = posts.filter(p => p.status === PostStatus.PUBLISHED).length;
  const scheduledCount = posts.filter(p => p.status === PostStatus.SCHEDULED).length;
  const draftCount = posts.filter(p => p.status === PostStatus.DRAFT).length;
  
  const totalLikes = posts.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalComments = posts.reduce((acc, curr) => acc + (curr.comments || 0), 0);
  const totalShares = posts.reduce((acc, curr) => acc + (curr.shares || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Xin chào, {pageProfile ? 'Admin' : 'Khách'} 👋</h2>
                <p className="text-gray-500 mt-1">
                    {pageProfile 
                        ? `Dưới đây là báo cáo hiệu suất của "${pageProfile.name}"` 
                        : "Kết nối Fanpage để xem dữ liệu thực tế."}
                </p>
            </div>
            <div className="flex items-center gap-3">
                 <button 
                    onClick={onSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                 >
                     <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                     {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}
                 </button>
                 <div className="text-sm bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>
        </div>

        {/* Page Profile & Connect Status */}
        {pageProfile ? (
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
                {/* Cover & Avatar */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
                        <img src={pageProfile.picture} alt={pageProfile.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0 z-10">
                    <h3 className="text-2xl font-bold text-gray-900 truncate">{pageProfile.name}</h3>
                    <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                         <span className="flex items-center gap-1"><Users size={16} /> {pageProfile.followers_count?.toLocaleString()} followers</span>
                         <span className="flex items-center gap-1"><CheckCircle2 size={16} /> Đã kết nối & Đồng bộ</span>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-4 text-amber-800">
                <div className="p-3 bg-amber-100 rounded-full">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Chưa kết nối Fanpage</h3>
                    <p className="text-sm opacity-80">Vui lòng vào phần Cài đặt để nhập Access Token và đồng bộ dữ liệu thật từ Facebook.</p>
                </div>
            </div>
        )}

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Primary Stat */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <BarChart3 size={24} className="text-white" />
                        </div>
                        <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                            <ArrowUpRight size={14} /> Realtime
                        </span>
                    </div>
                    <div>
                        <p className="text-indigo-100 font-medium mb-1">Tổng tương tác (25 bài gần nhất)</p>
                        <h3 className="text-5xl font-bold tracking-tight">{(totalLikes + totalComments + totalShares).toLocaleString()}</h3>
                        <div className="flex gap-4 mt-4 text-indigo-100 text-sm font-medium">
                             <span>👍 {totalLikes} Like</span>
                             <span>💬 {totalComments} Cmt</span>
                             <span>🔁 {totalShares} Share</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 rounded-2xl">
                        <CheckCircle2 size={24} className="text-green-600" />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">{publishedCount}</h3>
                <p className="text-gray-500 text-sm font-medium">Bài đã đăng (Fetch)</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <Calendar size={24} className="text-blue-600" />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">{scheduledCount}</h3>
                <p className="text-gray-500 text-sm font-medium">Đang chờ đăng</p>
            </div>

             <div className="md:col-span-3 lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <TrendingUp className="text-blue-600" size={20} />
                        Hoạt động gần đây (Dữ liệu thật từ Page)
                    </h3>
                </div>
                
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            Chưa có dữ liệu. Hãy bấm "Đồng bộ dữ liệu" để tải về.
                        </div>
                    ) : (
                        posts.slice(0, 5).map(post => (
                            <div key={post.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-default">
                                <div className="flex items-center gap-4 min-w-0 w-2/3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 ${!post.imageBase64 ? 'bg-gray-100' : ''}`}>
                                        {post.imageBase64 ? (
                                             <img src={post.imageBase64} alt="" className="w-full h-full object-cover" />
                                        ) : post.status === PostStatus.PUBLISHED ? <CheckCircle2 size={20} className="text-green-600" /> : <FileText size={20} className="text-gray-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 truncate pr-4">{post.content.split('\n')[0] || "Bài viết ảnh/video"}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <span>•</span>
                                            <span className="capitalize">{post.status === 'PUBLISHED' ? 'Đã đăng' : post.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-right">
                                     <div>
                                         <span className="text-sm font-bold text-gray-900 block">{post.likes || 0}</span>
                                         <p className="text-[10px] text-gray-400 uppercase tracking-wide">Likes</p>
                                     </div>
                                     <div>
                                         <span className="text-sm font-bold text-gray-900 block">{post.comments || 0}</span>
                                         <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cmts</p>
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>
    </div>
  );
};

export default Dashboard;