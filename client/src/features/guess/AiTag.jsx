// Feature: guess — ข้อความจาก AI bot (ผู้ใช้ชื่อ "AI" ที่ server สงวนไว้ให้ bot ที่มีรหัสลับเท่านั้น) แสดงป้าย [ai]
// ไม่มี source แปลว่ามาจากผู้ใช้ในแอปจริง (คนใน Discord ที่ชื่อ AI จะมี source: "discord")
import "./guess.css";

export const AI_BOT_NAME = "AI";
export const isFromAi = (msg) => msg.from === AI_BOT_NAME && !msg.source;

export function AiTag() {
  return <span className="ai-tag">[ai]</span>;
}
