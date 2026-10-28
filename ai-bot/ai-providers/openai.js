// AI provider: ChatGPT (OpenAI) — openai SDK, Responses API
// ต้องตั้ง OPENAI_API_KEY ใน ai-bot/.env / เปลี่ยนโมเดลได้ด้วย OPENAI_MODEL
import "../env.js";
import OpenAI from "openai";

const model = () => process.env.OPENAI_MODEL || "gpt-5.5";
let client = null;

export default {
  id: "chatgpt",
  label: "ChatGPT",
  envKey: "OPENAI_API_KEY",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),

  async generateJson(prompt, schema) {
    client ??= new OpenAI(); // อ่าน OPENAI_API_KEY จาก env
    let response;
    try {
      response = await client.responses.create({
        model: model(),
        input: prompt,
        reasoning: { effort: "low" },
        // structured output: strict json_schema → ตอบเป็น JSON ตาม schema เท่านั้น
        text: { format: { type: "json_schema", name: "puzzle", schema, strict: true } },
      });
    } catch (err) {
      if (err instanceof OpenAI.AuthenticationError) throw new Error("ChatGPT API key is invalid (check OPENAI_API_KEY)");
      if (err instanceof OpenAI.RateLimitError) throw new Error("ChatGPT is busy or out of quota, try again later");
      if (err instanceof OpenAI.APIConnectionError) throw new Error("cannot reach ChatGPT (check internet connection)");
      if (err instanceof OpenAI.APIError) throw new Error(`ChatGPT error ${err.status}`);
      throw err;
    }
    if (response.status === "incomplete") throw new Error("ChatGPT stopped before finishing the puzzle");
    if (!response.output_text) throw new Error("ChatGPT returned no puzzle");
    return JSON.parse(response.output_text);
  },
};
