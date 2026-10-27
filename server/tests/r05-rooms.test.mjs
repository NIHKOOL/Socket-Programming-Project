// R5: ข้อความแยกลงห้องถูกต้อง (ใช้ rooms.js ตัวเดียวกับ client)
import { io, URL, wait, check, done } from "./helpers.mjs";
import { dmRoomId, groupRoomId, parseRoomId, roomOfPrivateMsg } from "../../client/src/rooms.js";

// จำลอง client: แยกข้อความลงห้องด้วยฟังก์ชันเดียวกับ App.jsx
function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const rooms = {};
  const add = (id, m) => (rooms[id] ??= []).push(m.text);
  s.on("private_msg", (m) => add(roomOfPrivateMsg(m, name), m));
  s.on("group_msg", (m) => add(groupRoomId(m.group), m));
  s.emit("register", { name });
  return { s, rooms };
}

check("parseRoomId dm", JSON.stringify(parseRoomId("dm:C2")) === '{"type":"dm","name":"C2"}');
check("parseRoomId keeps ':' in name", parseRoomId("group:a:b").name === "a:b");

const C1 = client("C1"), C2 = client("C2"), C3 = client("C3");
await wait(200);

C1.s.emit("private_msg", { to: "C2", text: "1->2" });
C2.s.emit("private_msg", { to: "C1", text: "2->1" });
C3.s.emit("private_msg", { to: "C1", text: "3->1" });
C1.s.emit("create_group", { group: "g1" });
await wait(150);
C2.s.emit("join_group", { group: "g1" });
await wait(150);
C2.s.emit("group_msg", { group: "g1", text: "g1 from 2" });
await wait(200);

const r = (c, id) => JSON.stringify(c.rooms[id] ?? []);
check("C1 dm:C2 has both directions in one room", r(C1, "dm:C2") === '["1->2","2->1"]');
check("C2 dm:C1 is the same conversation", r(C2, "dm:C1") === '["1->2","2->1"]');
check("C1 dm:C3 is a separate room", r(C1, "dm:C3") === '["3->1"]');
check("C1 group:g1 separate from DMs", r(C1, "group:g1") === '["g1 from 2"]');
check("C2 rooms: dm:C1 + group:g1 only", JSON.stringify(Object.keys(C2.rooms).sort()) === '["dm:C1","group:g1"]');
check("C3 rooms: dm:C1 only (no C1<->C2, no group)", JSON.stringify(Object.keys(C3.rooms)) === '["dm:C1"]');
check("dmRoomId/groupRoomId never collide", dmRoomId("x") !== groupRoomId("x"));

for (const c of [C1, C2, C3]) c.s.disconnect();
done();
