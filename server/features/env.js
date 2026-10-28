// โหลด server/.env (ถ้ามี) ให้ทุก feature ที่ต้องใช้ค่าลับ (DISCORD_BOT_TOKEN, ANTHROPIC_API_KEY, ...)
// ต้อง import ไฟล์นี้ก่อน feature อื่นใน features/index.js เพื่อให้ env พร้อมก่อน feature อ่านค่า
// test (NODE_ENV=test) ไม่โหลด เพื่อไม่ให้ test ไปต่อบริการจริง (Discord / Claude API)
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV !== "test") {
  try {
    process.loadEnvFile?.(fileURLToPath(new URL("../.env", import.meta.url)));
  } catch {
    // ไม่มีไฟล์ .env ก็ไม่เป็นไร (บน Cloud ตั้ง env ที่ dashboard ของ host)
  }
}
