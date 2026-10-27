// Feature: discord — bridge กลุ่ม #discord ในแอป ↔ channel หนึ่งใน Discord server จริง
//
//   แอป (#discord) ──group_msg──> core ──onGroupMessage──> bot โพสต์ใน Discord      (ขาออก)
//   Discord channel ──Gateway (WSS)──> bot ──io.to("group:discord")──> สมาชิกในแอป   (ขาเข้า)
//
// server ของเราเป็น "client" ของ Discord: login ผ่าน Discord Gateway (WebSocket over TLS) เพื่อรับข้อความ
// และส่งข้อความผ่าน Discord REST API (HTTPS) ส่วนแอปของเรากับ client ยังคุยกันผ่าน Socket.IO เหมือนเดิม (R2)
//
// ตั้งค่าผ่าน env (server/.env ตอนรันบนเครื่อง หรือ Environment บน Render):
//   DISCORD_BOT_TOKEN   token ของ bot (ห้าม commit!)
//   DISCORD_CHANNEL_ID  id ของ channel ที่จะ bridge
//   DISCORD_GROUP       ชื่อกลุ่มในแอป (ค่าเริ่มต้น "discord")
// ไม่ได้ตั้ง token หรือ channel → feature ปิดตัวเอง แอปทำงานปกติ

import { fileURLToPath } from "node:url";
import { Client, Events, GatewayIntentBits, RESTEvents, escapeMarkdown } from "discord.js";

// โหลด server/.env (ถ้ามี) ตอนรันบนเครื่อง ส่วน test (NODE_ENV=test) ไม่โหลด เพื่อไม่ให้ test ไปต่อ Discord จริง
if (process.env.NODE_ENV !== "test") {
  try {
    process.loadEnvFile?.(fileURLToPath(new URL("../.env", import.meta.url)));
  } catch {
    // ไม่มีไฟล์ .env ก็ไม่เป็นไร (บน Render ตั้ง env ใน dashboard)
  }
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const GROUP = process.env.DISCORD_GROUP || "discord";
const MAX_TEXT_LENGTH = 1000; // เท่ากับ core (R7, R11)
const enabled = Boolean(TOKEN && CHANNEL_ID);

// ---- แปลงข้อความ (pure function ใช้ใน test ได้โดยไม่ต้องต่อ Discord) ----

// ขาออก: ข้อความกลุ่มในแอป → ข้อความใน Discord เช่น "**C1**: hi"
export function toDiscordText(msg) {
  return `**${escapeMarkdown(msg.from)}**: ${msg.text}`;
}

// ขาเข้า: Discord message → payload group_msg ของแอป (source: "discord" ให้ client แสดงป้ายกำกับ)
// คืน null ถ้าไม่ควรส่งต่อ (ข้อความจาก bot รวมถึงตัวเอง กันวนลูป / ข้อความว่าง)
export function fromDiscordMessage(message, group = GROUP) {
  if (message.author?.bot) return null;
  const parts = [message.cleanContent, ...[...(message.attachments?.values?.() ?? [])].map((a) => a.url)];
  let text = parts.filter(Boolean).join("\n").trim();
  if (!text) return null;
  if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH - 1) + "…";
  return {
    group,
    from: message.member?.displayName ?? message.author?.globalName ?? message.author?.username ?? "unknown",
    text,
    timestamp: (message.createdAt ?? new Date()).toISOString(),
    source: "discord",
  };
}

// ---- ตัว feature ----

let channel = null; // Discord channel ที่ bridge (ได้หลัง bot login สำเร็จ)

export default {
  name: enabled ? `discord (#${GROUP} <-> channel ${CHANNEL_ID})` : "discord (off: set DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID)",

  init({ io, groups }) {
    if (!enabled) return;

    // กลุ่มที่ bridge สร้างไว้ตั้งแต่เริ่ม แบบไม่มีสมาชิก ใครอยากคุยก็ [join] เอง (R10)
    // (feature แตะ groups ได้ที่นี่ที่เดียว ตอนเริ่ม server ยังไม่มีใครสร้างกลุ่มชื่อนี้)
    if (!groups.has(GROUP)) groups.set(GROUP, new Set());

    console.log(`[discord] connecting to Discord Gateway... (group #${GROUP}, channel ${CHANNEL_ID})`);
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    });

    client.once(Events.ClientReady, async (ready) => {
      try {
        channel = await ready.channels.fetch(CHANNEL_ID);
        console.log(`[discord] logged in as ${ready.user.tag}, bridging #${GROUP} <-> #${channel.name}`);
      } catch (err) {
        console.error(`[discord] cannot open channel ${CHANNEL_ID}: ${err.message}`);
      }
    });

    // ขาเข้า: ข้อความใหม่ใน channel → ส่งให้สมาชิกกลุ่มในแอป (เฉพาะ room ของกลุ่ม เหมือน R11)
    client.on(Events.MessageCreate, (message) => {
      if (message.channelId !== CHANNEL_ID || message.author?.bot) return;
      const msg = fromDiscordMessage(message);
      if (!msg) {
        // มีคนพิมพ์แต่เนื้อหาว่าง: เกือบทุกครั้งเกิดจากยังไม่ได้เปิด MESSAGE CONTENT INTENT ใน Developer Portal
        console.warn(`[discord] got an empty message from ${message.author?.username} — enable MESSAGE CONTENT INTENT (Developer Portal → Bot)`);
        return;
      }
      console.log(`[discord] in  <- ${msg.from}: ${msg.text}`);
      io.to(`group:${GROUP}`).emit("group_msg", msg);
    });

    client.on(Events.Error, (err) => console.error(`[discord] ${err.message}`));

    // ---- log วินิจฉัยตอน login: ถ้าค้างจะเห็นว่าค้างที่ขั้นไหน ----
    // debug ของ discord.js แสดงทีละขั้น (ขอ gateway URL → เปิด WebSocket → identify → ready) จะ log เฉพาะก่อน ready
    // และตัดบรรทัดที่มีคำว่า token ทิ้ง เพื่อไม่ให้ token หลุดไปอยู่ใน log ของ Render
    let ready = false;
    client.once(Events.ClientReady, () => (ready = true));
    client.on(Events.Debug, (info) => {
      if (!ready && !/token/i.test(info)) console.log(`[discord][debug] ${info.split("\n")[0]}`);
    });
    // Discord จำกัดจำนวน request (rate limit) → discord.js จะรอเงียบ ๆ จึง log ไว้ให้เห็น
    client.rest.on(RESTEvents.RateLimited, (info) =>
      console.warn(`[discord] rate limited on ${info.method} ${info.route}: retry in ${Math.round(info.timeToReset / 1000)}s (global: ${info.global})`)
    );
    setTimeout(() => {
      if (!ready) {
        console.warn(
          "[discord] still not connected after 30s — Discord may be rate-limiting/blocking this host's shared IP. " +
            "Compare by running locally with the same server/.env"
        );
      }
    }, 30_000).unref();

    client.login(TOKEN).catch((err) => console.error(`[discord] login failed: ${err.message}`));
  },

  // บอก client ว่ากลุ่มไหน bridge กับ Discord (ไว้แสดงป้ายใน UI)
  setupSocket(socket) {
    if (enabled) socket.emit("bridge_info", { group: GROUP, platform: "discord", channel: channel ? `#${channel.name}` : null });
  },

  // ขาออก: ข้อความกลุ่ม (ผ่านการตรวจสิทธิ์ของ core แล้ว) → โพสต์ใน Discord
  // ข้อความที่มาจาก Discord ไม่ผ่าน core จึงไม่ถูกส่งกลับไปซ้ำ (ไม่วนลูป)
  onGroupMessage(msg) {
    if (!enabled || msg.group !== GROUP) return;
    if (!channel) {
      // bot ยังต่อ Discord ไม่สำเร็จ ไม่ข้ามเงียบ ๆ ให้ดูสาเหตุจาก log ตอนเริ่ม (login failed / cannot open channel)
      console.warn(`[discord] not connected to Discord — message from ${msg.from} NOT forwarded (see [discord] startup logs)`);
      return;
    }
    console.log(`[discord] out -> ${msg.from}: ${msg.text}`);
    channel
      .send({ content: toDiscordText(msg), allowedMentions: { parse: [] } }) // ไม่ ping @everyone / @user
      .catch((err) => console.error(`[discord] send failed: ${err.message}`));
  },
};
