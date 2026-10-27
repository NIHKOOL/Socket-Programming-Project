// R7: private message เห็นแค่ผู้ส่งกับผู้รับ
import { io, URL, wait, check, done } from "./helpers.mjs";

// เก็บทุก event ที่ client ได้รับ (onAny) เพื่อพิสูจน์ว่าคนนอกไม่ได้รับ frame ใด ๆ ของข้อความ private เลย
function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, pm: [], errors: [], all: [] };
  s.onAny((ev, p) => c.all.push([ev, p]));
  s.on("private_msg", (m) => c.pm.push(m));
  s.on("error_msg", (e) => c.errors.push(e.code));
  if (name) s.emit("register", { name });
  return c;
}
const reset = (...cs) => cs.forEach((c) => ((c.pm = []), (c.errors = []), (c.all = [])));

const C1 = client("C1"), C2 = client("C2"), C3 = client("C3"), U = client(null);
await wait(250);
reset(C1, C2, C3, U);

C1.s.emit("private_msg", { to: "C2", text: "secret 1->2" });
await wait(200);
check("receiver C2 gets the message once", C2.pm.length === 1 && C2.pm[0].text === "secret 1->2");
check("sender C1 gets echo once", C1.pm.length === 1);
check("from/to/timestamp set correctly", C2.pm[0].from === "C1" && C2.pm[0].to === "C2" && !isNaN(Date.parse(C2.pm[0].timestamp)));
check("outsider C3 receives NO frames at all", C3.all.length === 0);
check("unregistered socket receives NO frames at all", U.all.length === 0);

reset(C1, C2, C3);
C3.s.emit("private_msg", { to: "C2", from: "C1", text: "spoof" });
await wait(200);
check("spoofed 'from' ignored: server says from=C3", C2.pm[0]?.from === "C3");

reset(C1, C2, C3);
C1.s.emit("private_msg", { to: "C2", text: "   " });
C1.s.emit("private_msg", { to: "C2", text: "x".repeat(1001) });
C1.s.emit("private_msg", { to: "C2" });
await wait(200);
check("empty / too long / missing text → INVALID_TEXT x3", C1.errors.filter((e) => e === "INVALID_TEXT").length === 3);
check("...and nothing delivered to C2", C2.pm.length === 0);

reset(C1);
C1.s.emit("private_msg", { to: "C2", text: "  trimmed  " });
C1.s.emit("private_msg", { to: "C2", text: "y".repeat(1000) });
C1.s.emit("private_msg", { to: "C2", text: "ภาษาไทย 🙂\nบรรทัดสอง" });
await wait(200);
check(
  "trimmed text, 1000 chars, Thai+emoji+newline delivered exactly",
  JSON.stringify(C1.pm.map((m) => m.text)) === JSON.stringify(["trimmed", "y".repeat(1000), "ภาษาไทย 🙂\nบรรทัดสอง"])
);
check("text is trimmed", C1.pm[0]?.text === "trimmed");

reset(C1);
C1.s.emit("private_msg", { to: "Nobody", text: "hi" });
await wait(150);
check("to offline/unknown user → USER_NOT_FOUND", C1.errors.includes("USER_NOT_FOUND"));

U.s.emit("private_msg", { to: "C2", text: "hi" });
await wait(150);
check("unregistered sender → NOT_REGISTERED", U.errors.includes("NOT_REGISTERED"));

reset(C1, C2);
C1.s.emit("private_msg", { to: "C1", text: "note to self" });
await wait(150);
check("message to self delivered exactly once", C1.pm.length === 1 && C2.pm.length === 0);

for (const c of [C1, C2, C3, U]) c.s.disconnect();
done();
