
import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, Difficulty } from "../types";
import { DIFFICULTY_CONFIG } from "../constants";

// Use gemini-3-pro-preview for complex reasoning tasks like spatial coordinate mapping
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the level metadata including prompts for images and coordinates of differences.
 */
export async function generateLevelMetadata(theme: string, difficulty: Difficulty): Promise<LevelData> {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded for better spatial coordinate estimation
    contents: `「${theme}」をテーマにした「間違い探しゲーム」の問題を作成してください。
難易度は「${config.label}」です。

【重要】
1. 画像内の物体配置を論理的に考え、(x, y)座標（0〜100）が実際の物体の中心と完全に一致するようにしてください。
2. 座標がずれるとゲームが成立しません。慎重に数値を推定してください。
3. 2枚目の画像は、1枚目をベースに「追加」「削除」「色の変更」「形の変形」のいずれかを行ってください。

以下のJSON形式で返してください。
{
  "theme": "テーマ名",
  "basePrompt": "1枚目の画像の詳細な生成プロンプト（英語）。具体的な物体の配置を含めてください。",
  "modificationPrompt": "2枚目の画像を作成するための指示（英語）。${config.count}つの変更点と、それ以外の背景や物体は「一切変更しない（Maintain absolute identity）」という指示を含めてください。難易度設定: ${config.subtleHint}",
  "differences": [
    {
      "id": "1",
      "description": "変更内容の短い説明（日本語）",
      "x": 物体の中心のX座標（0-100）,
      "y": 物体の中心のY座標（0-100）
    }
  ]
}
※differencesは必ず${config.count}個作成してください。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: { type: Type.STRING },
          basePrompt: { type: Type.STRING },
          modificationPrompt: { type: Type.STRING },
          differences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                description: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ["id", "description", "x", "y"]
            }
          }
        },
        required: ["theme", "basePrompt", "modificationPrompt", "differences"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    differences: data.differences.map((d: any) => ({ ...d, found: false }))
  };
}

/**
 * Generates the base image using text-to-image.
 */
export async function generateBaseImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `High-quality digital art, sharp details, clear boundaries, simple background to minimize noise: ${prompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Base image generation failed.");
}

/**
 * Generates the modified image using image-to-image editing.
 */
export async function generateModifiedImage(baseImageBase64: string, modificationPrompt: string): Promise<string> {
  const base64Data = baseImageBase64.split(',')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Data
          }
        },
        {
          text: `TASK: Modify this image for a 'Spot the Difference' game.
${modificationPrompt}

CRITICAL CONSTRAINTS:
1. PIXEL-PERFECT ALIGNMENT: Every pixel that is NOT part of the requested change MUST remain identical to the original image.
2. NO HALLUCINATIONS: Do not add extra details, noise, or artifacts anywhere else in the image.
3. SAME LIGHTING: Keep shadows and highlights 100% consistent with the source image.
4. COORDINATE ADHERENCE: Ensure the change occurs exactly at the locations implied by the prompt description.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Modified image generation failed.");
}
