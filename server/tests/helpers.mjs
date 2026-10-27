// ตัวช่วยที่ test ทุกไฟล์ใช้ร่วมกัน
// run-all.mjs ตั้ง TEST_URL ให้ชี้ไป server ตัวใหม่ของแต่ละไฟล์
// ถ้ารันไฟล์ test เดี่ยว ๆ จะต่อ server ที่ localhost:3000 (state ของ server ที่รันอยู่จะถูกแก้)
export { io } from "socket.io-client";

export const URL = process.env.TEST_URL ?? "http://localhost:3000";

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

export function check(label, ok) {
  if (ok) passed++;
  else failed++;
  console.log(ok ? "PASS" : "FAIL", label);
}

// เรียกตอนจบไฟล์: บรรทัดสุดท้ายเป็นสรุปผล และ exit code 1 ถ้ามีข้อที่ไม่ผ่าน
export function done() {
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
