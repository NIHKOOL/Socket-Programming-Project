// Feature: guess — คำสั่ง /guess (เกมทายคำที่ AI เป็นคนคิดคำและใบ้) ใช้ได้ในห้องกลุ่มเท่านั้น
// คำทายไม่ต้องใช้คำสั่ง: พิมพ์แชทในกลุ่มตามปกติ (ภาษาอังกฤษ) AI bot (ผู้ใช้ชื่อ AI) เป็นคนเทียบกับคำตอบ
// คำสั่ง /guess ส่งไป server → server ส่งต่อให้ AI bot (server/features/bot.js)
import { parseRoomId } from "../../rooms.js";

const CATEGORIES = ["person", "animal", "object"];
const AIS = ["claude", "chatgpt", "gpt", "openai", "gemini", "google"];

const ERRORS = {
  GROUP_NOT_FOUND: "group not found",
  NOT_A_MEMBER: "you are not a member of this group",
  ALREADY_RUNNING: "a game is already running in this group",
  BAD_CATEGORY: "category must be person, animal or object",
  NO_GAME: "no game is running in this group",
  ONLY_STARTER: "only the player who started the game can stop it",
  BOT_OFFLINE: "the AI bot is offline (start it with: npm run bot)",
};
const USAGE = "/guess start [person|animal|object] [claude|chatgpt|gemini] · /guess hints · /guess stop · /guess ai";

async function act(ctx, event, data) {
  const reply = await ctx.socket.timeout(12000).emitWithAck(event, data); // server รอ bot ได้ถึง 10 วินาที
  if (!reply.ok) ctx.print(`error: ${reply.message ?? ERRORS[reply.code] ?? reply.code}`);
  return reply.ok ? reply : null;
}

// /guess start animal gemini, /guess start gemini, /guess start → แยกหมวดกับชื่อ AI (ลำดับไหนก็ได้)
export function parseStartArgs(args) {
  const out = { category: undefined, ai: undefined, unknown: [] };
  for (const raw of args) {
    const a = raw.toLowerCase();
    if (CATEGORIES.includes(a)) out.category = a;
    else if (AIS.includes(a)) out.ai = a;
    else out.unknown.push(raw);
  }
  return out;
}

export const guessCommands = {
  guess: {
    usage: "/guess start|hints|stop|ai",
    description: "AI word-guessing game for this group (Claude / ChatGPT / Gemini) — guess in English in the chat",
    run: async (ctx, [sub, ...args]) => {
      if (sub === "ai") {
        const r = await act(ctx, "guess_ai", {});
        if (!r) return;
        ctx.print("AI hosts for /guess:");
        for (const p of r.providers) ctx.print(`  ${p.id.padEnd(8)} ${p.configured ? "✓ ready" : `✗ set ${p.envKey} in ai-bot/.env`}`);
        ctx.print(r.default ? `default: ${r.default} (/guess start [category] [ai] to choose)` : "no AI is configured yet");
        return;
      }

      const { type, name: group } = parseRoomId(ctx.room ?? "");
      if (type !== "group") return ctx.print("error: /guess works in a group room — open a #group first");

      if (sub === "start") {
        const { category, ai, unknown } = parseStartArgs(args);
        if (unknown.length) return ctx.print(`error: unknown option "${unknown[0]}" — usage: ${USAGE}`);
        return act(ctx, "guess_start", { group, category, ai });
      }
      if (sub === "stop") return act(ctx, "guess_stop", { group });
      if (sub === "hints") {
        const r = await act(ctx, "guess_hints", { group });
        if (!r) return;
        ctx.print(`${r.category.toUpperCase()} by ${r.ai} · ${r.hints.length}/${r.total} hints · ${r.elapsed} elapsed`);
        r.hints.forEach((h, i) => ctx.print(`  ${i + 1}. ${h}`));
        return;
      }
      ctx.print(`usage: ${USAGE}`);
    },
  },
};
