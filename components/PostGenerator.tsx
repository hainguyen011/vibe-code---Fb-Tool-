import React, { useState } from 'react';
import { Topic, Tone, GeneratedContent, Post, PostStatus, FacebookConfig, Persona } from '../types';
import { generatePostContent, generateImageFromPrompt } from '../services/geminiService';
import { publishToFacebookPage, publishPhotoToFacebookPage } from '../services/facebookService';
import PostPreview from './PostPreview';
import { Wand2, Save, Send, AlertCircle, Copy, Check, Globe, Sparkles, Loader2, UserCircle2, Plus, X } from 'lucide-react';

interface PostGeneratorProps {
  topics: Topic[];
  personas: Persona[];
  onSavePersona: (persona: Persona) => void;
  onSave: (post: Post) => void;
  facebookConfig: FacebookConfig;
  onNavigateToSettings: () => void;
}

const PostGenerator: React.FC<PostGeneratorProps> = ({ topics, personas, onSavePersona, onSave, facebookConfig, onNavigateToSettings }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState('');
  
  // Persona State
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0]?.id || '');
  const [showAddPersona, setShowAddPersona] = useState(false);
  
  // New Persona Form State
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaRole, setNewPersonaRole] = useState('');
  const [newPersonaStyle, setNewPersonaStyle] = useState('');
  const [newPersonaPhrase, setNewPersonaPhrase] = useState('');
  const [newPersonaTone, setNewPersonaTone] = useState<Tone>(Tone.PROFESSIONAL);

  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreatePersona = () => {
    if(!newPersonaName || !newPersonaRole) return;
    const newPersona: Persona = {
        id: crypto.randomUUID(),
        name: newPersonaName,
        role: newPersonaRole,
        style: newPersonaStyle || 'Tự nhiên',
        catchphrases: newPersonaPhrase,
        tone: newPersonaTone
    };
    onSavePersona(newPersona);
    setSelectedPersonaId(newPersona.id);
    setShowAddPersona(false);
    // Reset form
    setNewPersonaName('');
    setNewPersonaRole('');
    setNewPersonaStyle('');
    setNewPersonaPhrase('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingImage(false);
    setError(null);
    setCopied(false);
    setGeneratedData(null);
    
    let topicName = customTopic;
    let topicDesc = "Chủ đề tùy chỉnh";

    if (selectedTopicId !== 'custom' && selectedTopicId) {
        const topic = topics.find(t => t.id === selectedTopicId);
        if (topic) {
            topicName = topic.name;
            topicDesc = topic.description;
        }
    }

    if (!topicName) {
        setError("Vui lòng chọn chủ đề hoặc nhập chủ đề mới.");
        setLoading(false);
        return;
    }

    const persona = personas.find(p => p.id === selectedPersonaId);
    if (!persona) {
        setError("Vui lòng chọn người đăng bài (Persona).");
        setLoading(false);
        return;
    }

    try {
      const data = await generatePostContent(topicName, topicDesc, persona, context);
      setGeneratedData(data); 
      setLoading(false);

      if (data.imagePrompt) {
        setLoadingImage(true);
        const imageBase64 = await generateImageFromPrompt(data.imagePrompt);
        if (imageBase64) {
             setGeneratedData(prev => prev ? ({ ...prev, imageBase64: imageBase64 }) : null);
        }
        setLoadingImage(false);
      }

    } catch (err) {
      setError("Đã xảy ra lỗi khi tạo nội dung. Vui lòng thử lại.");
      setLoading(false);
      setLoadingImage(false);
    }
  };

  const createPostObject = (status: PostStatus): Post => {
    if (!generatedData) throw new Error("No data");
    return {
        id: crypto.randomUUID(),
        topicId: selectedTopicId === 'custom' ? 'custom' : selectedTopicId,
        content: generatedData.content,
        hashtags: generatedData.hashtags,
        imagePrompt: generatedData.imagePrompt,
        imageBase64: generatedData.imageBase64,
        status: status,
        createdAt: new Date(),
        scheduledTime: status === PostStatus.SCHEDULED ? new Date(Date.now() + 86400000) : undefined
    };
  };

  const handleSave = (status: PostStatus) => {
    if (!generatedData) return;
    const newPost = createPostObject(status);
    onSave(newPost);
    alert(status === PostStatus.SCHEDULED ? "Đã lên lịch đăng bài!" : "Đã lưu bản nháp!");
  };

  const handlePublishNow = async () => {
    if (!generatedData) return;
    
    if (!facebookConfig.pageId || !facebookConfig.accessToken) {
        const confirm = window.confirm("Bạn chưa cấu hình Facebook Page. Đi đến cài đặt ngay?");
        if (confirm) onNavigateToSettings();
        return;
    }

    setPublishing(true);
    try {
        const fullContent = `${generatedData.content}\n\n${generatedData.hashtags.join(' ')}`;
        let result;

        if (generatedData.imageBase64) {
             result = await publishPhotoToFacebookPage(facebookConfig, fullContent, generatedData.imageBase64);
        } else {
             result = await publishToFacebookPage(facebookConfig, fullContent);
        }
        
        if (result.success) {
            const newPost = createPostObject(PostStatus.PUBLISHED);
            onSave(newPost);
            alert("Đã đăng bài thành công lên Facebook Page!");
        } else {
            alert(`Đăng bài thất bại: ${result.error}`);
        }
    } catch (e) {
        alert("Đã xảy ra lỗi khi đăng bài.");
    } finally {
        setPublishing(false);
    }
  };

  const handleCopy = () => {
      if (generatedData) {
          const fullText = `${generatedData.content}\n\n${generatedData.hashtags.join(' ')}`;
          navigator.clipboard.writeText(fullText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8">
      {/* Left Column: Controls */}
      <div className="w-[420px] flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Wand2 size={20} />
                </div>
                Cấu hình AI
            </h2>

            <div className="space-y-6">
                
                {/* PERSONA SELECTOR */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Người đăng bài (Persona)</label>
                    
                    {!showAddPersona ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                                {personas.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPersonaId(p.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                            selectedPersonaId === p.id 
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-300' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${selectedPersonaId === p.id ? 'bg-indigo-200' : 'bg-gray-100'}`}>
                                            {p.avatar || '🧑‍💻'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                            <div className="text-xs text-gray-500">{p.role}</div>
                                        </div>
                                        {selectedPersonaId === p.id && <Check className="ml-auto text-indigo-600" size={16} />}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowAddPersona(true)}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Thêm nhân vật mới
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-sm text-gray-700">Tạo nhân vật mới</h4>
                                <button onClick={() => setShowAddPersona(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                            </div>
                            <div className="space-y-3">
                                <input value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} placeholder="Tên (VD: CEO Hùng)" className="w-full text-sm border rounded-lg p-2" />
                                <input value={newPersonaRole} onChange={e => setNewPersonaRole(e.target.value)} placeholder="Vai trò (VD: Founder)" className="w-full text-sm border rounded-lg p-2" />
                                <input value={newPersonaStyle} onChange={e => setNewPersonaStyle(e.target.value)} placeholder="Style (VD: Hài hước, Gen Z)" className="w-full text-sm border rounded-lg p-2" />
                                <input value={newPersonaPhrase} onChange={e => setNewPersonaPhrase(e.target.value)} placeholder="Câu cửa miệng (VD: 'Chốt đơn!')" className="w-full text-sm border rounded-lg p-2" />
                                <select value={newPersonaTone} onChange={e => setNewPersonaTone(e.target.value as Tone)} className="w-full text-sm border rounded-lg p-2">
                                    {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <button onClick={handleCreatePersona} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm">Lưu Nhân Vật</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* TOPIC SELECTOR */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ đề bài viết</label>
                    <div className="relative">
                        <select 
                            value={selectedTopicId} 
                            onChange={(e) => setSelectedTopicId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none font-medium text-gray-700"
                        >
                            <option value="">-- Chọn chủ đề --</option>
                            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            <option value="custom">+ Chủ đề mới tùy chỉnh</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {selectedTopicId === 'custom' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nhập chủ đề</label>
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="VD: Xu hướng thời trang hè 2024"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ngữ cảnh bổ sung</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-24 resize-none transition-all"
                        placeholder="Thêm thông tin chi tiết: chương trình khuyến mãi 50%, nhắm tới đối tượng Gen Z..."
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-start gap-2 border border-red-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || loadingImage}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${
                        loading || loadingImage 
                        ? 'bg-slate-800 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5'
                    }`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    {loading ? (
                        <><Loader2 className="animate-spin" size={20} /> Đang viết...</>
                    ) : loadingImage ? (
                        <><Loader2 className="animate-spin" size={20} /> Đang vẽ ảnh...</>
                    ) : (
                        <>
                            <Sparkles size={20} /> Tạo nội dung Magic
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Actions for Result */}
        {generatedData && (
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold text-gray-800 mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleSave(PostStatus.DRAFT)}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        <Save size={18} /> Lưu nháp
                    </button>
                    <button 
                        onClick={() => handleSave(PostStatus.SCHEDULED)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 font-medium transition-colors"
                    >
                        <Send size={18} /> Lên lịch
                    </button>
                    <button 
                         onClick={handlePublishNow}
                         disabled={publishing}
                         className={`col-span-2 flex items-center justify-center gap-2 px-4 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-all ${publishing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        {publishing ? (
                             <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Globe size={20} />
                        )}
                        {publishing ? 'Đang đăng bài...' : 'Đăng ngay lên Fanpage'}
                    </button>
                    <button 
                         onClick={handleCopy}
                         className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-700 text-sm font-medium transition-all"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Đã sao chép!' : 'Sao chép nội dung'}
                    </button>
                </div>
             </div>
        )}
      </div>

      {/* Right Column: Preview */}
      <div className="flex-1 h-full bg-slate-100/50 rounded-3xl border border-gray-200/50 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="relative z-10 flex-1 overflow-y-auto p-8 flex items-start justify-center">
            <div className="w-full max-w-md">
                <div className="mb-4 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-widest">
                    Preview on Facebook
                </div>
                <PostPreview data={generatedData} loading={loading} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostGenerator;