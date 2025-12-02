import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Tone } from '../../types';
import { Plus, Trash2, Tag } from 'lucide-react';

const TopicManager: React.FC = () => {
  const { topics, setTopics } = useStore();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
      setTopics([...topics, { id: crypto.randomUUID(), name: newName, description: newDesc, preferredTone: Tone.PROFESSIONAL }]);
      setNewName(''); setNewDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="bg-white p-6 rounded-xl border border-gray-200 h-fit">
            <h3 className="font-bold mb-4">Thêm chủ đề</h3>
            <div className="space-y-4">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên chủ đề" className="w-full border rounded-lg p-2" />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Mô tả" className="w-full border rounded-lg p-2 h-24" />
                <button onClick={handleAdd} className="w-full bg-blue-600 text-white py-2 rounded-lg">Thêm</button>
            </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
            {topics.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-xl border flex justify-between">
                    <div>
                        <h4 className="font-bold">{t.name}</h4>
                        <p className="text-sm text-gray-600">{t.description}</p>
                    </div>
                    <Trash2 size={18} className="text-gray-400 cursor-pointer hover:text-red-500" onClick={() => setTopics(topics.filter(x => x.id !== t.id))} />
                </div>
            ))}
        </div>
    </div>
  );
};

export default TopicManager;