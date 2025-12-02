import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Globe, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { GeneratedContent } from '../../../types';

interface PostPreviewProps {
  data: GeneratedContent | null;
  loading: boolean;
}

const PostPreview: React.FC<PostPreviewProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full max-w-md mx-auto animate-pulse">
        <div className="h-48 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <Globe className="w-8 h-8 text-gray-300 mb-2" />
        <p>Preview will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-auto overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">AV</div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">Auto Viral Page</h3>
            <div className="text-xs text-gray-500 flex gap-1"><span>Just now</span>•<Globe size={12} /></div>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-gray-400" />
      </div>

      <div className="px-4 pb-2 text-gray-800 whitespace-pre-line text-[15px]">
        {data.content}
        <div className="mt-2 text-blue-600 font-medium">
          {data.hashtags.map(tag => `${tag.startsWith('#') ? tag : '#' + tag}`).join(' ')}
        </div>
      </div>

      <div className="w-full bg-gray-100 border-y border-gray-100 min-h-[200px] flex items-center justify-center">
        {data.imageBase64 ? (
            <img src={`data:image/png;base64,${data.imageBase64}`} alt="AI Generated" className="w-full h-auto object-cover" />
        ) : (
             <div className="text-center text-gray-400 py-10">
                 <ImageIcon size={32} className="opacity-50 mx-auto mb-2" />
                 <p className="text-xs">Generating image...</p>
             </div>
        )}
      </div>
      
      <div className="px-2 py-1 flex justify-between">
         <button className="flex-1 py-2 text-gray-500 hover:bg-gray-50 rounded text-sm font-medium"><ThumbsUp size={16} className="inline mr-1" /> Like</button>
         <button className="flex-1 py-2 text-gray-500 hover:bg-gray-50 rounded text-sm font-medium"><MessageCircle size={16} className="inline mr-1" /> Comment</button>
         <button className="flex-1 py-2 text-gray-500 hover:bg-gray-50 rounded text-sm font-medium"><Share2 size={16} className="inline mr-1" /> Share</button>
      </div>
    </div>
  );
};

export default PostPreview;