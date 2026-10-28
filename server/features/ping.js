// Feature: ping — วัด round-trip time (RTT) ที่ application layer
//
// /ping        วัด client ↔ server
//   client: t0 → emit("ping_check", { seq }, ack) ──WebSocket──> server
//   server: เรียก ack({ ... }) ทันที ──WebSocket──> client: RTT = เวลาที่ได้ ack − t0
//
// /ping <ชื่อ>  วัด client ↔ server ↔ client อีกคน (ไม่มีทางวัดตรงระหว่าง client เพราะทุกอย่างผ่าน server: star topology)
//   C1 ──ping_user──> server ──ping_probe (มี ack)──> C2 (ตอบอัตโนมัติ)
//   C1 <──ack { legMs }── server <──ack──────────────┘
//   legMs = เวลาช่วง server ↔ C2 (server จับเอง) → ช่วง C1 ↔ server = RTT ทั้งหมด − legMs
//
// ใช้ Socket.IO acknowledgement (callback ตัวสุดท้ายของ emit) ซึ่ง Socket.IO จับคู่คำตอบกับคำขอให้เองด้วย packet id
// ต่างจาก:
//   - ICMP ping ของ OS (network layer): ของเราวัดทั้งทาง TCP + WebSocket + Socket.IO + event loop ของ server
//   - heartbeat ของ Engine.IO (packet "2" ping / "3" pong ที่เห็นใน DevTools ตอน R2): ใช้ตรวจว่า connection ยังอยู่ ไม่ได้วัดเวลาให้ผู้ใช้

const MAX_SEQ = 1_000_000;
const PROBE_TIMEOUT_MS = 2000; // server รอ client ปลายทางตอบ (client ผู้สั่งรอนานกว่านี้ จึงได้คำตอบ TIMEOUT จาก server ก่อน)

const cleanSeq = (seq) => (Number.isInteger(seq) && seq >= 0 && seq <= MAX_SEQ ? seq : null);

export default {
  name: "ping",

  setupSocket(socket, { requireName, clients }) {
    // /ping: client ↔ server
    socket.on("ping_check", (payload, ack) => {
      if (typeof ack !== "function") return; // ต้องส่งแบบมี ack เท่านั้น ไม่งั้นไม่มีที่ให้ตอบ
      if (!requireName()) return; // ยังไม่ register → error_msg NOT_REGISTERED และไม่ตอบ ack (client จะ timeout)
      ack({
        seq: cleanSeq(payload?.seq),
        serverTime: Date.now(),
        uptimeSec: Math.round(process.uptime()),
        online: clients.size,
      });
    });

    // /ping <ชื่อ>: client ↔ server ↔ client อีกคน
    socket.on("ping_user", (payload, ack) => {
      if (typeof ack !== "function") return;
      const from = requireName();
      if (!from) return;
      const seq = cleanSeq(payload?.seq);
      const target = clients.get(payload?.to);
      if (!target) return ack({ ok: false, code: "USER_NOT_FOUND", seq });
      if (target === socket) return ack({ ok: false, code: "SELF", seq });

      // ส่ง probe ไปหาปลายทางแบบมี ack: from มาจาก socket ของผู้สั่ง (ปลอมเป็นคนอื่นไม่ได้)
      const t0 = performance.now();
      target.timeout(PROBE_TIMEOUT_MS).emit("ping_probe", { from, seq }, (err) => {
        if (err) return ack({ ok: false, code: "TIMEOUT", seq }); // ปลายทางไม่ตอบ (เช่น เน็ตหลุด / แท็บถูกพัก)
        ack({ ok: true, seq, to: payload.to, legMs: performance.now() - t0 });
      });
    });
  },
};
