import React from 'react';
import { useStore } from './context/StoreContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/dashboard/Dashboard';
import PostGenerator from './features/posts/PostGenerator';
import CommentManager from './features/comments/CommentManager';
import TopicManager from './features/topics/TopicManager';
import Settings from './features/settings/Settings';

const AppContent: React.FC = () => {
  const { currentView } = useStore();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'generate': return <PostGenerator />;
      case 'comments': return <CommentManager />;
      case 'topics': return <TopicManager />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return <MainLayout>{renderContent()}</MainLayout>;
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;