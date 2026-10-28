// AI bot — เกมทายคำในกลุ่ม: AI คิดคำ + ใบ้ทีละข้อ, ใครพิมพ์ถูกก่อนชนะ, ครบ 5 นาทีไม่มีผู้ชนะ
//
// ไฟล์นี้ไม่รู้จัก socket โดยตรง: index.js ส่งคำสั่งเข้ามา (handleRequest) และให้ฟังก์ชัน say / join ไว้ใช้ตอบ
//   say(group, text) = bot emit "group_msg" เข้า server เหมือนผู้ใช้พิมพ์แชท (R11) → server ส่งต่อให้สมาชิกกลุ่ม
//   join(group)      = bot emit "join_group" เข้ากลุ่มเอง (R10) ก่อนพูดในกลุ่ม / ก่อนรับคำทาย
//
// คำตอบอยู่ที่ bot เท่านั้น (ไม่อยู่ที่ server และ client) client ได้แค่คำใบ้ทีละข้อ
// ใครถูกก่อนตัดสินจาก "ลำดับที่ข้อความมาถึง bot" = ลำดับที่ server ส่งต่อ (socket เส้นเดียว ลำดับไม่สลับ)

import { CATEGORIES, generateFeedback, generatePuzzle, pickProvider, providerStatus } from "./guess-ai.js";

const DURATION_MS = Number(process.env.GUESS_DURATION_MS) || 5 * 60_000;
const RECENT_LIMIT = 30; // จำคำตอบล่าสุด ไม่ให้ AI ใช้ซ้ำ
// ทายผิด → AI ใบ้เทียบกับคำทาย: จำกัดเพื่อไม่ให้กลุ่มรกและค่าใช้จ่ายไม่บาน
const FEEDBACK_COOLDOWN_MS = Number(process.env.GUESS_FEEDBACK_COOLDOWN_MS) || 5000; // ต่อคน
const MAX_FEEDBACK_PER_GAME = Number(process.env.GUESS_MAX_FEEDBACK) || 40;

// ข้อความแบบไหนนับเป็น "คำทาย" ที่ AI จะตอบ: อังกฤษ 1–4 คำ ไม่เกิน 30 ตัวอักษร (ประโยคยาว / ภาษาไทย = แชทปกติ)
export const looksLikeGuess = (text) => {
  const t = String(text ?? "").trim();
  return t.length > 0 && t.length <= 30 && /^[A-Za-z][A-Za-z0-9 .'&!-]*$/.test(t) && t.split(/\s+/).length <= 4;
};

// เทียบคำทาย: ไม่สนตัวพิมพ์ / ช่องว่าง / เครื่องหมายวรรคตอน / a, an, the นำหน้า
// เก็บ \p{M} ไว้ด้วย: สระบน-ล่างและวรรณยุกต์ภาษาไทยเป็น "Mark" ไม่ใช่ "Letter" ถ้าลบทิ้ง คำไทยที่ต่างกันแค่สระจะนับว่าตรงกัน
export function normalizeGuess(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}

const games = new Map(); // ชื่อกลุ่ม → เกม (กลุ่มละ 1 เกม)
const recent = []; // คำตอบที่ใช้ไปแล้ว
let say = () => {};
let join = async () => {};

export function setup(io) {
  say = io.say;
  join = io.join;
}

// ทุกข้อความของเกมขึ้นต้นด้วยชื่อ AI ที่เป็นพิธีกร เช่น "[Gemini] hint 1/10: ..." (ผู้ส่งใน server คือ bot ชื่อ AI เสมอ)
const announce = (group, host, text) => say(group, `[${host}] ${text}`);

const withArticle = (cat) => `${/^[aeiou]/.test(cat) ? "an" : "a"} ${cat.toUpperCase()}`; // an ANIMAL / an OBJECT / a PERSON

const elapsed = (g) => {
  const s = Math.round((Date.now() - g.startedAt) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

function end(group) {
  const g = games.get(group);
  if (!g) return;
  clearInterval(g.hintTimer);
  clearTimeout(g.endTimer);
  games.delete(group);
}

// หลุดจาก server (เช่น server restart → กลุ่มหายหมด) ล้างทุกเกม
export function reset() {
  for (const group of [...games.keys()]) end(group);
}

function nextHint(group) {
  const g = games.get(group);
  if (!g || g.shown >= g.hints.length) return;
  g.shown++;
  announce(group, g.host, `hint ${g.shown}/${g.hints.length}: ${g.hints[g.shown - 1]}`);
}

// เริ่มเกม: ตอบ ack ให้คนสั่งทันที (ไม่ต้องรอ AI) แล้วค่อยคิดโจทย์ต่อเบื้องหลัง
function start({ group, from, category, ai }) {
  if (games.has(group)) return { ok: false, code: "ALREADY_RUNNING" };
  const cat = category ? String(category).toLowerCase() : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  if (!CATEGORIES.includes(cat)) return { ok: false, code: "BAD_CATEGORY" };
  // เลือก AI: ระบุมา (claude / chatgpt / gemini) หรือใช้ค่าเริ่มต้น / ไม่มี key → แจ้งคนสั่งคนเดียว ไม่เริ่มเกม
  let provider;
  try {
    provider = pickProvider(ai);
  } catch (err) {
    return { ok: false, code: "AI_UNAVAILABLE", message: err.message };
  }
  const host = provider.label;

  // จองกลุ่มไว้ก่อน (ระหว่างรอ AI) กันคนกดเริ่มซ้อน
  // slot = ตัวจองของเกมนี้ ใช้เช็กภายหลังว่ายังเป็นเกมเดิมอยู่ไหม (อาจถูก /guess stop แล้วมีคนเริ่มเกมใหม่ระหว่างรอ AI)
  const slot = { status: "thinking", starter: from, host };
  games.set(group, slot);
  run(group, slot, cat, provider);
  return { ok: true, ai: host };
}

async function run(group, slot, cat, provider) {
  const { host, starter } = slot;
  try {
    await join(group); // เข้ากลุ่มเอง (R10) → พูดในกลุ่มได้ + ได้รับคำทายของทุกคน
  } catch (err) {
    if (games.get(group) === slot) games.delete(group);
    return console.log(`[game] cannot join #${group}: ${err.message}`);
  }
  announce(group, host, `🎲 ${starter} started a guessing game — ${host} is thinking of ${withArticle(cat)}...`);

  let puzzle;
  try {
    puzzle = await generatePuzzle(cat, recent, provider);
  } catch (err) {
    if (games.get(group) !== slot) return; // ถูกยกเลิกไปแล้ว ไม่ต้องแจ้งซ้ำ และห้ามลบเกมใหม่ของคนอื่น
    games.delete(group);
    return announce(group, host, `❌ could not start the game: ${err.message}`);
  }
  if (games.get(group) !== slot) return; // ถูกยกเลิกระหว่างรอ AI

  recent.push(puzzle.word);
  if (recent.length > RECENT_LIMIT) recent.shift();
  const g = {
    status: "running",
    starter,
    host,
    aiProvider: provider, // ใช้ AI ตัวเดิมตอบคำทายที่ผิด (ชื่อ field ไม่ชนกับ puzzle.provider ที่เป็นชื่อ AI)
    feedbackCount: 0,
    lastFeedback: new Map(), // ชื่อผู้เล่น → เวลาที่ AI ตอบคำทายครั้งล่าสุด (cooldown)
    ...puzzle,
    answers: new Set([puzzle.word, ...puzzle.aliases].map(normalizeGuess)), // ความลับ อยู่ที่ bot เท่านั้น
    shown: 0,
    startedAt: Date.now(),
  };
  games.set(group, g);
  console.log(`[game] #${group}: ${host} is ready (answer hidden — the bot terminal may be on screen during the demo)`);
  announce(
    group,
    host,
    `I'm thinking of ${withArticle(cat)}. You have ${Math.round(DURATION_MS / 60_000) || "<1"} minutes — first correct guess wins! Type your guess in ENGLISH in this chat.`
  );
  nextHint(group);
  // คำใบ้ที่เหลือกระจายเท่า ๆ กันตลอดเวลาเกม (10 ข้อ / 5 นาที = ทุก 30 วินาที)
  g.hintTimer = setInterval(() => nextHint(group), DURATION_MS / g.hints.length);
  g.endTimer = setTimeout(() => {
    announce(group, host, `⏰ time's up — nobody got it. The answer was ${g.word.toUpperCase()}.`);
    end(group);
  }, DURATION_MS);
}

// คำสั่งจาก client ที่ server ส่งต่อมา (server ตรวจแล้วว่า from มีตัวตนจริงและเป็นสมาชิกกลุ่ม)
// คืนค่า = คำตอบที่ server ส่งกลับไปเป็น ack ของ client
export function handleRequest(req) {
  const { event, group, from } = req;
  if (event === "guess_start") return start(req);

  if (event === "guess_ai") {
    let fallback = null;
    try {
      fallback = pickProvider().label;
    } catch {
      // ไม่มี AI ตัวไหนพร้อมใช้
    }
    return { ok: true, providers: providerStatus(), default: fallback };
  }

  const g = games.get(group);
  if (event === "guess_stop") {
    if (!g) return { ok: false, code: "NO_GAME" };
    if (g.starter !== from) return { ok: false, code: "ONLY_STARTER" };
    announce(group, g.host, g.status === "running" ? `🛑 ${from} stopped the game. The answer was ${g.word.toUpperCase()}.` : `🛑 ${from} cancelled the game.`);
    end(group);
    return { ok: true };
  }
  // ดูคำใบ้ที่ออกไปแล้ว (เผื่อคนเพิ่งเข้ามา) ตอบเฉพาะคนถาม
  if (event === "guess_hints") {
    if (!g || g.status !== "running") return { ok: false, code: "NO_GAME" };
    return { ok: true, ai: g.host, category: g.category, hints: g.hints.slice(0, g.shown), total: g.hints.length, elapsed: elapsed(g) };
  }
  return { ok: false, code: "UNKNOWN_REQUEST" };
}

// ทุกข้อความแชทในกลุ่มที่ bot เป็นสมาชิก (index.js ตัดข้อความของ bot เองออกแล้ว) = คำทาย ถ้ากลุ่มนั้นมีเกมอยู่
export function onGroupMessage(msg) {
  const g = games.get(msg.group);
  if (!g || g.status !== "running") return;
  if (g.answers.has(normalizeGuess(msg.text))) {
    announce(msg.group, g.host, `🎉 ${msg.from} got it in ${elapsed(g)}! The answer was ${g.word.toUpperCase()}.`);
    return end(msg.group);
  }

  // ทายผิด → ให้ AI ใบ้เทียบคำทายกับคำตอบจริง (ไม่เฉลย) แล้วประกาศในกลุ่ม
  if (!looksLikeGuess(msg.text) || g.feedbackCount >= MAX_FEEDBACK_PER_GAME) return;
  const now = Date.now();
  if (now - (g.lastFeedback.get(msg.from) ?? 0) < FEEDBACK_COOLDOWN_MS) return;
  g.lastFeedback.set(msg.from, now);
  g.feedbackCount++;

  const guess = msg.text.trim();
  generateFeedback(g, guess, g.aiProvider, g.hints.slice(0, g.shown)).then((feedback) => {
    if (games.get(msg.group) !== g) return; // มีคนถูก / หมดเวลา / หยุดไปแล้วระหว่างรอ AI → ทิ้ง
    announce(msg.group, g.host, `💬 ${msg.from} guessed "${guess}" — ${feedback ?? "not it, keep trying!"}`);
  });
}
