import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { generatePostContent, generateImageFromPrompt } from '../../services/geminiService';
import { publishToFacebookPage, publishPhotoToFacebookPage } from '../../services/facebookService';
import PostPreview from './components/PostPreview';
import { GeneratedContent, Post, PostStatus, Persona, Tone } from '../../types';
import { Wand2, Save, Send, AlertCircle, Copy, Check, Globe, Sparkles, Loader2, Plus, X } from 'lucide-react';

const PostGenerator: React.FC = () => {
  const { topics, personas, addPersona, addPost, facebookConfig, setCurrentView } = useStore();
  
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0]?.id || '');
  const [showAddPersona, setShowAddPersona] = useState(false);
  const [context, setContext] = useState('');
  
  // Generation State
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null);
  const [publishing, setPublishing] = useState(false);
  
  // New Persona Form
  const [newPersona, setNewPersona] = useState<Partial<Persona>>({ tone: Tone.PROFESSIONAL });

  const handleGenerate = async () => {
    setLoading(true);
    let topicName = customTopic;
    let topicDesc = "Chủ đề tùy chỉnh";

    if (selectedTopicId !== 'custom' && selectedTopicId) {
        const topic = topics.find(t => t.id === selectedTopicId);
        if (topic) {
            topicName = topic.name;
            topicDesc = topic.description;
        }
    }

    const persona = personas.find(p => p.id === selectedPersonaId);
    if (!persona || !topicName) {
        setLoading(false);
        return;
    }

    try {
      const data = await generatePostContent(topicName, topicDesc, persona, context);
      setGeneratedData(data);
      if (data.imagePrompt) {
          const img = await generateImageFromPrompt(data.imagePrompt);
          if (img) setGeneratedData(prev => prev ? ({ ...prev, imageBase64: img }) : null);
      }
    } catch (err) {
      alert("Error generating content");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
      if (!generatedData || !facebookConfig.accessToken) return;
      setPublishing(true);
      try {
          const content = `${generatedData.content}\n\n${generatedData.hashtags.join(' ')}`;
          if (generatedData.imageBase64) {
              await publishPhotoToFacebookPage(facebookConfig, content, generatedData.imageBase64);
          } else {
              await publishToFacebookPage(facebookConfig, content);
          }
          addPost({
              id: crypto.randomUUID(),
              topicId: selectedTopicId,
              content: generatedData.content,
              hashtags: generatedData.hashtags,
              imagePrompt: generatedData.imagePrompt,
              imageBase64: generatedData.imageBase64,
              status: PostStatus.PUBLISHED,
              createdAt: new Date()
          });
          alert("Published!");
      } catch (e) {
          alert("Failed to publish");
      } finally {
          setPublishing(false);
      }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8">
      <div className="w-[420px] flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wand2 size={20} /></div>
                Cấu hình AI
            </h2>
            
            {/* Persona Selector */}
            <div className="mb-4">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Người đăng bài</label>
                 <div className="space-y-2">
                    {personas.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => setSelectedPersonaId(p.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedPersonaId === p.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}
                        >
                            <span className="text-xl">{p.avatar}</span>
                            <div>
                                <div className="font-bold text-sm">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.role}</div>
                            </div>
                        </button>
                    ))}
                 </div>
            </div>

            {/* Topic Selector */}
            <div className="mb-4">
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ đề</label>
                 <select 
                    value={selectedTopicId} 
                    onChange={e => setSelectedTopicId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none"
                 >
                    <option value="">Chọn chủ đề</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    <option value="custom">Tùy chỉnh</option>
                 </select>
                 {selectedTopicId === 'custom' && (
                     <input 
                        className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none" 
                        placeholder="Nhập chủ đề..."
                        value={customTopic}
                        onChange={e => setCustomTopic(e.target.value)}
                     />
                 )}
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {loading ? 'Đang tạo...' : 'Tạo nội dung'}
            </button>
        </div>

        {generatedData && (
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                >
                    {publishing ? <Loader2 className="animate-spin" /> : <Globe />}
                    Đăng ngay
                </button>
             </div>
        )}
      </div>

      <div className="flex-1 h-full bg-slate-100/50 rounded-3xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md">
            <PostPreview data={generatedData} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default PostGenerator;