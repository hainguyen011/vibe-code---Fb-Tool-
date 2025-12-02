export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum Tone {
  PROFESSIONAL = 'Chuyên nghiệp',
  FUNNY = 'Hài hước',
  EMOTIONAL = 'Cảm xúc',
  CONTROVERSIAL = 'Tranh luận',
  EDUCATIONAL = 'Giáo dục',
  SALES = 'Bán hàng',
}

export interface Persona {
  id: string;
  name: string;
  role: string; // VD: CEO, Admin, Marketing Intern
  avatar?: string; // URL hoặc emoji
  style: string; // VD: Ngắn gọn, súc tích, dùng nhiều emoji
  catchphrases: string; // Các câu cửa miệng
  tone: Tone;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  preferredTone: Tone;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  imagePrompt: string;
  imageBase64?: string;
}

export interface Post {
  id: string;
  topicId: string;
  content: string;
  hashtags: string[];
  imagePrompt: string;
  imageBase64?: string; 
  scheduledTime?: Date;
  status: PostStatus;
  createdAt: Date;
  likes?: number;
  comments?: number;
  shares?: number; // Added shares
}

export interface FacebookConfig {
  pageId: string;
  accessToken: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export interface PageProfile {
  id: string;
  name: string;
  picture: string;
  followers_count?: number;
  fan_count?: number;
  cover?: string;
  about?: string;
}

// New Types for Comment Management
export interface FacebookPostData {
  id: string;
  message: string;
  created_time: string;
  comments?: {
    summary: {
      total_count: number;
    }
  };
  likes?: {
    summary: {
      total_count: number;
    }
  };
  shares?: {
    count: number;
  };
  full_picture?: string; // Ảnh bài post
}

export interface FacebookComment {
  id: string;
  message: string;
  from: {
    name: string;
    id: string;
  };
  created_time: string;
  can_reply: boolean;
}

export interface AutoReplyLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'action';
  message: string;
}