// Smoke test: ไล่ flow หลักของทุก requirement แบบสั้น ๆ
import { io, URL, wait, check, done } from "./helpers.mjs";

const log = {};
function mk(name) {
  const s = io(URL, { transports: ["websocket"] });
  log[name] = [];
  for (const ev of ["register_ok", "error_msg", "private_msg", "group_msg"]) s.on(ev, (p) => log[name].push([ev, p]));
  s.on("user_list", (p) => (log[name].users = p.users));
  s.on("group_list", (p) => (log[name].groups = p.groups));
  s.emit("register", { name });
  return s;
}
const a = mk("alice"), b = mk("bob"), c = mk("carol");
await wait(300);
const dup = mk("alice"); await wait(200);
const dupLog = log["alice"]; // overwritten by dup; inspect last error
check("R3 NAME_TAKEN", dupLog.some(([e, p]) => e === "error_msg" && p.code === "NAME_TAKEN"));
check("R4 user list", JSON.stringify([...log.bob.users].sort()) === '["alice","bob","carol"]');
a.emit("private_msg", { to: "bob", text: "hi bob" }); await wait(200);
const pm = (n) => log[n].filter(([e]) => e === "private_msg").length;
check("R7 private: bob=1 carol=0", pm("bob") === 1 && pm("carol") === 0);
a.emit("create_group", { group: "g1" }); await wait(200);
check("R8/R9 group created with creator only", JSON.stringify(log.carol.groups) === '[{"name":"g1","members":["alice"]}]');
c.emit("group_msg", { group: "g1", text: "x" }); await wait(200);
check("R11 non-member rejected", log.carol.some(([e, p]) => e === "error_msg" && p.code === "NOT_A_MEMBER"));
b.emit("join_group", { group: "g1" }); await wait(200);
a.emit("group_msg", { group: "g1", text: "hello g1" }); await wait(200);
const gm = (n) => log[n].filter(([e]) => e === "group_msg").length;
check("R10/R11 group msg: bob=1 carol=0", gm("bob") === 1 && gm("carol") === 0);
b.disconnect(); await wait(200);
check("disconnect cleans up", !log.carol.users.includes("bob") && !log.carol.groups[0].members.includes("bob"));
for (const s of [a, c, dup]) s.disconnect();
done();
