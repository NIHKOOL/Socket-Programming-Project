// R10: เข้ากลุ่มได้ด้วยตัวเองเท่านั้น
import { io, URL, wait, check, done } from "./helpers.mjs";

function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, ok: [], errors: [], groups: null, gm: [], lists: 0 };
  s.on("join_group_ok", ({ group }) => c.ok.push(group));
  s.on("error_msg", (e) => c.errors.push(e.code));
  s.on("group_list", ({ groups }) => ((c.groups = groups), c.lists++));
  s.on("group_msg", (m) => c.gm.push(m.text));
  if (name) s.emit("register", { name });
  return c;
}
const members = (c, g) => JSON.stringify(c.groups?.find((x) => x.name === g)?.members);

const C1 = client("C1"), C2 = client("C2"), C3 = client("C3"), U = client(null);
await wait(250);
C1.s.emit("create_group", { group: "g1" });
await wait(200);
check("after create: C2, C3 NOT auto-added", members(C2, "g1") === '["C1"]');

// creator / anyone tries to add someone else — payload names must be ignored
C1.s.emit("join_group", { group: "g1", name: "C2" });
C1.s.emit("join_group", { group: "g1", member: "C2", members: ["C2", "C3"] });
await wait(200);
check("creator cannot add C2 via join_group payload", members(C3, "g1") === '["C1"]');
check("...creator gets ALREADY_MEMBER instead", C1.errors.filter((e) => e === "ALREADY_MEMBER").length === 2);
C3.s.emit("join_group", { group: "g1", name: "C2" });
await wait(200);
check("C3 joining with name:'C2' adds C3 (self), not C2", members(C1, "g1") === '["C1","C3"]');
C3.s.emit("leave_group", { group: "g1" }); // not an event — ignored

C1.s.emit("group_msg", { group: "g1", text: "before C2 joins" });
await wait(150);
check("non-member C2 gets no group_msg before joining", C2.gm.length === 0);

const listsBefore = C1.lists;
C2.s.emit("join_group", { group: "g1" });
await wait(200);
check("C2 joins by itself → join_group_ok", C2.ok.join() === "g1");
check("everyone sees g1:[C1,C3,C2]", [C1, C2, C3].every((c) => members(c, "g1") === '["C1","C3","C2"]'));
check("only the joiner gets join_group_ok", C1.ok.length === 0 && C3.ok.join() === "g1");
check("join triggers exactly one group_list broadcast", C1.lists === listsBefore + 1);

C1.s.emit("group_msg", { group: "g1", text: "after C2 joins" });
await wait(150);
check("C2 receives messages after joining (in room)", C2.gm.join() === "after C2 joins");
check("C2 does not receive history before join", !C2.gm.includes("before C2 joins"));

const listsBefore2 = C1.lists;
C2.s.emit("join_group", { group: "g1" });
await wait(150);
check("join again → ALREADY_MEMBER, no extra broadcast", C2.errors.includes("ALREADY_MEMBER") && C1.lists === listsBefore2);

C2.s.emit("join_group", { group: "nope" });
C2.s.emit("join_group", {});
await wait(150);
check("unknown / missing group → GROUP_NOT_FOUND x2", C2.errors.filter((e) => e === "GROUP_NOT_FOUND").length === 2);
U.s.emit("join_group", { group: "g1" });
await wait(150);
check("unregistered → NOT_REGISTERED", U.errors.includes("NOT_REGISTERED") && members(C1, "g1") === '["C1","C3","C2"]');

for (const c of [C1, C2, C3]) c.s.disconnect();
await wait(200);
const C4 = client("C4");
await wait(200);
C4.s.emit("join_group", { group: "g1" });
await wait(200);
check("can join a group that has no members left", members(C4, "g1") === '["C4"]' && C4.ok.join() === "g1");

for (const c of [C4, U]) c.s.disconnect();
done();
