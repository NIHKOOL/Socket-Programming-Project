// Feature: cloud — ให้ server ตัวเดียวเสิร์ฟทั้งหน้าเว็บ (client ที่ build แล้ว) และ Socket.IO
// บน Cloud จะได้ URL เดียว https://<app> ทั้งหน้าเว็บและ wss:// ไม่ต้องตั้ง CORS และต้อง deploy แค่ service เดียว
//
// R2 ยังเหมือนเดิม: HTTP ใช้ส่ง "ไฟล์หน้าเว็บ" เท่านั้น (index.html, js, css)
// path อื่นที่ไม่มีไฟล์ เช่น /messages ยังได้ 404 จาก core และข้อความแชทยังวิ่งผ่าน socket อย่างเดียว

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "client", "dist");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

// แปลง URL path → ไฟล์ใน client/dist ถ้าไม่ใช่ไฟล์ที่มีอยู่จริงในโฟลเดอร์นี้ให้คืน null
function resolveFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlPath, "http://x").pathname);
  } catch {
    return null; // URL encode ผิดรูปแบบ
  }
  if (pathname === "/") pathname = "/index.html";

  const file = resolve(DIST, "." + pathname);
  // กัน path traversal เช่น /../../server/index.js ต้องอยู่ใน client/dist เท่านั้น
  if (!file.startsWith(DIST + sep)) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

// IP จริงของ client: บน Cloud ทุก connection ผ่าน reverse proxy ก่อน
// IP ที่ socket เห็นจึงเป็นของ proxy ส่วน IP จริงอยู่ใน header X-Forwarded-For (ตัวแรกคือ client)
export function realClientIp(socket) {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  return forwarded ? String(forwarded).split(",")[0].trim() : socket.handshake.address;
}

export default {
  name: existsSync(join(DIST, "index.html")) ? "cloud" : "cloud (client/dist not built)",

  handleHttp(req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    const file = resolveFile(req.url);
    if (!file) return false; // ไม่ใช่ไฟล์หน้าเว็บ → ให้ core ตอบ 404

    const type = CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
    // ไฟล์ใน assets/ มี hash ในชื่อ (Vite) จึง cache ได้นาน ส่วน index.html ต้องโหลดใหม่ทุกครั้ง
    const cache = file.includes(`${sep}assets${sep}`) ? "public, max-age=31536000, immutable" : "no-cache";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
    res.end(req.method === "HEAD" ? undefined : readFileSync(file));
    return true;
  },

  setupSocket(socket) {
    // core log IP จาก socket (หลัง proxy จะเป็น IP ของ proxy) จึง log IP จริงเพิ่มถ้ามาผ่าน proxy
    if (socket.handshake.headers["x-forwarded-for"]) {
      console.log(`[cloud] ${socket.id} real client IP: ${realClientIp(socket)}`);
    }
  },
};
