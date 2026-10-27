// R9: เห็นกลุ่มทั้งหมดพร้อมสมาชิก
import { io, URL, wait, check, done } from "./helpers.mjs";

function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, lists: [] };
  s.on("group_list", ({ groups }) => c.lists.push(groups));
  if (name) s.emit("register", { name });
  return c;
}
const last = (c) => JSON.stringify(c.lists.at(-1));
const members = (c, g) => JSON.stringify(c.lists.at(-1)?.find((x) => x.name === g)?.members);

const C1 = client("C1"), C2 = client("C2");
await wait(200);
check("no groups yet → empty list", last(C1) === "[]");

C1.s.emit("create_group", { group: "g1" });
await wait(100);
C2.s.emit("create_group", { group: "g2" });
await wait(200);
check("both clients see groups from BOTH creators", last(C1).includes('"g1"') && last(C1).includes('"g2"'));
check("non-member sees group + its member list (C2 sees g1:[C1])", members(C2, "g1") === '["C1"]');
check("all clients receive identical list", last(C1) === last(C2));

const C3 = client("C3");
await wait(200);
check("new joiner C3 immediately gets all existing groups", last(C3) === last(C1) && C3.lists.length === 1);

C3.s.emit("join_group", { group: "g1" });
await wait(200);
check("join → everyone sees updated members g1:[C1,C3]", [C1, C2, C3].every((c) => members(c, "g1") === '["C1","C3"]'));

C1.s.disconnect();
await wait(200);
check("disconnect → member removed everywhere g1:[C3]", [C2, C3].every((c) => members(c, "g1") === '["C3"]'));
check("group list order = creation order (g1, g2)", JSON.stringify(C2.lists.at(-1).map((g) => g.name)) === '["g1","g2"]');

C3.s.disconnect();
await wait(200);
check("group with no members still listed (team decision)", members(C2, "g1") === "[]");

const U = client(null);
await wait(200);
check("unregistered socket receives no group_list", U.lists.length === 0);

for (const c of [C2, U]) c.s.disconnect();
done();
