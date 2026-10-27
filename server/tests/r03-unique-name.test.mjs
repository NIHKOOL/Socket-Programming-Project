// R3: ชื่อ client ไม่ซ้ำกัน
import { io, URL, wait, check, done } from "./helpers.mjs";

// register แล้วคืนผลแรกที่ได้: ["ok", name] | ["err", code]  พร้อมนับ user_list ที่ได้รับ
async function tryRegister(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true });
  const res = { s, lists: 0 };
  s.on("user_list", () => res.lists++);
  s.on("register_ok", (p) => (res.result ??= ["ok", p.name]));
  res.errors = [];
  s.on("error_msg", (p) => { res.errors.push(p.code); res.result ??= ["err", p.code]; });
  s.emit("register", { name });
  await wait(200);
  return res;
}

const c1 = await tryRegister("C1");
check("C1 registers", c1.result?.[0] === "ok");

const dup = await tryRegister("C1");
check("exact duplicate → NAME_TAKEN", dup.result?.[1] === "NAME_TAKEN");
check("rejected socket gets no user_list", dup.lists === 0);

check("case-insensitive duplicate (c1) → NAME_TAKEN", (await tryRegister("c1")).result?.[1] === "NAME_TAKEN");
check("whitespace-trimmed duplicate (' C1 ') → NAME_TAKEN", (await tryRegister("  C1 ")).result?.[1] === "NAME_TAKEN");
check("empty name → INVALID_NAME", (await tryRegister("")).result?.[1] === "INVALID_NAME");
check("spaces only → INVALID_NAME", (await tryRegister("   ")).result?.[1] === "INVALID_NAME");
check("21 chars → INVALID_NAME", (await tryRegister("x".repeat(21))).result?.[1] === "INVALID_NAME");
check("20 chars → ok", (await tryRegister("y".repeat(20))).result?.[0] === "ok");
check("Thai name → ok", (await tryRegister("สมชาย")).result?.[0] === "ok");

c1.s.emit("register", { name: "Other" });
await wait(200);
check("register twice on same socket → ALREADY_REGISTERED", c1.errors.includes("ALREADY_REGISTERED"));

c1.s.disconnect();
await wait(200);
check("name freed after disconnect", (await tryRegister("C1")).result?.[0] === "ok");

done();
