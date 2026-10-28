// โหลด ai-bot/.env (ถ้ามี): AI_BOT_TOKEN + API key ของ AI (ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY)
// ต้อง import ไฟล์นี้ก่อนไฟล์อื่นที่อ่านค่าลับ
// test (NODE_ENV=test) ไม่โหลด เพื่อไม่ให้ test ไปเรียก AI จริง
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV !== "test") {
  try {
    process.loadEnvFile?.(fileURLToPath(new URL("./.env", import.meta.url)));
  } catch {
    // ไม่มีไฟล์ .env ก็ไม่เป็นไร (ตั้ง env ทางอื่นได้)
  }
}
