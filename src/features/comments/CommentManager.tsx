import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { FacebookPostData, FacebookComment, AutoReplyLog } from '../../types';
import { getPagePosts, getPostComments, replyToComment } from '../../services/facebookService';
import { generateCommentReply } from '../../services/geminiService';
import { MessageSquare, RefreshCcw, Send, Sparkles, User, Zap, Bot, Activity, Terminal, Play } from 'lucide-react';

const CommentManager: React.FC = () => {
  const { facebookConfig, setCurrentView } = useStore();
  
  const [posts, setPosts] = useState<FacebookPostData[]>([]);
  const [selectedPost, setSelectedPost] = useState<FacebookPostData | null>(null);
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({}); 

  // Simple logging helper
  const addLog = useCallback((type: AutoReplyLog['type'], message: string) => {
    setLogs(prev => [...prev.slice(-49), { id: crypto.randomUUID(), timestamp: new Date(), type, message }]);
  }, []);

  const loadPosts = async () => {
      if(!facebookConfig.accessToken) return;
      try {
          const data = await getPagePosts(facebookConfig);
          setPosts(data);
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
      if(facebookConfig.accessToken) loadPosts();
  }, [facebookConfig]);

  const handleSelectPost = async (post: FacebookPostData) => {
      setSelectedPost(post);
      try {
          const data = await getPostComments(post.id, facebookConfig.accessToken);
          setComments(data);
      } catch (e) { console.error(e); }
  };

  const handleInstantAutoReply = async (comment: FacebookComment) => {
      if(!selectedPost) return;
      try {
          const reply = await generateCommentReply(comment.message, selectedPost.message);
          await replyToComment(comment.id, reply, facebookConfig.accessToken);
          addLog('success', `Replied to ${comment.from.name}: ${reply}`);
          setReplyText(prev => ({...prev, [comment.id]: reply}));
      } catch (e: any) {
          addLog('error', e.message);
      }
  };

  if (!facebookConfig.accessToken) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare size={48} className="mb-4" />
              <p>Vui lòng cấu hình Facebook Page trước.</p>
              <button onClick={() => setCurrentView('settings')} className="mt-4 text-blue-600">Đi tới cài đặt</button>
          </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
       <div className="w-1/3 bg-white rounded-xl border border-gray-200 flex flex-col">
           <div className="p-4 border-b border-gray-100 flex justify-between">
               <h3 className="font-bold">Bài viết</h3>
               <button onClick={loadPosts}><RefreshCcw size={16}/></button>
           </div>
           <div className="overflow-y-auto p-2 space-y-2">
               {posts.map(post => (
                   <div key={post.id} onClick={() => handleSelectPost(post)} className={`p-3 rounded-lg border cursor-pointer ${selectedPost?.id === post.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                       <p className="text-sm line-clamp-2">{post.message || 'Media Content'}</p>
                   </div>
               ))}
           </div>
       </div>

       <div className="flex-1 flex flex-col gap-4">
           {/* Logs */}
           <div className="h-32 bg-slate-900 rounded-xl p-3 overflow-y-auto font-mono text-xs">
               {logs.map(log => (
                   <div key={log.id} className="mb-1">
                       <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span> 
                       <span className={log.type === 'error' ? 'text-red-400' : 'text-green-400'}> {log.message}</span>
                   </div>
               ))}
           </div>

           {/* Comments */}
           <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto p-4">
               {comments.map(comment => (
                   <div key={comment.id} className="mb-4 group">
                       <div className="flex gap-3">
                           <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><User size={16}/></div>
                           <div className="flex-1">
                               <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm">
                                   <span className="font-bold block text-gray-800">{comment.from?.name}</span>
                                   {comment.message}
                               </div>
                               <div className="flex items-center gap-2 mt-1">
                                   <button onClick={() => handleInstantAutoReply(comment)} className="text-xs text-purple-600 flex items-center gap-1">
                                       <Zap size={12}/> AI Reply
                                   </button>
                                   <span className="text-xs text-green-600">{replyText[comment.id]}</span>
                               </div>
                           </div>
                       </div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
};

export default CommentManager;