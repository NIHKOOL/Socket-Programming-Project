// Feature: ping — บรรทัดผลลัพธ์ของคำสั่ง (เห็นเฉพาะคนสั่ง ไม่มีชื่อผู้ส่ง แสดงแบบ output ของ terminal)
import "./commands.css";

export const systemMessage = (text) => ({ from: "", text, timestamp: new Date().toISOString(), system: true });

export function SystemLine({ text }) {
  return <div className="msg system">{text}</div>;
}
