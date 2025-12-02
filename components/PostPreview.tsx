import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Globe, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { GeneratedContent } from '../types';

interface PostPreviewProps {
  data: GeneratedContent | null;
  loading: boolean;
}

const PostPreview: React.FC<PostPreviewProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full max-w-md mx-auto animate-pulse">
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-gray-300" />
        </div>
        <p>Bản xem trước bài đăng sẽ hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            AV
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">Auto Viral Page</h3>
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <span>Vừa xong</span>
              <span>•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:bg-gray-100 p-1 rounded-full">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 text-gray-800 whitespace-pre-line text-[15px] leading-normal">
        {data.content}
        <div className="mt-3 text-blue-600 font-medium">
          {data.hashtags.map(tag => `${tag.startsWith('#') ? tag : '#' + tag}`).join(' ')}
        </div>
      </div>

      {/* Image Display */}
      <div className="w-full bg-gray-100 border-y border-gray-100 relative group min-h-[200px] flex items-center justify-center">
        {data.imageBase64 ? (
            <img 
                src={`data:image/png;base64,${data.imageBase64}`} 
                alt="AI Generated Content" 
                className="w-full h-auto object-cover"
            />
        ) : (
             <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                 <div className="animate-spin mb-2">
                     <ImageIcon size={32} className="opacity-50" />
                 </div>
                 <p className="text-xs">Đang tạo ảnh minh họa...</p>
                 <p className="text-[10px] mt-1 text-gray-300 italic">{data.imagePrompt ? "Prompt: " + data.imagePrompt.substring(0, 30) + "..." : ""}</p>
             </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 flex justify-between items-center text-gray-500 text-sm border-b border-gray-100">
        <div className="flex items-center gap-1">
            <div className="bg-blue-500 rounded-full p-1 w-4 h-4 flex items-center justify-center">
                <ThumbsUp size={10} className="text-white fill-current" />
            </div>
            <span>0</span>
        </div>
        <div className="flex gap-3">
            <span>0 bình luận</span>
            <span>0 chia sẻ</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex justify-between">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-600 font-medium text-sm transition-colors">
            <ThumbsUp size={18} /> Thích
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-600 font-medium text-sm transition-colors">
            <MessageCircle size={18} /> Bình luận
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-600 font-medium text-sm transition-colors">
            <Share2 size={18} /> Chia sẻ
        </button>
      </div>
    </div>
  );
};

export default PostPreview;