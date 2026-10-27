// R8: สร้างกลุ่ม เริ่มต้นมีแค่ผู้สร้าง
import { io, URL, wait, check, done } from "./helpers.mjs";

function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, ok: [], errors: [], groups: null, gm: [] };
  s.on("create_group_ok", ({ group }) => c.ok.push(group));
  s.on("error_msg", (e) => c.errors.push(e.code));
  s.on("group_list", ({ groups }) => (c.groups = groups));
  s.on("group_msg", (m) => c.gm.push(m));
  if (name) s.emit("register", { name });
  return c;
}
const members = (c, g) => c.groups?.find((x) => x.name === g)?.members;

const C1 = client("C1"), C2 = client("C2"), U = client(null);
await wait(250);

C1.s.emit("create_group", { group: "g1" });
await wait(200);
check("creator gets create_group_ok", C1.ok.join() === "g1");
check("g1 members = [C1] only (creator)", JSON.stringify(members(C1, "g1")) === '["C1"]');
check("other client sees g1 with only C1 (not auto-added)", JSON.stringify(members(C2, "g1")) === '["C1"]');
check("other client did NOT get create_group_ok", C2.ok.length === 0);

C1.s.emit("create_group", { group: "g2" });
C2.s.emit("create_group", { group: "c2-group" });
await wait(200);
check("one client can create multiple groups", C1.ok.join() === "g1,g2" && JSON.stringify(members(C2, "g2")) === '["C1"]');
check("each creator is sole member of own group", JSON.stringify(members(C1, "c2-group")) === '["C2"]');

C2.s.emit("create_group", { group: "g1" });
C2.s.emit("create_group", { group: "G1" });
C2.s.emit("create_group", { group: "  g1 " });
await wait(200);
check("duplicate / case-insensitive / trimmed → GROUP_EXISTS x3", C2.errors.filter((e) => e === "GROUP_EXISTS").length === 3);
check("...and g1 membership unchanged", JSON.stringify(members(C1, "g1")) === '["C1"]');

C2.errors = [];
C2.s.emit("create_group", { group: "" });
C2.s.emit("create_group", { group: "   " });
C2.s.emit("create_group", { group: "x".repeat(31) });
await wait(200);
check("empty / spaces / 31 chars → INVALID_GROUP x3", C2.errors.filter((e) => e === "INVALID_GROUP").length === 3);
C2.s.emit("create_group", { group: "ห้องเรียน Network 2026 ปี 3 ok" });
await wait(150);
check("30-char Thai group name accepted", C2.ok.includes("ห้องเรียน Network 2026 ปี 3 ok"));

U.s.emit("create_group", { group: "ghost" });
await wait(150);
check("unregistered → NOT_REGISTERED", U.errors.includes("NOT_REGISTERED") && !members(C1, "ghost"));

C1.s.emit("group_msg", { group: "g1", text: "creator msg" });
await wait(150);
check("creator is in the group room (receives own group_msg)", C1.gm.length === 1);
check("non-member C2 does not receive g1 message", C2.gm.length === 0);

C1.s.disconnect();
await wait(200);
check("creator leaves → g1 still exists with no members", JSON.stringify(members(C2, "g1")) === "[]");
C2.errors = [];
C2.s.emit("create_group", { group: "g1" });
await wait(150);
check("empty group's name is still taken", C2.errors.includes("GROUP_EXISTS"));

for (const c of [C2, U]) c.s.disconnect();
done();
