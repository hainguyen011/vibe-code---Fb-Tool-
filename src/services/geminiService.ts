import { GoogleGenAI, Type } from "@google/genai";
import { Tone, Persona } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePostContent = async (
  topicName: string,
  topicDescription: string,
  persona: Persona,
  additionalContext: string
) => {
  const modelId = "gemini-2.5-flash";

  const systemInstruction = `
    Bạn là một chuyên gia Content Creator, và bạn đang NHẬP VAI vào một nhân vật cụ thể để viết bài đăng Facebook.
    
    THÔNG TIN NHÂN VẬT (PERSONA) CỦA BẠN:
    - Tên: ${persona.name}
    - Vai trò: ${persona.role}
    - Phong cách viết (Style): ${persona.style}
    - Các câu cửa miệng/từ ngữ hay dùng: "${persona.catchphrases}"
    - Tone giọng chủ đạo: ${persona.tone}

    NHIỆM VỤ:
    Viết một bài đăng Facebook về chủ đề được yêu cầu, nhưng phải thể hiện rõ cá tính của nhân vật trên.
  `;

  const prompt = `
    Chủ đề chính: ${topicName}
    Mô tả chi tiết: ${topicDescription}
    Bối cảnh thêm: ${additionalContext}
    
    Hãy nhập vai ${persona.name} và viết bài ngay!
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING },
          },
          required: ["content", "hashtags", "imagePrompt"],
        },
      },
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("Không nhận được phản hồi từ AI.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  const modelId = 'gemini-2.5-flash-image';
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "4:3" } },
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

export const generateCommentReply = async (
  userComment: string,
  postContent: string,
  tone: string = "Thân thiện, hài hước"
) => {
  const modelId = "gemini-2.5-flash";
  const systemInstruction = `
    Bạn là admin Fanpage. Trả lời comment:
    - Phong cách: ${tone}.
    - Ngắn gọn (dưới 30 từ).
    - Tự nhiên, như người thật chat.
  `;

  const prompt = `
    Bài viết: "${postContent}"
    Comment: "${userComment}"
    Trả lời:
  `;

  try {
     const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "text/plain",
      }
    });
    return response.text || "";
  } catch (error) {
      console.error("Gemini Reply Error", error);
      return "Cảm ơn bạn đã quan tâm!";
  }
}