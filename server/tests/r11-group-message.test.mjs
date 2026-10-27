// R11: group message เห็นเฉพาะสมาชิก
import { io, URL, wait, check, done } from "./helpers.mjs";

// onAny เก็บทุก event เพื่อพิสูจน์ว่าคนนอกกลุ่มไม่ได้รับ frame group_msg เลย
function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, gm: [], errors: [], all: [] };
  s.onAny((ev, p) => c.all.push(ev));
  s.on("group_msg", (m) => c.gm.push(m));
  s.on("error_msg", (e) => c.errors.push(e.code));
  if (name) s.emit("register", { name });
  return c;
}
const reset = (...cs) => cs.forEach((c) => ((c.gm = []), (c.errors = []), (c.all = [])));
const texts = (c) => c.gm.map((m) => m.text).join("|");

const A = client("A"), B = client("B"), C = client("C"), D = client("D"), U = client(null);
await wait(250);
A.s.emit("create_group", { group: "g1" });
D.s.emit("create_group", { group: "g2" });
await wait(150);
B.s.emit("join_group", { group: "g1" });
await wait(200);
// g1 = [A, B], g2 = [D], C = ไม่อยู่กลุ่มไหน
reset(A, B, C, D, U);

A.s.emit("group_msg", { group: "g1", text: "hello g1" });
await wait(200);
check("member B receives once", texts(B) === "hello g1");
check("sender A receives own echo once", texts(A) === "hello g1");
check("payload: group/from/timestamp set by server", B.gm[0].group === "g1" && B.gm[0].from === "A" && !isNaN(Date.parse(B.gm[0].timestamp)));
check("non-member C receives NO frames at all", C.all.length === 0);
check("member of another group D receives NO frames", D.all.length === 0);
check("unregistered socket receives NO frames", U.all.length === 0);

reset(A, B, C, D);
C.s.emit("group_msg", { group: "g1", text: "intruder" });
await wait(200);
check("non-member C sending → NOT_A_MEMBER", C.errors.includes("NOT_A_MEMBER"));
check("...and nobody receives it", A.gm.length === 0 && B.gm.length === 0);

reset(A, B);
B.s.emit("group_msg", { group: "g1", from: "A", text: "spoof" });
await wait(200);
check("spoofed 'from' ignored (from = B)", A.gm[0]?.from === "B");

reset(A, B, D);
D.s.emit("group_msg", { group: "g2", text: "g2 only" });
await wait(200);
check("groups isolated: g1 members get nothing from g2", A.gm.length === 0 && B.gm.length === 0 && texts(D) === "g2 only");

reset(A, B);
A.s.emit("group_msg", { group: "g1", text: "   " });
A.s.emit("group_msg", { group: "g1", text: "x".repeat(1001) });
A.s.emit("group_msg", { group: "nope", text: "hi" });
U.s.emit("group_msg", { group: "g1", text: "hi" });
await wait(200);
check("empty/too long → INVALID_TEXT x2", A.errors.filter((e) => e === "INVALID_TEXT").length === 2);
check("unknown group → GROUP_NOT_FOUND", A.errors.includes("GROUP_NOT_FOUND"));
check("unregistered → NOT_REGISTERED", U.errors.includes("NOT_REGISTERED"));
check("...none of these delivered", B.gm.length === 0);

// B ออก แล้วมีคนใหม่ใช้ชื่อ B → ต้องไม่ได้สิทธิ์สมาชิกเดิม (members กับ room ต้อง sync)
B.s.disconnect();
await wait(200);
const B2 = client("B");
await wait(200);
reset(A);
A.s.emit("group_msg", { group: "g1", text: "after B left" });
B2.s.emit("group_msg", { group: "g1", text: "new B" });
await wait(200);
check("new client reusing name 'B' does NOT receive g1 messages", B2.gm.length === 0);
check("new 'B' cannot send to g1 (NOT_A_MEMBER)", B2.errors.includes("NOT_A_MEMBER") && texts(A) === "after B left");

reset(A, C);
C.s.emit("join_group", { group: "g1" });
await wait(150);
A.s.emit("group_msg", { group: "g1", text: "welcome C" });
await wait(200);
check("after joining, C receives new messages", texts(C) === "welcome C");

for (const c of [A, C, D, U, B2]) c.s.disconnect();
done();
