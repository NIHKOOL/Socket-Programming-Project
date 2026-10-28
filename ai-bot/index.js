// AI bot: client อีกตัวหนึ่งของ chat server (รันแยกจาก server: npm run bot)
//
//   Client ══socket══> Server ══socket══> AI bot ──HTTPS──> Claude / ChatGPT / Gemini API
//   Client <══socket══ Server <══socket══ AI bot   (bot ส่งคำใบ้ / คำตอบเป็น group_msg เหมือนผู้ใช้พิมพ์)
//
// - login ด้วยชื่อ "AI" + รหัสลับ AI_BOT_TOKEN (server สงวนชื่อนี้ไว้ ผู้ใช้ปลอมเป็น AI ไม่ได้)
// - รับคำสั่ง /guess ที่ server ส่งต่อมาทาง event "bot_request" แล้วตอบผ่าน ack
// - เข้ากลุ่มเอง (join_group, R10) แล้วพูดในกลุ่มด้วย group_msg (R11) → ทุกข้อความของ AI วิ่งผ่าน server
//   server log จะเห็น: [recv] AI -> group_msg {"group":"g1","text":"[Gemini] hint 1/10: ..."}
// - API key ของ AI อยู่ที่ ai-bot/.env เท่านั้น server ไม่รู้ key และไม่รู้คำตอบ

import "./env.js";
import { io } from "socket.io-client";
import * as game from "./game.js";

export const BOT_NAME = "AI";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const TOKEN = process.env.AI_BOT_TOKEN;
const JOIN_TIMEOUT_MS = 5000;

if (!TOKEN) {
  console.error("AI_BOT_TOKEN is not set — put the same value in ai-bot/.env and server/.env (see ai-bot/.env.example)");
  process.exit(1);
}

// reconnection: true (ต่างจาก client ของผู้ใช้) → server restart แล้ว bot กลับมาเอง
const socket = io(SERVER_URL, { transports: ["websocket"], reconnection: true });
let memberOf = new Set(); // กลุ่มที่ bot เป็นสมาชิกอยู่ (อ่านจาก group_list ที่ server broadcast, R9)

// ---- ส่งเข้า server ----
function say(group, text) {
  console.log(`[send] group_msg #${group}: ${text}`);
  socket.emit("group_msg", { group, text });
}

// เข้ากลุ่มเอง ถ้ายังไม่ได้เป็นสมาชิก แล้วรอ server ยืนยัน (join_group_ok)
function join(group) {
  if (memberOf.has(group)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = (err) => {
      clearTimeout(timer);
      socket.off("join_group_ok", onOk);
      socket.off("error_msg", onErr);
      err ? reject(err) : resolve();
    };
    const onOk = (m) => m.group === group && (memberOf.add(group), done());
    const onErr = (e) => {
      if (e.code === "ALREADY_MEMBER") return memberOf.add(group), done();
      if (e.code === "GROUP_NOT_FOUND") done(new Error(e.message)); // error อื่น (เช่นของ group_msg) ไม่เกี่ยวกับการ join
    };
    const timer = setTimeout(() => done(new Error("no reply to join_group")), JOIN_TIMEOUT_MS);
    socket.on("join_group_ok", onOk);
    socket.on("error_msg", onErr);
    console.log(`[send] join_group #${group}`);
    socket.emit("join_group", { group });
  });
}

game.setup({ say, join });

// ---- รับจาก server ----
socket.on("connect", () => {
  console.log(`[bot] connected to ${SERVER_URL} — registering as "${BOT_NAME}"`);
  socket.emit("register", { name: BOT_NAME, token: TOKEN });
});

socket.on("register_ok", ({ name }) => console.log(`[bot] online as ${name} — waiting for /guess commands`));

socket.on("error_msg", ({ code, message }) => {
  console.log(`[bot] error from server: ${code} ${message ?? ""}`);
  // ชื่อถูกสงวน (token ไม่ตรง) หรือมี bot อีกตัวใช้ชื่อนี้อยู่แล้ว → รันต่อไม่มีประโยชน์
  if (code === "NAME_RESERVED" || code === "NAME_TAKEN") {
    console.error("[bot] cannot log in as AI — check that AI_BOT_TOKEN matches server/.env and only one bot is running");
    process.exit(1);
  }
});

socket.on("group_list", ({ groups }) => {
  memberOf = new Set(groups.filter((g) => g.members.includes(BOT_NAME)).map((g) => g.name));
});

// คำสั่ง /guess ที่ server ส่งต่อมา: { event, from, group, category, ai } → ตอบผ่าน ack (server ส่งต่อให้คนสั่ง)
socket.on("bot_request", async (req, ack) => {
  console.log(`[recv] bot_request ${req.event} from ${req.from}${req.group ? ` #${req.group}` : ""}`);
  let reply;
  try {
    reply = await game.handleRequest(req);
  } catch (err) {
    reply = { ok: false, code: "BOT_ERROR", message: err.message };
  }
  if (typeof ack === "function") ack(reply);
});

// ข้อความในกลุ่มที่ bot เป็นสมาชิก = คำทาย (ข้ามข้อความของ bot เอง)
socket.on("group_msg", (msg) => {
  if (msg.from === BOT_NAME && !msg.source) return;
  game.onGroupMessage(msg);
});

// Feature ping: ให้คนอื่น /ping AI ได้เหมือนผู้ใช้ทั่วไป
socket.on("ping_probe", (_payload, ack) => typeof ack === "function" && ack({ ok: true }));

socket.on("disconnect", (reason) => {
  console.log(`[bot] disconnected (${reason}) — retrying...`);
  memberOf = new Set();
  game.reset();
});
socket.on("connect_error", (err) => console.log(`[bot] cannot reach ${SERVER_URL}: ${err.message}`));
