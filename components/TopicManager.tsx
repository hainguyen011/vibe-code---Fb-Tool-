import React, { useState } from 'react';
import { Topic, Tone } from '../types';
import { Plus, Trash2, Tag } from 'lucide-react';

interface TopicManagerProps {
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
}

const TopicManager: React.FC<TopicManagerProps> = ({ topics, setTopics }) => {
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicTone, setNewTopicTone] = useState<Tone>(Tone.PROFESSIONAL);

  const handleAddTopic = () => {
    if (!newTopicName || !newTopicDesc) return;
    
    const newTopic: Topic = {
        id: crypto.randomUUID(),
        name: newTopicName,
        description: newTopicDesc,
        preferredTone: newTopicTone
    };
    
    setTopics([...topics, newTopic]);
    setNewTopicName('');
    setNewTopicDesc('');
  };

  const handleDeleteTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="text-blue-600" /> Thêm chủ đề mới
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ đề</label>
                    <input 
                        type="text" 
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="VD: Mẹo vặt cuộc sống"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                    <textarea 
                        value={newTopicDesc}
                        onChange={(e) => setNewTopicDesc(e.target.value)}
                        placeholder="Mô tả hướng đi nội dung..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tone giọng mặc định</label>
                    <select 
                        value={newTopicTone}
                        onChange={(e) => setNewTopicTone(e.target.value as Tone)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleAddTopic}
                    disabled={!newTopicName || !newTopicDesc}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Tạo chủ đề
                </button>
            </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-800">Danh sách chủ đề ({topics.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map(topic => (
                    <div key={topic.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Tag className="text-blue-500" size={18} />
                                <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                            </div>
                            <button 
                                onClick={() => handleDeleteTopic(topic.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                        <div className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-medium">
                            {topic.preferredTone}
                        </div>
                    </div>
                ))}
                {topics.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        Chưa có chủ đề nào được tạo.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TopicManager;
