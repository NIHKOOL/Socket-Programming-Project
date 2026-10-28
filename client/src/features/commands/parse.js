// Feature: ping — ระบบ slash command (ส่วนที่ไม่ใช้ React จึง test ได้จาก server/tests)
//
// แยกข้อความที่พิมพ์ในช่องแชท:
//   "/ping 10"  → { type: "command", name: "ping", args: ["10"] }
//   "//hello"   → { type: "text", text: "/hello" }   (อยากส่งข้อความที่ขึ้นต้นด้วย / จริง ๆ)
//   "hello"     → { type: "text", text: "hello" }
export function parseInput(text) {
  if (text.startsWith("//")) return { type: "text", text: text.slice(1) };
  if (!text.startsWith("/")) return { type: "text", text };
  const [name = "", ...args] = text.slice(1).trim().split(/\s+/);
  return { type: "command", name: name.toLowerCase(), args };
}
