import { FacebookConfig, FacebookPage, FacebookPostData, FacebookComment, PageProfile } from "../types";

export const getPagesFromUserToken = async (userAccessToken: string): Promise<FacebookPage[]> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,category,tasks`
    );
    const data = await response.json();
    
    if (data.error) {
       const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${userAccessToken}&fields=id,name`);
       const meData = await meResponse.json();
       
       if (!meData.error && meData.id) {
           return [{
               id: meData.id,
               name: `${meData.name} (Token hiện tại)`,
               access_token: userAccessToken,
               category: 'Unknown'
           }];
       }
       throw new Error(data.error.message);
    }
    
    return data.data || [];
  } catch (error: any) {
    console.error("Get Pages Error:", error);
    throw error;
  }
};

export const getPageProfile = async (config: FacebookConfig): Promise<PageProfile | null> => {
    if (!config.pageId || !config.accessToken) return null;

    try {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${config.pageId}?fields=id,name,picture.width(200).height(200),followers_count,fan_count,cover,about&access_token=${config.accessToken}`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return {
            id: data.id,
            name: data.name,
            picture: data.picture?.data?.url || '',
            followers_count: data.followers_count,
            fan_count: data.fan_count,
            cover: data.cover?.source,
            about: data.about
        };
    } catch (error) {
        console.error("Get Page Profile Error:", error);
        return null;
    }
}

export const publishToFacebookPage = async (
  config: FacebookConfig,
  message: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!config.pageId || !config.accessToken) {
    return { success: false, error: "Chưa cấu hình thông tin Facebook Page." };
  }

  const url = `https://graph.facebook.com/v19.0/${config.pageId}/feed`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        access_token: config.accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.error?.message || "Lỗi không xác định từ Facebook API";
      if (data.error?.code === 190) errorMessage = "Access Token đã hết hạn.";
      else if (data.error?.code === 200) errorMessage = "Lỗi quyền: Thiếu 'pages_manage_posts' hoặc 'pages_read_engagement'.";
      throw new Error(errorMessage);
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Facebook API Error:", error);
    return { success: false, error: error.message };
  }
};

export const publishPhotoToFacebookPage = async (
    config: FacebookConfig,
    message: string,
    base64Image: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!config.pageId || !config.accessToken) {
        return { success: false, error: "Chưa cấu hình thông tin Facebook Page." };
    }

    const url = `https://graph.facebook.com/v19.0/${config.pageId}/photos`;

    try {
        // Convert Base64 to Blob
        const byteCharacters = atob(base64Image);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Create FormData
        const formData = new FormData();
        formData.append('source', blob);
        formData.append('message', message);
        formData.append('access_token', config.accessToken);
        formData.append('published', 'true');

        const response = await fetch(url, {
            method: "POST",
            body: formData, // Fetch tự động set Content-Type là multipart/form-data
        });

        const data = await response.json();

        if (!response.ok) {
            let errorMessage = data.error?.message || "Lỗi upload ảnh Facebook API";
            if (data.error?.code === 200) errorMessage = "Lỗi quyền: Thiếu 'pages_manage_posts' để đăng ảnh.";
            throw new Error(errorMessage);
        }

        return { success: true, id: data.id || data.post_id };

    } catch (error: any) {
        console.error("Facebook Photo Upload Error:", error);
        return { success: false, error: error.message };
    }
}

// --- Comments & Feed ---

export const getPagePosts = async (config: FacebookConfig): Promise<FacebookPostData[]> => {
  if (!config.pageId || !config.accessToken) return [];
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${config.pageId}/feed?fields=id,message,created_time,full_picture,comments.summary(true).limit(0),likes.summary(true).limit(0),shares&limit=25&access_token=${config.accessToken}`
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || [];
  } catch (error) {
    console.error("Get Posts Error:", error);
    throw error;
  }
};

export const getPostComments = async (postId: string, accessToken: string): Promise<FacebookComment[]> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${postId}/comments?fields=id,message,from,created_time,can_reply&limit=50&access_token=${accessToken}`
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || [];
  } catch (error) {
    console.error("Get Comments Error:", error);
    throw error;
  }
};

export const replyToComment = async (commentId: string, message: string, accessToken: string) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });
    const data = await response.json();
    if (data.error) {
        let errorMessage = data.error.message;
        if (data.error.code === 200) errorMessage = "Thiếu quyền trả lời bình luận (pages_manage_engagement).";
        throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error("Reply Error:", error);
    throw error;
  }
};