// Feature: ping — server ตอบ ack ของ ping_check + ระบบ slash command + สรุปผลแบบ ping ของ OS
import { io, URL, wait, check, done } from "../helpers.mjs";
import { parseInput } from "../../../client/src/features/commands/parse.js";
import { formatUptime, parseCount, parsePingArgs, summarize } from "../../../client/src/features/ping/stats.js";
import { setupPingProbe } from "../../../client/src/features/ping/ping.js";

// ---- server: ping_check + acknowledgement ----
const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
const errors = [];
s.on("error_msg", (e) => errors.push(e.code));

// ยังไม่ register → ไม่ได้ ack (timeout) + NOT_REGISTERED
let early = "acked";
try {
  await s.timeout(500).emitWithAck("ping_check", { seq: 1 });
} catch {
  early = "timeout";
}
check("unregistered: no ack (timeout) + NOT_REGISTERED", early === "timeout" && errors.includes("NOT_REGISTERED"));

s.emit("register", { name: "P" });
await wait(200);

const t0 = performance.now();
const reply = await s.timeout(2000).emitWithAck("ping_check", { seq: 7 });
const rtt = performance.now() - t0;
check("registered: ack returns echoed seq", reply.seq === 7);
check("ack has serverTime / uptimeSec / online", typeof reply.serverTime === "number" && Number.isInteger(reply.uptimeSec) && reply.online === 1);
check("RTT measurable and small on localhost (< 500 ms)", rtt >= 0 && rtt < 500);

const bad = await s.timeout(2000).emitWithAck("ping_check", { seq: "x" });
check("invalid seq → null (no echo of arbitrary data)", bad.seq === null);

const many = await Promise.all([1, 2, 3].map((seq) => s.timeout(2000).emitWithAck("ping_check", { seq })));
check("concurrent pings: each ack matches its own request", many.map((r) => r.seq).join() === "1,2,3");

s.emit("ping_check", { seq: 9 }); // ไม่มี ack → server ต้องไม่ crash
await wait(150);
const after = await s.timeout(2000).emitWithAck("ping_check", { seq: 10 });
check("emit without ack is ignored, server still alive", after.seq === 10);

// ---- /ping <ชื่อ>: P → server → Q (ตอบอัตโนมัติด้วย setupPingProbe ตัวเดียวกับ client) ----
const connect = async (name, withProbe) => {
  const c = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const seen = { probes: [], notes: [] };
  c.on("ping_probe", (p) => seen.probes.push(p));
  if (withProbe) setupPingProbe(c, (from, line) => seen.notes.push({ from, line }));
  c.emit("register", { name });
  await wait(150);
  return { c, seen };
};
const Q = await connect("Q", true); // ตอบ probe อัตโนมัติ
const R = await connect("R", true); // คนนอก
const Z = await connect("Z", false); // ไม่ตอบ probe (เช่น แท็บถูกพัก)

const toQ = await s.timeout(3000).emitWithAck("ping_user", { to: "Q", seq: 1 });
check("ping_user ok: ack has seq + legMs (server↔Q time)", toQ.ok === true && toQ.seq === 1 && toQ.to === "Q" && typeof toQ.legMs === "number" && toQ.legMs >= 0);
check("target receives probe with REAL sender name", Q.seen.probes.length === 1 && Q.seen.probes[0].from === "P");
check("target notified once (seq 1) in DM with sender", Q.seen.notes.length === 1 && Q.seen.notes[0].from === "P");
await s.timeout(3000).emitWithAck("ping_user", { to: "Q", seq: 2 });
check("no extra notification for seq > 1", Q.seen.notes.length === 1);
check("outsider R receives no probe", R.seen.probes.length === 0);

const spoof = await s.timeout(3000).emitWithAck("ping_user", { to: "Q", seq: 3, from: "R" });
check("spoofed from ignored (probe says P)", spoof.ok && Q.seen.probes.at(-1).from === "P");

const missing = await s.timeout(3000).emitWithAck("ping_user", { to: "Nobody", seq: 1 });
check("unknown user → USER_NOT_FOUND", missing.ok === false && missing.code === "USER_NOT_FOUND");
const self = await s.timeout(3000).emitWithAck("ping_user", { to: "P", seq: 1 });
check("ping yourself → SELF", self.ok === false && self.code === "SELF");

const t1 = performance.now();
const silent = await s.timeout(4000).emitWithAck("ping_user", { to: "Z", seq: 1 });
const waited = performance.now() - t1;
check("target that never answers → TIMEOUT after ~2s (server-side)", silent.ok === false && silent.code === "TIMEOUT" && waited >= 1800 && waited < 3500);

const U2 = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
const u2errors = [];
U2.on("error_msg", (e) => u2errors.push(e.code));
let u2 = "acked";
try {
  await U2.timeout(500).emitWithAck("ping_user", { to: "Q", seq: 1 });
} catch {
  u2 = "timeout";
}
check("unregistered sender: no ack + NOT_REGISTERED, target not probed", u2 === "timeout" && u2errors.includes("NOT_REGISTERED") && Q.seen.probes.length === 3);

for (const x of [Q.c, R.c, Z.c, U2]) x.disconnect();
s.disconnect();

// ---- client: แยกคำสั่ง ----
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check("parse '/ping'", eq(parseInput("/ping"), { type: "command", name: "ping", args: [] }));
check("parse '/PING 10' (case-insensitive + args)", eq(parseInput("/PING 10"), { type: "command", name: "ping", args: ["10"] }));
check("parse '//hello' → literal '/hello'", eq(parseInput("//hello"), { type: "text", text: "/hello" }));
check("parse plain text", eq(parseInput("hi /ping"), { type: "text", text: "hi /ping" }));

// ---- client: สรุปผล ----
check("summarize min/avg/max/loss", eq(summarize([10, 12, 14], 4), { sent: 4, received: 3, loss: 25, min: 10, avg: 12, max: 14 }));
check("summarize all lost", eq(summarize([], 3), { sent: 3, received: 0, loss: 100, min: null, avg: null, max: null }));
check("parseCount default 4, clamp 1–10", parseCount(undefined) === 4 && parseCount("0") === 1 && parseCount("50") === 10 && parseCount("abc") === 4);
check(
  "parsePingArgs: server / count / name / name+count / @numeric name",
  eq(parsePingArgs([]), { target: null, count: 4 }) &&
    eq(parsePingArgs(["10"]), { target: null, count: 10 }) &&
    eq(parsePingArgs(["C2"]), { target: "C2", count: 4 }) &&
    eq(parsePingArgs(["C2", "7"]), { target: "C2", count: 7 }) &&
    eq(parsePingArgs(["@10"]), { target: "10", count: 4 })
);
check("formatUptime", formatUptime(42) === "42s" && formatUptime(125) === "2m 5s" && formatUptime(3725) === "1h 2m");

done();
