// Feature: guess + bot — เกมทายคำในกลุ่ม โดย AI bot (ai-bot/) เป็น client อีกตัวที่ต่อเข้า server ผ่าน socket
// test นี้เปิด bot เป็น process แยกจริง (ใช้โจทย์ปลอม GUESS_FAKE_AI ไม่เรียก AI จริง, เกมยาว 3 วินาที)
// โจทย์ปลอม: penguin (alias: penguins, และ "เพนกวิน" ที่ต้องถูกตัดทิ้งเพราะทายเป็นอังกฤษเท่านั้น), คำใบ้ 10 ข้อ
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { io, URL, wait, check, done } from "../helpers.mjs";
import { looksLikeGuess, normalizeGuess } from "../../../ai-bot/game.js";
import { cleanFeedback, cleanPuzzle, findProvider, pickProvider } from "../../../ai-bot/guess-ai.js";
import { parseStartArgs } from "../../../client/src/features/guess/commands.js";

const ack = (p, ev, data) => p.s.timeout(3000).emitWithAck(ev, data);
async function player(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const p = { s, ai: [], all: [], users: [], groups: [] };
  s.on("user_list", ({ users }) => (p.users = users));
  s.on("group_list", ({ groups }) => (p.groups = groups));
  s.on("group_msg", (m) => {
    p.all.push(m);
    if (m.from === "AI" && !m.source) p.ai.push(m); // ข้อความจาก AI bot (ชื่อ AI สงวนไว้ให้ bot เท่านั้น)
  });
  s.emit("register", { name });
  await wait(150);
  return p;
}
const lastAi = (p) => p.ai.at(-1)?.text ?? "";

// เปิด AI bot (process แยก) ให้ต่อ server ของ test นี้ รอจน login สำเร็จ
let botLog = "";
function startBot() {
  const entry = fileURLToPath(new globalThis.URL("../../../ai-bot/index.js", import.meta.url)) // URL ของ helpers = ที่อยู่ server;
  const proc = spawn(process.execPath, [entry], { env: { ...process.env, SERVER_URL: URL } });
  return new Promise((resolve, reject) => {
    proc.stdout.on("data", (d) => {
      botLog += d;
      if (botLog.includes("online as AI")) resolve(proc);
    });
    proc.stderr.on("data", (d) => (botLog += d));
    proc.on("exit", (code) => reject(new Error(`bot exited (code ${code}):
${botLog}`)));
  });
}
// ลอง register ชื่อหนึ่ง แล้วคืน code ที่ server ตอบ (register_ok / error code)
async function tryRegister(payload) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const code = await new Promise((resolve) => {
    s.on("register_ok", () => resolve("OK"));
    s.on("error_msg", (e) => resolve(e.code));
    s.emit("register", payload);
  });
  s.disconnect();
  return code;
}

// ---- pure: เทียบคำทาย + ทำความสะอาดโจทย์ ----
check("normalizeGuess: case / spaces / punctuation / article", normalizeGuess("  The Penguin! ") === "penguin" && normalizeGuess("polar bear") === "polarbear");
check("normalizeGuess: Thai words differing only by marks stay different", normalizeGuess("ไก่") !== normalizeGuess("ไก"));
const p1 = cleanPuzzle({ word: "Cat", aliases: ["แมว", "cat", "kitty"], hints: ["It meows.", "A cat is small.", "It likes fish.", "It purrs.", "kitty litter"] }, "animal");
check("cleanPuzzle: English only (Thai alias dropped), dedupe, drop hints that leak the answer", p1.word === "cat" && p1.aliases.join() === "kitty" && p1.hints.length === 3);
let threw = false;
try { cleanPuzzle({ word: "แมว", aliases: [], hints: ["a", "b", "c"] }, "animal"); } catch { threw = true; }
check("cleanPuzzle: non-English answer is rejected", threw);

// ---- คำใบ้เมื่อทายผิด (pure) ----
check("looksLikeGuess: short English = guess", looksLikeGuess("seal") && looksLikeGuess("polar bear") && looksLikeGuess("Elon Musk!"));
check("looksLikeGuess: Thai / long sentence / empty = normal chat", !looksLikeGuess("ยากจัง") && !looksLikeGuess("I think it might be some kind of bird") && !looksLikeGuess("  "));
const pz = { word: "penguin", aliases: ["penguins"], category: "animal" };
check("cleanFeedback: keeps safe sentence", cleanFeedback("Close! It also loves cold water.", pz) === "Close! It also loves cold water.");
check("cleanFeedback: drops feedback that leaks the answer", cleanFeedback("Think of a Penguin!", pz) === null && cleanFeedback("   ", pz) === null);

// ---- เลือก AI (ทดสอบเงื่อนไข key โดยปิดโหมดโจทย์ปลอมชั่วคราวใน process นี้) ----
const saved = { ...process.env };
for (const k of ["GUESS_FAKE_AI", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GUESS_AI_PROVIDER"]) delete process.env[k];
const errOf = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
check("findProvider: aliases gpt/openai → ChatGPT, google → Gemini", findProvider("gpt").label === "ChatGPT" && findProvider("OpenAI").label === "ChatGPT" && findProvider("google").label === "Gemini" && findProvider("x") === null);
check("no key at all → 'no AI is configured'", /no AI is configured/.test(errOf(() => pickProvider())));
check("chosen AI without key → '<AI> is not configured (set <KEY>)'", /Gemini is not configured \(set GEMINI_API_KEY/.test(errOf(() => pickProvider("gemini"))));
check("unknown AI name → error", /unknown AI/.test(errOf(() => pickProvider("llama"))));
process.env.OPENAI_API_KEY = "test";
check("default = first configured (ChatGPT when only OPENAI_API_KEY)", pickProvider().label === "ChatGPT");
process.env.GUESS_AI_PROVIDER = "gemini";
check("GUESS_AI_PROVIDER without key falls back to a configured AI", pickProvider().label === "ChatGPT");
process.env.GEMINI_API_KEY = "test";
check("GUESS_AI_PROVIDER respected when configured", pickProvider().label === "Gemini");
for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
Object.assign(process.env, saved);

// ---- client: แยก argument ของ /guess start ----
check("parseStartArgs: category + ai any order", JSON.stringify(parseStartArgs(["gemini", "Animal"])) === JSON.stringify({ category: "animal", ai: "gemini", unknown: [] }));
check("parseStartArgs: unknown option reported", parseStartArgs(["planet"]).unknown[0] === "planet");

// ---- เกมจริงผ่าน socket: A, B ในกลุ่ม g1 / C ไม่อยู่ในกลุ่ม ----
const A = await player("A"), B = await player("B"), C = await player("C");
A.s.emit("create_group", { group: "g1" });
await wait(100);
B.s.emit("join_group", { group: "g1" });
await wait(150);

// ---- ชื่อ "AI" สงวนไว้ให้ bot ที่มีรหัสลับ ----
check("register as AI without token → NAME_RESERVED", (await tryRegister({ name: "AI" })) === "NAME_RESERVED");
check("register as 'ai' (any case) with wrong token → NAME_RESERVED", (await tryRegister({ name: "ai", token: "nope" })) === "NAME_RESERVED");
const offline = await ack(A, "guess_start", { group: "g1" });
check("bot not running → BOT_OFFLINE with readable message", offline.code === "BOT_OFFLINE" && /npm run bot/.test(offline.message));

const bot = await startBot();
await wait(150);
check("bot logs in over socket as user 'AI' (shows in user_list like a person)", A.users.includes("AI"));
check("register as AI while bot is online (no token) → still NAME_RESERVED", (await tryRegister({ name: "AI" })) === "NAME_RESERVED");

check("start in unknown group → GROUP_NOT_FOUND", (await ack(A, "guess_start", { group: "nope" })).code === "GROUP_NOT_FOUND");
check("non-member C cannot start → NOT_A_MEMBER", (await ack(C, "guess_start", { group: "g1" })).code === "NOT_A_MEMBER");
check("bad category → BAD_CATEGORY", (await ack(A, "guess_start", { group: "g1", category: "planet" })).code === "BAD_CATEGORY");
const badAi = await ack(A, "guess_start", { group: "g1", ai: "llama" });
check("unknown AI → AI_UNAVAILABLE with readable message (game not started)", badAi.code === "AI_UNAVAILABLE" && /unknown AI/.test(badAi.message) && A.ai.length === 0);

const aiList = await ack(A, "guess_ai", {});
check("guess_ai lists Claude / ChatGPT / Gemini + default", aiList.ok && aiList.providers.map((p) => p.label).join() === "Claude,ChatGPT,Gemini" && typeof aiList.default === "string");

const st = await ack(A, "guess_start", { group: "g1", category: "animal", ai: "gemini" });
await wait(200);
check("start with ai=gemini → host is Gemini (every bot message starts with [Gemini])", st.ok && st.ai === "Gemini" && A.ai.length > 0 && A.ai.every((m) => m.text.startsWith("[Gemini] ")));
check("bot joined g1 by itself (R10) → listed as a member", A.groups.find((g) => g.name === "g1")?.members.includes("AI"));
check("members get intro (guess in ENGLISH) + hint 1", lastAiIncludes(A, "thinking of an ANIMAL") && lastAiIncludes(B, "ENGLISH") && B.ai.some((m) => m.text.startsWith("[Gemini] hint 1/10")));
check("second start while running → ALREADY_RUNNING", (await ack(B, "guess_start", { group: "g1" })).code === "ALREADY_RUNNING");
check("outsider C receives nothing from the game", C.all.length === 0);
check("answer NOT leaked to clients before it is guessed", !A.all.some((m) => /penguin/i.test(m.text)));

const h = await ack(B, "guess_hints", { group: "g1" });
check("guess_hints: hints so far + which AI (members only)", h.ok && h.hints.length >= 1 && h.total === 10 && h.ai === "Gemini");
check("guess_hints for outsider → NO_GAME", (await ack(C, "guess_hints", { group: "g1" })).code === "NO_GAME");

await wait(400); // 3s / 10 hints = hint ทุก 300ms
check("hints keep coming over time", B.ai.filter((m) => m.text.startsWith("[Gemini] hint ")).length >= 2);

// ทายผิด → AI ใบ้เทียบกับคำทาย (ทุกคนในกลุ่มเห็น ยกเว้นคนนอก)
B.s.emit("group_msg", { group: "g1", text: "seal" });
await wait(200);
const fb = A.ai.find((m) => m.text.startsWith('[Gemini] 💬 B guessed "seal"'));
check("wrong English guess → AI feedback in group (from Gemini, mentions the guess)", Boolean(fb) && B.ai.some((m) => m.text === fb.text));
check("feedback never reveals the answer", !A.all.some((m) => /penguin/i.test(m.text)));
B.s.emit("group_msg", { group: "g1", text: "walrus" }); // ภายใน cooldown ของ B
A.s.emit("group_msg", { group: "g1", text: "eagle" }); // คนละคน → ตอบได้
await wait(200);
check("cooldown per player: B's 2nd quick guess gets no feedback, A's does", !A.ai.some((m) => m.text.includes('"walrus"')) && A.ai.some((m) => m.text.includes('A guessed "eagle"')));
B.s.emit("group_msg", { group: "g1", text: "I have no idea what this could be at all" }); // ประโยคยาว = แชท
await wait(600);
check("long sentence = normal chat, no AI feedback", !A.ai.some((m) => m.text.includes("no idea")));
check("outsider still receives nothing", C.all.length === 0);

B.s.emit("group_msg", { group: "g1", text: "เพนกวิน" }); // ภาษาไทย → ไม่นับ (ทายเป็นอังกฤษเท่านั้น) และไม่มีคำใบ้
await wait(150);
check("Thai guess does NOT win (English only) and gets no AI feedback", !A.ai.some((m) => m.text.includes("got it")) && !A.ai.some((m) => m.text.includes("เพนกวิน")));
check("non-starter cannot stop → ONLY_STARTER", (await ack(B, "guess_stop", { group: "g1" })).code === "ONLY_STARTER");

B.s.emit("group_msg", { group: "g1", text: "  Penguins! " }); // alias ภาษาอังกฤษ
await wait(150);
check("correct English guess (alias) → B wins, answer revealed by Gemini", lastAi(A).includes("B got it") && lastAi(A).includes("PENGUIN") && lastAi(A).startsWith("[Gemini]"));
check("after win: game over (hints → NO_GAME)", (await ack(A, "guess_hints", { group: "g1" })).code === "NO_GAME");
const countAtEnd = B.ai.length;
await wait(500);
check("no more hints after game ends", B.ai.length === countAtEnd);

// ---- stop / timeout / AI เริ่มต้น ----
const st2 = await ack(A, "guess_start", { group: "g1", category: "animal" });
await wait(150);
check("no AI chosen → default AI used (Claude first)", st2.ok && st2.ai === "Claude");
check("starter stops → answer revealed", (await ack(A, "guess_stop", { group: "g1" })).ok && (await wait(100), lastAi(B).includes("stopped the game") && lastAi(B).includes("PENGUIN")));

await ack(B, "guess_start", { group: "g1", ai: "chatgpt" }); // ไม่ระบุหมวด = สุ่ม
await wait(3300); // GUESS_DURATION_MS = 3000
check("timeout (3s in test) → nobody wins, answer revealed by ChatGPT", lastAi(A).includes("time's up") && lastAi(A).includes("nobody") && lastAi(A).startsWith("[ChatGPT]"));

function lastAiIncludes(p, text) {
  return p.ai.some((m) => m.text.includes(text));
}

for (const p of [A, B, C]) p.s.disconnect();
bot.kill();
done();
