import React, { useState, useEffect, useRef } from 'react';
import { FacebookConfig, FacebookPostData, FacebookComment, AutoReplyLog } from '../types';
import { getPagePosts, getPostComments, replyToComment } from '../services/facebookService';
import { generateCommentReply } from '../services/geminiService';
import { MessageSquare, RefreshCcw, Send, Sparkles, User, MessageCircle, Zap, Bot, CheckCircle2, Power, Activity, Terminal, Clock, Settings2 } from 'lucide-react';

interface CommentManagerProps {
  facebookConfig: FacebookConfig;
  onNavigateToSettings: () => void;
}

const REPLY_TONES = [
  "Thân thiện, hài hước",
  "Chuyên nghiệp, lịch sự",
  "Tư vấn bán hàng, chốt đơn",
  "Cảm kích, biết ơn",
  "Hài hước, bắt trend Gen Z",
  "Xử lý khiếu nại khéo léo"
];

const CommentManager: React.FC<CommentManagerProps> = ({ facebookConfig, onNavigateToSettings }) => {
  const [posts, setPosts] = useState<FacebookPostData[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FacebookPostData | null>(null);
  
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // State quản lý việc trả lời
  const [replyText, setReplyText] = useState<{[key: string]: string}>({}); 
  const [processingAi, setProcessingAi] = useState<string | null>(null); // ID comment đang generate AI (Suggest)
  const [sendingReply, setSendingReply] = useState<string | null>(null); // ID comment đang gửi reply thủ công
  
  // State cho tính năng Instant Auto Reply
  const [selectedTone, setSelectedTone] = useState(REPLY_TONES[0]);
  const [autoReplying, setAutoReplying] = useState<string | null>(null); // ID comment đang chạy Instant Auto Reply
  const [repliedComments, setRepliedComments] = useState<Set<string>>(new Set()); // Đánh dấu đã trả lời cục bộ

  // --- AUTO PILOT STATE ---
  const [isAutoPilotOn, setIsAutoPilotOn] = useState(false);
  const [processOldComments, setProcessOldComments] = useState(false); // New Option
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [autoPilotStartTime, setAutoPilotStartTime] = useState<Date | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // CRITICAL FIX: Sử dụng Ref để lưu trữ danh sách đã trả lời, tránh lỗi Stale Closure trong setInterval
  const repliedIdsRef = useRef<Set<string>>(new Set());

  // Load danh sách bài viết khi vào trang
  useEffect(() => {
    if (facebookConfig.pageId && facebookConfig.accessToken) {
      loadPosts();
    }
  }, [facebookConfig]);

  // Scroll log xuống dưới cùng khi có log mới
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // --- AUTO PILOT LOGIC (POLLING) ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isAutoPilotOn) {
        const startTime = new Date();
        setAutoPilotStartTime(startTime);
        addLog('info', `✅ Đã kích hoạt Auto-Pilot. Chế độ: ${processOldComments ? 'Xử lý tất cả comment chưa trả lời' : 'Chỉ xử lý comment MỚI'}.`);

        const runScan = async () => {
            setLastScanTime(new Date());
            addLog('info', "run scan")
            try {
                // 1. Lấy danh sách bài viết (Tăng lên 10 bài)
                const currentPosts = await getPagePosts(facebookConfig);
                const recentPosts = currentPosts.slice(0, 10); 
                
                let processedCount = 0;
                let scanCount = 0;

                for (const post of recentPosts) {
                    // 2. Lấy comment của từng bài
                    const postComments = await getPostComments(post.id, facebookConfig.accessToken);
                    scanCount += postComments.length;

                    // 3. Lọc comment cần trả lời
                    const newComments = postComments.filter(c => {
                        // Điều kiện 1: Thời gian
                        const commentTime = new Date(c.created_time);
                        // Nếu processOldComments = true -> bỏ qua check thời gian
                        // Nếu false -> phải là comment tạo sau khi bật Auto
                        const isTimeValid = processOldComments ? true : commentTime > startTime;

                        // Điều kiện 2: Chưa được xử lý (Check trong REF)
                        const isNotProcessed = !repliedIdsRef.current.has(c.id);

                        // Điều kiện 3: Không phải do chính page viết
                        const isNotMe = c.from?.id !== facebookConfig.pageId; 
                        
                        return isTimeValid && isNotProcessed && isNotMe && c.can_reply;
                    });

    
                    if (newComments.length > 0) {
                        addLog('action', `🔎 Tìm thấy ${newComments.length} bình luận cần trả lời tại bài viết ID: ...${post.id.slice(-6)}`);
                        
                        // 4. Xử lý từng comment
                        for (const comment of newComments) {
                            processedCount++;
                            addLog('action', `🤖 AI đang viết trả lời cho: "${comment.from.name}"...`);
                            
                            try {
                                // Generate AI Reply
                                const aiReply = await generateCommentReply(comment.message, post.message, selectedTone);
                                
                                // Publish Reply
                                await replyToComment(comment.id, aiReply, facebookConfig.accessToken);
                                
                                // Update State & Ref
                                repliedIdsRef.current.add(comment.id);
                                setRepliedComments(prev => new Set(prev).add(comment.id));
                                
                                addLog('success', `🚀 Đã trả lời ${comment.from.name}: "${aiReply}"`);
                                
                                // Update UI if watching this post
                                if (selectedPost?.id === post.id) {
                                    setReplyText(prev => ({...prev, [comment.id]: `✅ Auto-Pilot: ${aiReply}`}));
                                }

                            } catch (err: any) {
                                addLog('error', `❌ Lỗi khi trả lời ${comment.from.name}: ${err.message}`);
                            }
                            
                            // Delay 3 giây giữa các comment
                            await new Promise(r => setTimeout(r, 3000)); 
                        }
                    }
                }
                
                // Log heartbeat mỗi lần quét xong mà không có việc gì làm
                if (processedCount === 0 && scanCount > 0) {
                     // console.log("Heartbeat: No new comments found.");
                }

            } catch (error: any) {
                addLog('error', `⚠️ Lỗi chu kỳ quét: ${error.message}`);
            }
        };

        // Chạy ngay lần đầu
        runScan();
        // Lặp lại mỗi 20 giây
        intervalId = setInterval(runScan, 20000); 
    } else {
        if (autoPilotStartTime) {
            addLog('info', '🛑 Đã tắt chế độ Auto-Pilot.');
            setAutoPilotStartTime(null);
            setLastScanTime(null);
        }
    }

    return () => clearInterval(intervalId);
  }, [isAutoPilotOn, processOldComments]); // Restart scan if options change

  const addLog = (type: AutoReplyLog['type'], message: string) => {
    setLogs(prev => {
        const newLogs = [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type,
            message
        }];
        return newLogs.slice(-50);
    });
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const data = await getPagePosts(facebookConfig);
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectPost = async (post: FacebookPostData) => {
    setSelectedPost(post);
    setLoadingComments(true);
    setComments([]); 
    setReplyText({});
    try {
      const data = await getPostComments(post.id, facebookConfig.accessToken);
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAiSuggest = async (comment: FacebookComment) => {
    if (!selectedPost) return;
    setProcessingAi(comment.id);
    try {
      const reply = await generateCommentReply(comment.message, selectedPost.message, selectedTone);
      setReplyText(prev => ({...prev, [comment.id]: reply.trim()}));
    } catch (error) {
      alert("Lỗi khi tạo gợi ý câu trả lời");
    } finally {
      setProcessingAi(null);
    }
  };

  const handleSendReply = async (commentId: string) => {
    const text = replyText[commentId];
    if (!text) return;
    
    setSendingReply(commentId);
    try {
      await replyToComment(commentId, text, facebookConfig.accessToken);
      setReplyText(prev => {
          const newState = {...prev};
          delete newState[commentId];
          return newState;
      });
      repliedIdsRef.current.add(commentId);
      setRepliedComments(prev => new Set(prev).add(commentId));
      alert("Đã gửi trả lời thành công!");
    } catch (error: any) {
      alert(`Lỗi khi gửi: ${error.message}`);
    } finally {
      setSendingReply(null);
    }
  };

  const handleInstantAutoReply = async (comment: FacebookComment) => {
      if (!selectedPost) return;
      const confirmMsg = `Bạn có chắc muốn AI tự động trả lời bình luận của "${comment.from?.name}" với tone giọng "${selectedTone}" không?`;
      if (!window.confirm(confirmMsg)) return;

      setAutoReplying(comment.id);
      try {
          const aiText = await generateCommentReply(comment.message, selectedPost.message, selectedTone);
          if (!aiText) throw new Error("AI không tạo được nội dung.");

          await replyToComment(comment.id, aiText, facebookConfig.accessToken);
          repliedIdsRef.current.add(comment.id);
          setRepliedComments(prev => new Set(prev).add(comment.id));
          setReplyText(prev => ({...prev, [comment.id]: `✅ Đã tự động trả lời: ${aiText}`}));

      } catch (error: any) {
          alert(`Lỗi Auto Reply: ${error.message}`);
      } finally {
          setAutoReplying(null);
      }
  };

  if (!facebookConfig.pageId || !facebookConfig.accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <MessageSquare size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">Chưa kết nối Fanpage</p>
        <p className="text-sm mb-6 text-center max-w-md">Vui lòng cấu hình Facebook Page ID và Access Token để quản lý bình luận.</p>
        <button 
            onClick={onNavigateToSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
            Đi tới Cài đặt
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* --- AUTO PILOT HEADER --- */}
      <div className={`p-4 rounded-xl border shadow-sm transition-all duration-300 ${isAutoPilotOn ? 'bg-indigo-900 border-indigo-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAutoPilotOn ? 'bg-indigo-700 text-yellow-300 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        Auto-Pilot Mode
                        {isAutoPilotOn && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-bounce">LIVE</span>}
                    </h3>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                        {isAutoPilotOn ? (
                            <span className="flex items-center gap-1 text-indigo-200">
                                <Activity size={12} /> Đang chạy... Quét lần cuối: {lastScanTime ? lastScanTime.toLocaleTimeString() : '...'}
                            </span>
                        ) : (
                            <span>Hệ thống tự động trả lời bình luận bằng AI.</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 justify-end">
                {/* Checkbox Options */}
                <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg border transition-all select-none ${processOldComments ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white/10 border-transparent'}`}>
                    <input 
                        type="checkbox" 
                        checked={processOldComments} 
                        onChange={(e) => setProcessOldComments(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                    />
                    Trả lời cả bình luận cũ
                </label>

                <div className="h-6 w-px bg-white/20 hidden md:block"></div>

                <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg">
                    <span className={`hidden sm:inline text-sm font-medium px-2 ${isAutoPilotOn ? 'text-white' : 'text-gray-600'}`}>Tone:</span>
                    <select 
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className={`text-sm font-bold border-none rounded focus:ring-0 cursor-pointer py-1 pr-8 ${isAutoPilotOn ? 'bg-indigo-800 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        {REPLY_TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => setIsAutoPilotOn(!isAutoPilotOn)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-md ${
                        isAutoPilotOn 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    <Power size={18} />
                    {isAutoPilotOn ? 'Tắt' : 'Bật Auto'}
                </button>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-1 h-[calc(100vh-14rem)] gap-6">
        
        {/* Cột trái: Danh sách bài viết */}
        <div className="w-1/3 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-800">Bài viết trên Page</h3>
            <button onClick={loadPosts} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600" title="Làm mới">
                <RefreshCcw size={16} className={`${loadingPosts ? 'animate-spin' : ''}`} />
            </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {posts.length === 0 && !loadingPosts && (
                <div className="text-center py-8 text-gray-400 text-sm">Không tìm thấy bài viết nào.</div>
            )}
            
            {posts.map(post => (
                <div 
                key={post.id}
                onClick={() => handleSelectPost(post)}
                className={`p-3 rounded-lg cursor-pointer transition-all border group ${
                    selectedPost?.id === post.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                }`}
                >
                <p className="text-sm text-gray-800 line-clamp-2 mb-2 font-medium leading-relaxed">
                    {post.message || <span className="italic text-gray-400">(Bài viết chỉ có ảnh/video)</span>}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{new Date(post.created_time).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${post.comments?.summary.total_count ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100'}`}>
                    <MessageCircle size={10} />
                    {post.comments?.summary.total_count || 0}
                    </span>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Cột phải: Log & Comments */}
        <div className="flex-1 flex flex-col gap-4">
            
            {/* LIVE LOG PANEL */}
            {(isAutoPilotOn || logs.length > 0) && (
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-md flex-shrink-0 h-40 flex flex-col">
                    <div className="bg-slate-800 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                         <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <Terminal size={12} />
                            System Logs
                         </div>
                         <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-white">Clear</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
                        {logs.length === 0 && <span className="text-slate-600 italic">Đang chờ sự kiện...</span>}
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-2">
                                <span className="text-slate-500">[{log.timestamp.toLocaleTimeString()}]</span>
                                <span className={`${
                                    log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-green-400' :
                                    log.type === 'action' ? 'text-yellow-400' : 'text-blue-300'
                                }`}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}

            {/* DETAIL COMMENT PANEL */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm min-h-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50 h-16 flex items-center justify-between">
                {selectedPost ? (
                    <>
                        <div className="flex flex-col overflow-hidden">
                            <div className="font-semibold text-gray-800 truncate">Bình luận bài viết</div>
                            <span className="text-xs text-gray-500 truncate max-w-md">ID: {selectedPost.id}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            {comments.length} bình luận hiển thị
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500 italic flex items-center gap-2">
                        <MessageSquare size={16} /> Chọn bài viết để xem bình luận
                    </div>
                )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {!selectedPost ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="opacity-40" />
                    </div>
                    <p>Chọn bài viết bên trái để bắt đầu tương tác</p>
                    </div>
                ) : loadingComments ? (
                    <div className="flex justify-center items-center h-full flex-col gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm">Đang tải bình luận...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">Bài viết này chưa có bình luận nào.</div>
                ) : (
                    <div className="space-y-6">
                    {comments.map(comment => {
                        const isReplied = repliedComments.has(comment.id);
                        return (
                        <div key={comment.id} className={`group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isReplied ? 'opacity-75' : ''}`}>
                        {/* User Comment Bubble */}
                        <div className="flex gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0">
                            <User size={20} />
                            </div>
                            <div className="max-w-[85%]">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-gray-800 text-sm">{comment.from?.name || 'Facebook User'}</span>
                                    <span className="text-xs text-gray-400">{new Date(comment.created_time).toLocaleString('vi-VN')}</span>
                                    {isReplied && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Đã trả lời</span>}
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-800 text-sm leading-relaxed">
                                    {comment.message}
                                </div>
                            </div>
                        </div>

                        {/* Reply Input Area */}
                        {(
                            <div className="ml-12 pl-1 mt-2">
                                {/* Single Instant Auto Reply Action */}
                                {!isAutoPilotOn && !replyText[comment.id] && !isReplied && (
                                    <button
                                        onClick={() => handleInstantAutoReply(comment)}
                                        disabled={autoReplying === comment.id || !!processingAi}
                                        className="mb-2 w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-100 rounded-xl flex items-center justify-between group/btn transition-all shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg bg-white text-purple-600 shadow-sm ${autoReplying === comment.id ? 'animate-spin' : ''}`}>
                                                {autoReplying === comment.id ? <RefreshCcw size={16} /> : <Zap size={16} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">Tự động trả lời ngay</span>
                                                <span className="text-xs text-gray-500">AI sẽ viết và gửi câu trả lời với tone: {selectedTone}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity">Thực hiện ngay &rarr;</span>
                                    </button>
                                )}
                                

                                <div className="relative">
                                    <textarea
                                        value={replyText[comment.id] || ''}
                                        onChange={(e) => setReplyText(prev => ({...prev, [comment.id]: e.target.value}))}
                                        placeholder={isReplied ? "Đã trả lời." : "Hoặc viết câu trả lời thủ công..."}
                                        disabled={isReplied}
                                        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none pr-28 shadow-sm resize-none h-[5.5rem] transition-all ${isReplied ? 'bg-gray-50 text-gray-500 italic' : ''}`}
                                    />
                                    {!isReplied && (
                                        <div className="absolute bottom-2 right-2 flex gap-1.5">
                                            <button
                                                onClick={() => handleAiSuggest(comment)}
                                                disabled={processingAi === comment.id || autoReplying === comment.id}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                                                title="Nháp câu trả lời (không gửi ngay)"
                                            >
                                                {processingAi === comment.id ? <span className="animate-spin">✨</span> : <Sparkles size={14} />}
                                                Nháp AI
                                            </button>
                                            <button
                                                onClick={() => handleSendReply(comment.id)}
                                                disabled={sendingReply === comment.id || !replyText[comment.id]}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-bold"
                                                title="Gửi trả lời"
                                            >
                                                {sendingReply === comment.id ? (
                                                    <span className="animate-spin w-3.5 h-3.5 block border-2 border-white/50 border-t-white rounded-full"></span>
                                                ) : (
                                                    <>
                                                        Gửi <Send size={12} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        </div>
                    )})}
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CommentManager;