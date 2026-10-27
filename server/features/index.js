// ทะเบียน Feature เสริม (Part 3)
// core (server/index.js) เรียก feature ผ่าน 4 ฟังก์ชันในไฟล์นี้เท่านั้น จึงเพิ่มหรือลบ feature ได้โดยไม่แก้ core
// วิธีเพิ่ม feature: สร้างไฟล์ใน server/features/ ที่ export object ตามรูปด้านล่าง แล้ว import มาใส่ใน `features`
//
//   export default {
//     name: "ping",
//     // (ไม่บังคับ) เรียกครั้งเดียวตอน server เริ่ม ได้ { io, clients, groups, now }
//     init(app) { ... },
//     // (ไม่บังคับ) รับ HTTP request ได้ ถ้าจัดการแล้วให้ return true ถ้าไม่ใช่ของตัวเองให้ return false
//     handleHttp(req, res) { ... },
//     // (ไม่บังคับ) เพิ่ม socket.on(...) ของ feature ให้ socket ที่เพิ่งเชื่อมต่อ
//     setupSocket(socket, ctx) { ... },
//     // (ไม่บังคับ) core ส่งข้อความกลุ่มให้สมาชิกเสร็จแล้ว (ผ่านการตรวจสิทธิ์ R11 แล้ว) ใช้ส่งต่อออกนอกระบบ
//     onGroupMessage(msg) { ... },
//   };
//
// ctx = { io, clients, groups, requireName, sendError, now } เป็นตัวเดียวกับที่ core ใช้ (ดู HandbookFeatures.md)

import cloud from "./cloud.js";
import discord from "./discord.js";

const features = [cloud, discord];

// เรียกจาก core ครั้งเดียว หลังสร้าง io และ state (clients, groups)
export function initFeatures(app) {
  for (const f of features) f.init?.(app);
}

// เรียกจาก HTTP handler ของ core: feature ตัวแรกที่ return true เป็นผู้ตอบ request นั้น
// ไม่มีใครรับ → core ตอบ 404 เหมือนเดิม (R2: ไม่มี REST สำหรับข้อความแชท)
export function handleHttp(req, res) {
  return features.some((f) => f.handleHttp?.(req, res) === true);
}

// เรียกจาก io.on("connection") ของ core ทุกครั้งที่มี socket ใหม่
export function setupSocket(socket, ctx) {
  for (const f of features) f.setupSocket?.(socket, ctx);
}

// เรียกจาก core หลังส่ง group_msg ให้สมาชิกแล้ว (msg = { group, from, text, timestamp })
export function onGroupMessage(msg) {
  for (const f of features) f.onGroupMessage?.(msg);
}

export const featureNames = () => features.map((f) => f.name);
