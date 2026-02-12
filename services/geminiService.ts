
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";

export interface ParagraphAnalysis {
  voice: VoiceName;
  persona: string;
}

export class GeminiTTSService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * 快速分析段落情境，决定最适合的音色
   */
  async analyzeParagraph(text: string): Promise<ParagraphAnalysis> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `分析以下小说片段的说话者特征。如果是旁白，返回 "narrator"；如果是对话，根据语境判断说话者是：年轻女性、年长男性、小孩、还是普通青年。仅返回结果关键词。片段：${text}` }] }],
      });

      const result = response.text.toLowerCase();
      if (result.includes('年轻女性')) return { voice: VoiceName.KORE, persona: '温柔、知性的女性角色' };
      if (result.includes('年长男性')) return { voice: VoiceName.FENRIR, persona: '威严、苍老的男性角色' };
      if (result.includes('小孩')) return { voice: VoiceName.PUCK, persona: '天真、俏皮的孩子' };
      if (result.includes('对话') || result.includes('普通青年')) return { voice: VoiceName.ZEPHYR, persona: '温和的青年角色' };
      return { voice: VoiceName.CHARON, persona: '沉稳的说书人' };
    } catch {
      return { voice: VoiceName.CHARON, persona: '沉稳的说书人' };
    }
  }

  /**
   * 合成语音，带入角色设定描述
   */
  async synthesizeSpeech(text: string, voiceName: VoiceName, persona: string = '自然阅读'): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `你是一位专业的配音演员。请以【${persona}】的口吻，生动地朗读以下内容：${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS 合成错误:", error);
      return undefined;
    }
  }
}

export const geminiTTSService = new GeminiTTSService();
