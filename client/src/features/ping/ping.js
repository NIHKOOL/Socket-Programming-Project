// Feature: ping — คำสั่ง /ping [@ชื่อ] [จำนวน]
// ส่งแบบมี acknowledgement ทีละครั้ง แล้วจับเวลาจนได้คำตอบ = round-trip time (RTT)
import { formatUptime, parsePingArgs, summarize } from "./stats.js";

const TIMEOUT_MS = 3000; // ไม่ได้คำตอบภายใน 3 วินาที = หาย (/ping <ชื่อ>: server รอปลายทาง 2 วินาทีแล้วตอบ TIMEOUT ก่อน)
const INTERVAL_MS = 500; // เว้นระหว่างแต่ละครั้ง
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FAIL_REASON = {
  USER_NOT_FOUND: (to) => `${to} is not online`,
  SELF: () => "cannot ping yourself — use /ping to measure your connection to the server",
};

export async function runPing(socket, print, args) {
  const { target, count } = parsePingArgs(args);
  const host = new URL(socket.io.uri).host;
  const transport = socket.io.engine?.transport?.name ?? "?";
  const plural = count === 1 ? "" : "s";
  print(target ? `PING ${target} via server ${host}: ${count} request${plural}` : `PING ${host} via ${transport}: ${count} request${plural}`);

  const times = [];
  let last = null;
  for (let seq = 1; seq <= count; seq++) {
    const t0 = performance.now();
    try {
      // timeout(): ถ้าไม่ได้ ack ภายในเวลา จะ reject (Socket.IO client >= 4.6)
      if (target) {
        const reply = await socket.timeout(TIMEOUT_MS).emitWithAck("ping_user", { to: target, seq });
        const rtt = performance.now() - t0;
        if (!reply.ok && FAIL_REASON[reply.code]) {
          print(`error: ${FAIL_REASON[reply.code](target)}`); // ไม่มีประโยชน์จะลองต่อ
          return;
        }
        if (!reply.ok) throw new Error(reply.code); // TIMEOUT: ปลายทางไม่ตอบ → นับเป็น loss
        times.push(rtt);
        // แยกช่วง: server จับเวลาช่วง server ↔ ปลายทาง (legMs) ที่เหลือคือช่วงเรา ↔ server
        const leg = reply.legMs;
        print(`reply from ${target}: seq=${seq} time=${rtt.toFixed(1)} ms (you↔server ${(rtt - leg).toFixed(1)} + server↔${target} ${leg.toFixed(1)})`);
      } else {
        last = await socket.timeout(TIMEOUT_MS).emitWithAck("ping_check", { seq });
        const rtt = performance.now() - t0;
        times.push(rtt);
        print(`reply from server: seq=${seq} time=${rtt.toFixed(1)} ms`);
      }
    } catch {
      print(`request timeout: seq=${seq}${target ? ` (${target} did not answer)` : ""}`);
    }
    if (seq < count) await sleep(INTERVAL_MS);
  }

  const s = summarize(times, count);
  const ms = (n) => n.toFixed(1);
  const rtt = s.received > 0 ? ` · min/avg/max = ${ms(s.min)}/${ms(s.avg)}/${ms(s.max)} ms` : "";
  const server = last ? ` · server uptime ${formatUptime(last.uptimeSec)} · ${last.online} online` : "";
  print(`--- ${s.sent} sent, ${s.received} received, ${s.loss}% loss${rtt}${server}`);
}

// ปลายทางของ /ping <ชื่อ>: ตอบ ack ทันที (ก่อนทำอย่างอื่น เพื่อให้เวลาที่วัดได้แม่นที่สุด)
// แล้วบอกผู้ใช้ครั้งเดียวต่อรอบ (seq 1) ว่ามีคน ping มา
// notify(from, line) = แสดงบรรทัดสีเทาในห้อง private กับคนที่ ping มา
export function setupPingProbe(socket, notify) {
  socket.on("ping_probe", ({ from, seq } = {}, ack) => {
    if (typeof ack === "function") ack({ ok: true });
    if (from && seq === 1) notify(from, `${from} is pinging you (/ping ${from} to ping back)`);
  });
}
