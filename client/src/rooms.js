// R5: ทุกห้องแชทมี id ไม่ซ้ำกัน แยกตามประเภท
//   ห้อง private  → "dm:<ชื่อคู่สนทนา>"
//   ห้อง group    → "group:<ชื่อกลุ่ม>"
export const dmRoomId = (name) => `dm:${name}`;
export const groupRoomId = (group) => `group:${group}`;

export function parseRoomId(roomId) {
  const i = roomId.indexOf(":");
  return { type: roomId.slice(0, i), name: roomId.slice(i + 1) };
}

// private_msg ที่เข้ามาอยู่ห้องของ "อีกฝ่าย" เสมอ
// (เราส่งหา C2 → server echo กลับมา from=เรา to=C2 → ห้อง dm:C2)
// (C2 ส่งหาเรา → from=C2 to=เรา → ห้อง dm:C2 เดียวกัน)
export function roomOfPrivateMsg(msg, me) {
  return dmRoomId(msg.from === me ? msg.to : msg.from);
}
