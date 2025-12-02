import React, { useState, useEffect } from 'react';
import { FacebookConfig, FacebookPage } from '../types';
import { getPagesFromUserToken } from '../services/facebookService';
import { Save, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Search, ArrowDown } from 'lucide-react';

interface SettingsProps {
  config: FacebookConfig;
  onSave: (config: FacebookConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  // Manual Input State
  const [pageId, setPageId] = useState(config.pageId || '');
  const [accessToken, setAccessToken] = useState(config.accessToken || '');
  const [saved, setSaved] = useState(false);

  // Auto-fetch State
  const [userToken, setUserToken] = useState('');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setPageId(config.pageId);
    setAccessToken(config.accessToken);
  }, [config]);

  const handleFetchPages = async () => {
    if (!userToken) {
        setFetchError("Vui lòng nhập User Access Token trước.");
        return;
    }
    setLoadingPages(true);
    setFetchError(null);
    try {
        const result = await getPagesFromUserToken(userToken);
        setPages(result);
        if (result.length === 0) {
            setFetchError("Không tìm thấy Fanpage nào trong tài khoản này.");
        }
    } catch (err: any) {
        setFetchError(err.message || "Lỗi khi lấy danh sách Page.");
    } finally {
        setLoadingPages(false);
    }
  };

  const handleSelectPage = (page: FacebookPage) => {
      setPageId(page.id);
      setAccessToken(page.access_token);
      setPages([]); // Clear list after selection to clean up UI
      setUserToken(''); // Optional: clear user token
  };

  const handleSave = () => {
    onSave({ pageId, accessToken });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Cấu hình Facebook Page
        </h2>

        {/* --- SECTION 1: AUTO FETCH --- */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <RefreshCw size={20} />
                Cách 1: Tự động kết nối (Khuyên dùng)
            </h3>
            <p className="text-sm text-blue-700 mb-4">
                Nhập <strong>User Access Token</strong> của bạn để hệ thống tự động tìm Fanpage và lấy Token chuẩn. Điều này giúp tránh lỗi "Global ID not allowed".
            </p>

            <div className="flex gap-2 mb-2">
                <input 
                    type="text" 
                    value={userToken}
                    onChange={(e) => setUserToken(e.target.value)}
                    placeholder="Dán User Access Token vào đây (EAAD...)"
                    className="flex-1 border border-blue-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                    onClick={handleFetchPages}
                    disabled={loadingPages}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                >
                    {loadingPages ? <span className="animate-spin text-white">⌛</span> : <Search size={16} />}
                    Tìm Page
                </button>
            </div>
            
            <div className="text-xs text-blue-600 mb-4 flex flex-col gap-1">
                <div className="flex gap-1">
                     <AlertTriangle size={12} className="mt-0.5" />
                     <span className="font-bold">Các quyền bắt buộc (Permissions):</span>
                </div>
                <ul className="list-disc list-inside pl-4 text-blue-800 opacity-90">
                    <li><code>pages_show_list</code>: Xem danh sách Page.</li>
                    <li><code>pages_read_engagement</code>: Đọc bài viết và bình luận.</li>
                    <li><code>pages_manage_posts</code>: Đăng bài viết.</li>
                    <li><code>pages_manage_engagement</code>: Trả lời bình luận (QUAN TRỌNG).</li>
                </ul>
                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline font-bold mt-1 inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Lấy Token tại Graph API Explorer
                </a>
            </div>

            {fetchError && (
                <div className="bg-red-100 text-red-700 text-sm p-3 rounded-lg mb-3">
                    Lỗi: {fetchError}
                </div>
            )}

            {pages.length > 0 && (
                <div className="bg-white rounded-lg border border-blue-200 overflow-hidden mt-3">
                    <div className="px-4 py-2 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                        Chọn Fanpage để sử dụng
                    </div>
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {pages.map(page => (
                            <button 
                                key={page.id}
                                onClick={() => handleSelectPage(page)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <p className="font-semibold text-gray-800">{page.name}</p>
                                    <p className="text-xs text-gray-500">ID: {page.id}</p>
                                </div>
                                <div className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                    Chọn
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-gray-400 text-sm font-medium">Hoặc nhập thủ công</span>
            <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* --- SECTION 2: MANUAL INPUT --- */}
        <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Page ID
            </label>
            <input
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="VD: 10006482..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Access Token (Không phải User Token)
            </label>
            <textarea
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAA..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-2">
                Lưu ý: Nếu tự nhập, bạn phải chắc chắn đây là Token của Page (lấy từ endpoint <code>/me/accounts</code> hoặc chọn Page trong Dropdown của Graph API Explorer).
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm ml-auto"
            >
              {saved ? <CheckCircle size={20} /> : <Save size={20} />}
              {saved ? 'Đã lưu cấu hình' : 'Lưu lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;