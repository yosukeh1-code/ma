import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { message } = req.body || {};

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: message ?? "こんにちは",
    });

    return res.status(200).json({ text: response.output_text });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
