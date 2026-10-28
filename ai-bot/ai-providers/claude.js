// AI provider: Claude (Anthropic) — @anthropic-ai/sdk
// ต้องตั้ง ANTHROPIC_API_KEY ใน ai-bot/.env
import "../env.js";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
let client = null; // สร้างตอนใช้ครั้งแรก (ตอนนั้น env โหลดแล้ว)

export default {
  id: "claude",
  label: "Claude",
  envKey: "ANTHROPIC_API_KEY",
  isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),

  // คืน object ที่ parse จาก JSON ตาม schema แล้ว (structured output)
  async generateJson(prompt, schema) {
    client ??= new Anthropic();
    let response;
    try {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // ถ้าโมเดลปฏิเสธ ให้ server ของ Anthropic ลองโมเดลสำรองให้
        output_config: { effort: "low", format: { type: "json_schema", schema } },
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new Error("Claude API key is invalid (check ANTHROPIC_API_KEY)");
      if (err instanceof Anthropic.RateLimitError) throw new Error("Claude is busy right now, try again in a minute");
      if (err instanceof Anthropic.APIConnectionError) throw new Error("cannot reach Claude (check internet connection)");
      if (err instanceof Anthropic.APIError) throw new Error(`Claude error ${err.status}`);
      throw err;
    }
    if (response.stop_reason === "refusal") throw new Error("Claude declined to make a puzzle, try another category");
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("Claude returned no puzzle");
    return JSON.parse(text);
  },
};
