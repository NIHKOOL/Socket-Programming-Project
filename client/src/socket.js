import { io } from "socket.io-client";

// ค่าเริ่มต้น: server อยู่เครื่องเดียวกับที่เปิดหน้าเว็บนี้ (port 3000)
// ถ้า server อยู่เครื่องอื่น ให้แก้ URL ในหน้า login หรือตั้ง VITE_SERVER_URL ใน client/.env
export const DEFAULT_SERVER_URL =
  import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3000`;

export function connect(url) {
  // transports: ["websocket"] = ข้ามการทำ HTTP long-polling ไปใช้ WebSocket ตรง ๆ
  // reconnection: false = ถ้าหลุดให้ผู้ใช้ login ใหม่เอง เพราะถ้า reconnect อัตโนมัติ
  // server อาจยังไม่ลบชื่อเดิม แล้วตอบ NAME_TAKEN จนรายชื่อออนไลน์ค้าง (R4)
  return io(url, { transports: ["websocket"], reconnection: false });
}
