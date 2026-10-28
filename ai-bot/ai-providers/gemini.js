// AI provider: Gemini (Google) — @google/genai SDK
// ต้องตั้ง GEMINI_API_KEY (หรือ GOOGLE_API_KEY) ใน ai-bot/.env / เปลี่ยนโมเดลได้ด้วย GEMINI_MODEL
import "../env.js";
import { ApiError, GoogleGenAI } from "@google/genai";

const model = () => process.env.GEMINI_MODEL || "gemini-flash-latest";
const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let client = null;

// Gemini รับ JSON Schema แบบ subset: ตัด additionalProperties ออกให้ปลอดภัย (bot ตรวจผลเองอยู่แล้ว)
const forGemini = (schema) => {
  const { additionalProperties, ...rest } = schema;
  return rest;
};

export default {
  id: "gemini",
  label: "Gemini",
  envKey: "GEMINI_API_KEY",
  isConfigured: () => Boolean(apiKey()),

  async generateJson(prompt, schema) {
    client ??= new GoogleGenAI({ apiKey: apiKey() });
    let response;
    try {
      response = await client.models.generateContent({
        model: model(),
        contents: prompt,
        // structured output: บังคับตอบเป็น JSON ตาม schema
        config: { responseMimeType: "application/json", responseJsonSchema: forGemini(schema) },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) throw new Error("Gemini is busy or out of quota, try again later");
        if (err.status === 401 || err.status === 403 || /api key/i.test(err.message)) throw new Error("Gemini API key is invalid (check GEMINI_API_KEY)");
        throw new Error(`Gemini error ${err.status}`);
      }
      if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(String(err?.message))) throw new Error("cannot reach Gemini (check internet connection)");
      throw err;
    }
    if (!response.text) throw new Error("Gemini returned no puzzle (it may have been blocked)");
    return JSON.parse(response.text);
  },
};
