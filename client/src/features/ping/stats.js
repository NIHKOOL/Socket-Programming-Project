// Feature: ping — สรุปผลแบบคำสั่ง ping ของ OS (pure function test ได้จาก server/tests)

const round1 = (n) => Math.round(n * 10) / 10;

// times = RTT (ms) ของ request ที่ได้คำตอบ, sent = จำนวนที่ส่งทั้งหมด
export function summarize(times, sent) {
  const received = times.length;
  const loss = sent === 0 ? 0 : Math.round(((sent - received) / sent) * 100);
  if (received === 0) return { sent, received, loss, min: null, avg: null, max: null };
  const sum = times.reduce((a, b) => a + b, 0);
  return { sent, received, loss, min: round1(Math.min(...times)), avg: round1(sum / received), max: round1(Math.max(...times)) };
}

// จำนวนครั้ง: ไม่ใส่ → 4, จำกัด 1–10 กันกดรัว
export function parseCount(arg) {
  const n = Number.parseInt(arg ?? "", 10);
  return Number.isNaN(n) ? 4 : Math.min(Math.max(n, 1), 10);
}

// /ping            → { target: null, count: 4 }      (วัดกับ server)
// /ping 10         → { target: null, count: 10 }
// /ping C2         → { target: "C2", count: 4 }       (วัดกับผู้ใช้ C2 ผ่าน server)
// /ping C2 10      → { target: "C2", count: 10 }
// /ping @10        → { target: "10", count: 4 }       (ชื่อที่เป็นตัวเลขล้วน ใส่ @ นำหน้า)
export function parsePingArgs(args) {
  const [first, second] = args;
  if (first === undefined || /^\d+$/.test(first)) return { target: null, count: parseCount(first) };
  return { target: first.startsWith("@") ? first.slice(1) : first, count: parseCount(second) };
}

export function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}
