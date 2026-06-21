import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Hàm kiểm tra bình luận xem có độc hại hay không
 * @param {string} message - Nội dung bình luận từ người dùng
 * @returns {Promise<{isToxic: boolean, reason: string}>}
 */
export const checkToxicComment = async (message) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Bạn là một hệ thống kiểm duyệt tự động cho nền tảng livestream. Hãy đánh giá xem bình luận sau đây có chứa nội dung độc hại, chửi thề, phân biệt đối xử, hay xúc phạm không. \nBình luận: "${message}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isToxic: {
              type: Type.BOOLEAN,
              description:
                "Trả về true nếu bình luận có tính chất chửi thề, độc hại, lăng mạ. false nếu an toàn.",
            },
            reason: {
              type: Type.STRING,
              description:
                "Nếu isToxic là true, hãy đưa ra lý do ngắn gọn bằng tiếng Việt (ví dụ: 'Ngôn từ kích động'). Nếu false, để trống.",
            },
          },
          required: ["isToxic", "reason"],
        },
        temperature: 0.1, 
      },
    });
    
    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Lỗi khi gọi AI kiểm duyệt:", error);
    return { isToxic: false, reason: "" };
  }
};
