import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PostGenerator from './components/PostGenerator';
import TopicManager from './components/TopicManager';
import Settings from './components/Settings';
import CommentManager from './components/CommentManager';
import { Post, PostStatus, Topic, Tone, FacebookConfig, Persona, PageProfile } from './types';
import { getPageProfile, getPagePosts } from './services/facebookService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Facebook Settings State
  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>({
    pageId: '',
    accessToken: ''
  });
  
  // Page Data State
  const [pageProfile, setPageProfile] = useState<PageProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Personas State
  const [personas, setPersonas] = useState<Persona[]>([
      {
          id: 'p1',
          name: 'CEO Quyết Đoán',
          role: 'CEO / Founder',
          style: 'Chuyên nghiệp, ngắn gọn, truyền cảm hứng, hướng tới kết quả.',
          catchphrases: 'Kết quả là chân lý, Hành động ngay, Đột phá',
          tone: Tone.PROFESSIONAL,
          avatar: '👔'
      },
      {
          id: 'p2',
          name: 'Admin GenZ',
          role: 'Content Creator',
          style: 'Vui vẻ, bắt trend, dùng nhiều slang (slay, keo lỳ, chấn động), nhiều emoji.',
          catchphrases: 'Slay quá trời, Chấn động luôn, Mãi keo',
          tone: Tone.FUNNY,
          avatar: '😎'
      },
      {
          id: 'p3',
          name: 'Chuyên Gia Tận Tâm',
          role: 'Customer Support Lead',
          style: 'Lịch sự, thấu hiểu, ân cần, giải thích chi tiết, đáng tin cậy.',
          catchphrases: 'Luôn lắng nghe bạn, Giải pháp tối ưu, Đồng hành cùng bạn',
          tone: Tone.EDUCATIONAL,
          avatar: '👩‍💼'
      }
  ]);

  // Load settings from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('fb_config');
    if (savedConfig) {
      setFacebookConfig(JSON.parse(savedConfig));
    }
    
    // Load saved personas
    const savedPersonas = localStorage.getItem('personas');
    if (savedPersonas) {
        setPersonas(JSON.parse(savedPersonas));
    }
  }, []);

  // Auto Sync on Load if config exists
  useEffect(() => {
      if (facebookConfig.pageId && facebookConfig.accessToken && !pageProfile) {
          handleSyncData();
      }
  }, [facebookConfig]);

  const handleSaveSettings = (config: FacebookConfig) => {
    setFacebookConfig(config);
    localStorage.setItem('fb_config', JSON.stringify(config));
  };

  const handleSavePersona = (newPersona: Persona) => {
      const updated = [...personas, newPersona];
      setPersonas(updated);
      localStorage.setItem('personas', JSON.stringify(updated));
  }

  // Handle Sync Data Logic
  const handleSyncData = async () => {
      if (!facebookConfig.pageId || !facebookConfig.accessToken) return;
      setIsSyncing(true);
      try {
          // 1. Get Page Profile
          const profile = await getPageProfile(facebookConfig);
          if (profile) setPageProfile(profile);

          // 2. Get Real Posts for Dashboard
          const realPosts = await getPagePosts(facebookConfig);
          // Convert FacebookPostData to internal Post type for consistency
          const mappedPosts: Post[] = realPosts.map(p => ({
              id: p.id,
              topicId: 'sync',
              content: p.message || 'Shared content',
              hashtags: [],
              imagePrompt: '',
              imageBase64: p.full_picture, // Use real image URL as base64 placeholder
              status: PostStatus.PUBLISHED,
              createdAt: new Date(p.created_time),
              likes: p.likes?.summary.total_count || 0,
              comments: p.comments?.summary.total_count || 0,
              shares: p.shares?.count || 0
          }));
          
          if (mappedPosts.length > 0) {
              setPosts(mappedPosts);
          }

      } catch (error) {
          console.error("Sync Error", error);
      } finally {
          setIsSyncing(false);
      }
  };

  // Seed data
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: '1',
      name: 'Tech News Daily',
      description: 'Cập nhật tin tức công nghệ mới nhất, AI, gadget và xu hướng chuyển đổi số.',
      preferredTone: Tone.PROFESSIONAL
    },
    {
      id: '2',
      name: 'Góc Truyền Cảm Hứng',
      description: 'Những câu nói hay, bài học cuộc sống, động lực làm việc buổi sáng.',
      preferredTone: Tone.EMOTIONAL
    },
    {
        id: '3',
        name: 'Flash Sale Alert',
        description: 'Thông báo giảm giá sốc, deal hời trong ngày.',
        preferredTone: Tone.SALES
    }
  ]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'p1',
      topicId: '1',
      content: 'AI đang thay đổi cách chúng ta làm việc như thế nào? 🤖\n\nNăm 2024 đánh dấu bước ngoặt lớn khi AI không còn là khái niệm xa vời...',
      hashtags: ['#AI', '#TechNews', '#FutureOfWork'],
      imagePrompt: 'Futuristic office with robot working alongside human, bright neon lights, cyberpunk style',
      status: PostStatus.PUBLISHED,
      createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      likes: 156,
      comments: 24
    },
    {
      id: 'p2',
      topicId: '2',
      content: 'Đừng bao giờ từ bỏ ước mơ của bạn chỉ vì cần nhiều thời gian để thực hiện. Thời gian rồi cũng sẽ trôi qua thôi. ✨',
      hashtags: ['#Motivation', '#MorningVibes', '#Success'],
      imagePrompt: 'Sunrise over a mountain peak, climber reaching the top, silhouette, golden hour',
      status: PostStatus.SCHEDULED,
      createdAt: new Date(),
      scheduledTime: new Date(Date.now() + 3600000 * 5) // +5 hours
    }
  ]);

  const handleSavePost = (post: Post) => {
      setPosts([post, ...posts]);
      setCurrentView('dashboard'); // Redirect to dashboard to see result
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
            <Dashboard 
                posts={posts} 
                pageProfile={pageProfile} 
                onSync={handleSyncData}
                isSyncing={isSyncing}
            />
        );
      case 'generate':
        return (
          <PostGenerator 
            topics={topics} 
            personas={personas}
            onSavePersona={handleSavePersona}
            onSave={handleSavePost} 
            facebookConfig={facebookConfig}
            onNavigateToSettings={() => setCurrentView('settings')}
          />
        );
      case 'comments':
        return (
          <CommentManager 
            facebookConfig={facebookConfig}
            onNavigateToSettings={() => setCurrentView('settings')}
          />
        );
      case 'topics':
        return <TopicManager topics={topics} setTopics={setTopics} />;
      case 'settings':
        return <Settings config={facebookConfig} onSave={handleSaveSettings} />;
      case 'schedule':
        return (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-bold mb-2">Tính năng Lịch (Calendar View)</h2>
                <p className="text-gray-500">
                    Chức năng này đang được phát triển. Hiện tại bạn có thể xem danh sách bài chờ đăng ở Dashboard.
                </p>
            </div>
        );
      default:
        return (
            <Dashboard 
                posts={posts} 
                pageProfile={pageProfile} 
                onSync={handleSyncData}
                isSyncing={isSyncing}
            />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 ml-72 p-8 overflow-hidden">
        <div className="fade-in max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;