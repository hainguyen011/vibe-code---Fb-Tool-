import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  const { facebookConfig, setFacebookConfig } = useStore();
  const [pageId, setPageId] = useState(facebookConfig.pageId);
  const [token, setToken] = useState(facebookConfig.accessToken);

  const handleSave = () => {
      setFacebookConfig({ pageId, accessToken: token });
      alert("Saved!");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Cài đặt Facebook Page</h2>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Page ID</label>
                <input value={pageId} onChange={e => setPageId(e.target.value)} className="w-full border rounded-lg p-3" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Access Token</label>
                <textarea value={token} onChange={e => setToken(e.target.value)} className="w-full border rounded-lg p-3 h-32 font-mono text-xs" />
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold">
                <Save size={18}/> Lưu cấu hình
            </button>
        </div>
    </div>
  );
};

export default Settings;