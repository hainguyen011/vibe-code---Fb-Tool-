import React, { createContext, useContext, useState, useEffect } from 'react';
import { FacebookConfig, PageProfile, Persona, Post, Topic, Tone, ViewType, PostStatus } from '../types';
import { getPageProfile, getPagePosts } from '../services/facebookService';

interface StoreContextType {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Facebook Data
  facebookConfig: FacebookConfig;
  setFacebookConfig: (config: FacebookConfig) => void;
  pageProfile: PageProfile | null;
  
  // App Data
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  personas: Persona[];
  addPersona: (p: Persona) => void;
  posts: Post[];
  addPost: (p: Post) => void;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  
  // Actions
  syncData: () => Promise<void>;
  isSyncing: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>({ pageId: '', accessToken: '' });
  const [pageProfile, setPageProfile] = useState<PageProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initial Data
  const [topics, setTopics] = useState<Topic[]>([
    { id: '1', name: 'Tech News Daily', description: 'Tin tức công nghệ mới.', preferredTone: Tone.PROFESSIONAL },
    { id: '2', name: 'Góc Truyền Cảm Hứng', description: 'Động lực cuộc sống.', preferredTone: Tone.EMOTIONAL },
  ]);

  const [personas, setPersonas] = useState<Persona[]>([
    { id: 'p1', name: 'CEO Quyết Đoán', role: 'CEO', style: 'Chuyên nghiệp', catchphrases: 'Kết quả là chân lý', tone: Tone.PROFESSIONAL, avatar: '👔' },
    { id: 'p2', name: 'Admin GenZ', role: 'Content Creator', style: 'Vui vẻ, slang', catchphrases: 'Slay quá trời', tone: Tone.FUNNY, avatar: '😎' },
  ]);

  const [posts, setPosts] = useState<Post[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('fb_config');
    if (savedConfig) setFacebookConfig(JSON.parse(savedConfig));
    
    const savedPersonas = localStorage.getItem('personas');
    if (savedPersonas) setPersonas(JSON.parse(savedPersonas));
  }, []);

  // Save Config
  useEffect(() => {
    if(facebookConfig.pageId) localStorage.setItem('fb_config', JSON.stringify(facebookConfig));
  }, [facebookConfig]);

  // Sync Logic
  const syncData = async () => {
    if (!facebookConfig.pageId || !facebookConfig.accessToken) return;
    setIsSyncing(true);
    try {
      const profile = await getPageProfile(facebookConfig);
      if (profile) setPageProfile(profile);

      const realPosts = await getPagePosts(facebookConfig);
      const mappedPosts: Post[] = realPosts.map(p => ({
        id: p.id,
        topicId: 'sync',
        content: p.message || 'Media content',
        hashtags: [],
        imagePrompt: '',
        imageBase64: p.full_picture,
        status: PostStatus.PUBLISHED,
        createdAt: new Date(p.created_time),
        likes: p.likes?.summary.total_count || 0,
        comments: p.comments?.summary.total_count || 0,
        shares: p.shares?.count || 0
      }));
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Sync Error", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addPersona = (p: Persona) => {
    const updated = [...personas, p];
    setPersonas(updated);
    localStorage.setItem('personas', JSON.stringify(updated));
  };

  const addPost = (p: Post) => {
      setPosts([p, ...posts]);
  };

  return (
    <StoreContext.Provider value={{
      currentView, setCurrentView,
      facebookConfig, setFacebookConfig, pageProfile,
      topics, setTopics,
      personas, addPersona,
      posts, setPosts, addPost,
      syncData, isSyncing
    }}>
      {children}
    </StoreContext.Provider>
  );
};