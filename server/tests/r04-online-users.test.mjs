// R4: รายชื่อ client ที่ออนไลน์ (รวมตัวเอง) อัปเดต real-time
import { io, URL, wait, check, done } from "./helpers.mjs";

const same = (list, expected) => JSON.stringify([...(list ?? [])].sort()) === JSON.stringify([...expected].sort());

function client(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const c = { s, lists: [] };
  s.on("user_list", ({ users }) => c.lists.push(users));
  if (name) s.emit("register", { name });
  return c;
}
const last = (c) => c.lists.at(-1);

const A = client("A");
await wait(200);
check("A alone sees [A] (includes own name)", same(last(A), ["A"]));

const U = client(null); // connected but never registers
const B = client("B");
await wait(200);
check("B (new joiner) immediately gets full list [A,B]", same(B.lists[0], ["A", "B"]));
check("A updated in real time to [A,B]", same(last(A), ["A", "B"]));

const C = client("C");
await wait(200);
check("all clients see the same list [A,B,C]", [A, B, C].every((c) => same(last(c), ["A", "B", "C"])));
check("every client sees its own name", [["A", A], ["B", B], ["C", C]].every(([n, c]) => last(c).includes(n)));
check("unregistered socket never shown in list", !last(A).some((n) => n === undefined || n === null));
check("unregistered socket receives no user_list", U.lists.length === 0);

C.s.disconnect();
await wait(200);
check("after C leaves, A and B see [A,B]", same(last(A), ["A", "B"]) && same(last(B), ["A", "B"]));

U.s.disconnect();
await wait(200);
check("unregistered socket leaving does not broadcast", A.lists.length === 4);

A.s.disconnect();
B.s.disconnect();
done();
