// api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY. Set it in .env.local (local) or Vercel Env.",
      });
    }

    const message =
      (req.body && (req.body as any).message) ||
      (typeof req.body === "string" ? (() => { try { return JSON.parse(req.body).message; } catch { return undefined; } })() : undefined);

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // まずは軽量モデル（必要なら gemini-1.5-pro などに変更OK）
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return res.status(200).json({ text });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message ?? "Server error",
    });
  }
}
