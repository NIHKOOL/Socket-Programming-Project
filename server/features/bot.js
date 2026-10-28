// Feature: bot — เชื่อม AI bot (ai-bot/ โปรแกรมแยกที่ต่อเข้ามาเป็น client ชื่อ "AI") กับผู้ใช้
//
//   C1 ──guess_start {group, category, ai}──> server ──bot_request (ack)──> AI bot ──HTTPS──> AI API
//   C1 <──ack { ok, ai }── server <──ack──────────────┘
//   AI bot ──join_group / group_msg "[Gemini] hint 1/10: ..."──> server (core R10/R11) ──> สมาชิกกลุ่ม
//
// server ไม่เรียก AI เอง ไม่มี API key และไม่รู้คำตอบ ทำหน้าที่แค่:
//   1. สงวนชื่อ "AI" ให้เฉพาะ bot ที่ส่ง AI_BOT_TOKEN ถูก (ผู้ใช้ปลอมเป็น AI ไม่ได้)
//   2. ตรวจว่าคนสั่งเป็นสมาชิกกลุ่ม แล้วส่งคำสั่งต่อให้ bot พร้อมชื่อคนสั่งที่ server รับรอง (socket.data.name)
//   3. ส่งคำตอบของ bot กลับไปเป็น ack ของคนสั่ง / bot ไม่ได้ต่ออยู่ → BOT_OFFLINE

export const BOT_NAME = "AI";
const RELAYED = ["guess_start", "guess_stop", "guess_hints", "guess_ai"];
const BOT_TIMEOUT_MS = 10_000;

let clients = null;
let groups = null;

const isBotName = (name) => name.toLowerCase() === BOT_NAME.toLowerCase();

export default {
  name: "bot",

  init(app) {
    clients = app.clients;
    groups = app.groups;
  },

  // core เรียกตอน register ก่อนจองชื่อ (R3): ชื่อ "AI" (ตัวพิมพ์ใดก็ได้) ต้องมี token ตรงกับ AI_BOT_TOKEN
  // server ไม่ได้ตั้ง AI_BOT_TOKEN → ไม่มีใครใช้ชื่อ AI ได้เลย
  checkRegister(name, payload) {
    if (!isBotName(name)) return null;
    const token = process.env.AI_BOT_TOKEN;
    if (token && payload?.token === token) return null;
    return { code: "NAME_RESERVED", message: `Name "${name}" is reserved for the AI bot` };
  },

  setupSocket(socket, { requireName }) {
    for (const event of RELAYED) {
      socket.on(event, async (payload = {}, ack) => {
        const reply = (data) => typeof ack === "function" && ack(data);
        const me = requireName();
        if (!me) return;
        const group = payload?.group;
        // ต้องเป็นสมาชิกกลุ่ม (หลักเดียวกับ R11) คนนอกจึงสั่ง / ดูคำใบ้ของกลุ่มอื่นไม่ได้
        if (event !== "guess_ai") {
          const members = groups.get(group);
          if (event === "guess_start" && !members) return reply({ ok: false, code: "GROUP_NOT_FOUND" });
          if (event === "guess_start" && !members.has(me)) return reply({ ok: false, code: "NOT_A_MEMBER" });
          if (!members?.has(me)) return reply({ ok: false, code: "NO_GAME" });
        }

        const bot = clients.get(BOT_NAME);
        if (!bot) return reply({ ok: false, code: "BOT_OFFLINE", message: "the AI bot is offline (start it with: npm run bot)" });
        try {
          // from มาจาก server เสมอ (ไม่ใช้ค่าจาก payload) bot จึงเชื่อได้ว่าใครสั่ง
          const req = { event, from: me, group, category: payload?.category, ai: payload?.ai };
          reply(await bot.timeout(BOT_TIMEOUT_MS).emitWithAck("bot_request", req));
        } catch {
          reply({ ok: false, code: "BOT_TIMEOUT", message: "the AI bot did not answer" });
        }
      });
    }
  },
};
