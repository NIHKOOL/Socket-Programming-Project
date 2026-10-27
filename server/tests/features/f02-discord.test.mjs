// Feature: discord — แปลงข้อความขาเข้า/ขาออก + ปิดตัวเองเมื่อไม่มี token + core ยังทำงานปกติ
// ไม่ต่อ Discord จริง: ทดสอบ pure function ด้วย message ปลอม (รูปร่างเดียวกับ discord.js Message)
import { io, URL, wait, check, done } from "../helpers.mjs";
import discord, { fromDiscordMessage, toDiscordText } from "../../features/discord.js";

// ---- ขาออก: แอป → Discord ----
check("toDiscordText: **from**: text", toDiscordText({ from: "C1", text: "hi all" }) === "**C1**: hi all");
check("toDiscordText: escapes markdown in name", toDiscordText({ from: "*bold*", text: "x" }) === "**\\*bold\\***: x");

// ---- ขาเข้า: Discord → แอป ----
const fakeMsg = (over = {}) => ({
  author: { bot: false, username: "bob123", globalName: "Bob" },
  member: { displayName: "Bobby" },
  cleanContent: "hello from discord",
  attachments: new Map(),
  createdAt: new Date("2026-10-28T10:00:00Z"),
  ...over,
});

const m = fromDiscordMessage(fakeMsg(), "discord");
check(
  "fromDiscordMessage: group_msg payload with source=discord",
  m.group === "discord" && m.text === "hello from discord" && m.source === "discord" && m.timestamp === "2026-10-28T10:00:00.000Z"
);
check("name: server nickname first", m.from === "Bobby");
check("name: falls back to global name", fromDiscordMessage(fakeMsg({ member: null })).from === "Bob");
check("ignores bot messages (incl. our own bot → no loop)", fromDiscordMessage(fakeMsg({ author: { bot: true, username: "bridge" } })) === null);
check("ignores empty message", fromDiscordMessage(fakeMsg({ cleanContent: "   " })) === null);
const withFile = fromDiscordMessage(fakeMsg({ cleanContent: "see", attachments: new Map([["1", { url: "https://cdn.discordapp.com/a.png" }]]) }));
check("attachments appended as URL", withFile.text === "see\nhttps://cdn.discordapp.com/a.png");
const onlyFile = fromDiscordMessage(fakeMsg({ cleanContent: "", attachments: new Map([["1", { url: "https://x/y.png" }]]) }));
check("attachment-only message is kept", onlyFile?.text === "https://x/y.png");
const long = fromDiscordMessage(fakeMsg({ cleanContent: "x".repeat(1500) }));
check("long text truncated to 1000 chars (same limit as core)", long.text.length === 1000 && long.text.endsWith("…"));

// ---- ไม่มี token → feature ปิดตัวเอง ----
check("no token → feature reports off", discord.name.startsWith("discord (off"));

// ---- server ที่รันโดยไม่มี token: ไม่มีกลุ่ม #discord, ไม่ส่ง bridge_info, group_msg ของ core ยังทำงาน ----
const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
const got = { groups: null, bridge: false, gm: [] };
s.on("group_list", ({ groups }) => (got.groups = groups));
s.on("bridge_info", () => (got.bridge = true));
s.on("group_msg", (msg) => got.gm.push(msg));
s.emit("register", { name: "A" });
await wait(200);
check("disabled: no #discord group created", Array.isArray(got.groups) && !got.groups.some((g) => g.name === "discord"));
check("disabled: no bridge_info sent", got.bridge === false);
s.emit("create_group", { group: "g1" });
await wait(150);
s.emit("group_msg", { group: "g1", text: "core still works" });
await wait(200);
check("core group_msg still delivered (onGroupMessage hook is harmless)", got.gm.length === 1 && got.gm[0].source === undefined);

s.disconnect();
done();
