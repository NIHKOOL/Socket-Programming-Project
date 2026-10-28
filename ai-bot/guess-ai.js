// AI bot — ให้ AI คิดคำลับ + คำใบ้ 10 ข้อ สำหรับเกมทายคำ (ทายเป็นภาษาอังกฤษเท่านั้น)
//
// เลือก AI ได้ 3 เจ้า (ai-bot/ai-providers/): Claude / ChatGPT / Gemini
// ทุกเจ้าใช้ prompt + JSON schema ชุดเดียวกัน (structured output) แล้วผลผ่าน cleanPuzzle ตัวเดียวกัน
// เรียก AI ครั้งเดียวต่อเกม (HTTPS จาก bot) คำตอบอยู่ที่ bot เท่านั้น client ได้แค่คำใบ้ทีละข้อผ่าน socket
//
// ค่าลับใน ai-bot/.env (ห้าม commit): ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY ใส่อย่างน้อย 1 ตัว
// GUESS_AI_PROVIDER = AI ที่ใช้เมื่อไม่ได้ระบุตอนเริ่มเกม (ไม่ตั้ง = ตัวแรกที่มี key ตามลำดับ claude, chatgpt, gemini)
// test: GUESS_FAKE_AI=1 → ทุกเจ้าใช้โจทย์ปลอม ไม่เรียก API จริง (ตั้งใน server/tests/run-all.mjs)

import claude from "./ai-providers/claude.js";
import chatgpt from "./ai-providers/openai.js";
import gemini from "./ai-providers/gemini.js";

export const CATEGORIES = ["person", "animal", "object"];
export const PROVIDERS = [claude, chatgpt, gemini];
const ALIASES = { claude: "claude", anthropic: "claude", chatgpt: "chatgpt", gpt: "chatgpt", openai: "chatgpt", gemini: "gemini", google: "gemini" };
const HINT_COUNT = 10;

// รูปแบบ JSON ที่บังคับให้ AI ตอบ (ใช้กับทุกเจ้า)
const PUZZLE_SCHEMA = {
  type: "object",
  properties: {
    word: { type: "string", description: "the secret answer in English, lowercase" },
    aliases: {
      type: "array",
      items: { type: "string" },
      description: "other accepted English answers: alternative English names, spellings, plural; lowercase; English only",
    },
    hints: { type: "array", items: { type: "string" }, description: `exactly ${HINT_COUNT} hints in English, from vague to very specific` },
  },
  required: ["word", "aliases", "hints"],
  additionalProperties: false,
};

function buildPrompt(category, avoid) {
  const what = {
    person: "a famous real person that most university students in Thailand would know (answer = the name people usually use, in English)",
    animal: "a well-known animal (answer = its common English name)",
    object: "an everyday object (answer = its common English name)",
  }[category];
  return [
    `You are the host of a guessing game played by a group of university students in Thailand. Players must guess in English.`,
    `Secretly choose ${what}.`,
    avoid.length ? `Do not choose any of these (recently used): ${avoid.join(", ")}.` : "",
    `Write ${HINT_COUNT} hints in simple English, ordered from vague to very specific, so the group usually guesses it in 2–4 minutes.`,
    `No hint may contain the answer, any alias, or a spelling giveaway (first letter, letter count, rhymes).`,
    `In "aliases" list every other English answer that should count as correct (alternative names, spellings, plural). English only.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const FAKE_PUZZLE = {
  word: "penguin",
  aliases: ["penguins", "เพนกวิน"], // มีชื่อไทยปนมา เพื่อทดสอบว่า cleanPuzzle ตัดทิ้ง (ทายเป็นอังกฤษเท่านั้น)
  hints: [
    "It is a bird.",
    "It cannot fly.",
    "It is an excellent swimmer.",
    "Most kinds live in the Southern Hemisphere.",
    "It eats fish and krill.",
    "It often lives where it is very cold.",
    "Its body is black and white.",
    "It walks with a waddle.",
    "Emperor and king are two kinds of it.",
    "It slides on ice on its belly.",
  ],
};

const isEnglish = (s) => /^[a-z0-9][a-z0-9 .'&-]*$/.test(s); // ทายเป็นอังกฤษเท่านั้น → คำตอบ/alias ต้องเป็นอักษรอังกฤษ

// ตรวจและทำความสะอาดคำตอบของ AI (structured output บังคับรูปแบบแล้ว แต่ภาษา / จำนวนข้อ / คำใบ้ที่หลุดคำตอบต้องเช็กเอง)
export function cleanPuzzle(raw, category) {
  const word = String(raw?.word ?? "").trim().toLowerCase();
  const aliases = [...new Set((raw?.aliases ?? []).map((a) => String(a).trim().toLowerCase()))].filter((a) => a && a !== word && isEnglish(a));
  const secret = [word, ...aliases].filter((s) => s.length >= 3);
  // ตัดคำใบ้ที่หลุดคำตอบออก (กันกรณี AI เผลอใส่)
  const hints = (raw?.hints ?? [])
    .map((h) => String(h).trim())
    .filter((h) => h && !secret.some((s) => h.toLowerCase().includes(s)))
    .slice(0, HINT_COUNT);
  if (!isEnglish(word) || hints.length < 3) throw new Error("AI returned an unusable puzzle, try again");
  return { word, aliases, category, hints };
}

// ชื่อ AI ที่ผู้ใช้พิมพ์ (claude / chatgpt / gpt / openai / gemini / google) → provider หรือ null
export const findProvider = (name) => PROVIDERS.find((p) => p.id === ALIASES[String(name ?? "").toLowerCase()]) ?? null;

const configured = (p) => Boolean(process.env.GUESS_FAKE_AI) || p.isConfigured();

// สถานะ AI ทุกเจ้า (ใช้กับ /guess ai)
export const providerStatus = () => PROVIDERS.map((p) => ({ id: p.id, label: p.label, envKey: p.envKey, configured: configured(p) }));

// เลือก AI: ระบุมา → ต้องมี key / ไม่ระบุ → GUESS_AI_PROVIDER หรือตัวแรกที่มี key
export function pickProvider(name) {
  if (name) {
    const p = findProvider(name);
    if (!p) throw new Error(`unknown AI "${name}" — use claude, chatgpt or gemini`);
    if (!configured(p)) throw new Error(`${p.label} is not configured (set ${p.envKey} in ai-bot/.env)`);
    return p;
  }
  const preferred = findProvider(process.env.GUESS_AI_PROVIDER);
  if (preferred && configured(preferred)) return preferred;
  const first = PROVIDERS.find(configured);
  if (!first) throw new Error("no AI is configured (set ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY in ai-bot/.env)");
  return first;
}

// คืน { word, aliases, category, hints, provider } หรือ throw Error ที่ข้อความอ่านแล้วเข้าใจ (ส่งให้ผู้เล่นได้)
export async function generatePuzzle(category, avoid, provider) {
  const raw = process.env.GUESS_FAKE_AI ? FAKE_PUZZLE : await provider.generateJson(buildPrompt(category, avoid), PUZZLE_SCHEMA);
  return { ...cleanPuzzle(raw, category), provider: provider.label };
}

// ---- คำใบ้เฉพาะคำทายที่ผิด: AI เทียบคำทายของผู้เล่นกับคำตอบจริง แล้วบอกว่าใกล้/ไกลยังไง (โดยไม่เฉลย) ----

const FEEDBACK_SCHEMA = {
  type: "object",
  properties: { feedback: { type: "string", description: "one short sentence, max 25 words" } },
  required: ["feedback"],
  additionalProperties: false,
};
const MAX_FEEDBACK_LENGTH = 200;

function buildFeedbackPrompt(puzzle, guess, shownHints) {
  return [
    `You are the host of a guessing game. The secret ${puzzle.category} is "${puzzle.word}". Never reveal it.`,
    shownHints.length ? `Hints already given: ${shownHints.join(" | ")}` : "",
    `A player guessed "${guess}", which is wrong.`,
    `In ONE short, friendly English sentence (max 25 words), compare their guess with the secret answer:`,
    `say how close it is and one way it is similar or different, to nudge them toward the answer.`,
    `Do NOT write the answer, any of these words: ${[puzzle.word, ...puzzle.aliases].join(", ")}, its first letter, or its letter count.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ข้อความจาก AI ต้องไม่หลุดคำตอบ (ตรวจที่ bot อีกชั้น) ไม่ผ่าน → null (ให้ผู้เรียกใช้ข้อความกลาง ๆ แทน)
export function cleanFeedback(text, puzzle) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_FEEDBACK_LENGTH);
  if (!t) return null;
  const secret = [puzzle.word, ...puzzle.aliases].filter((s) => s.length >= 3);
  return secret.some((s) => t.toLowerCase().includes(s)) ? null : t;
}

// คืนประโยคใบ้เทียบกับคำทาย หรือ null ถ้า AI ใช้ไม่ได้ / หลุดคำตอบ (ไม่ throw: เกมต้องเล่นต่อได้เสมอ)
export async function generateFeedback(puzzle, guess, provider, shownHints = []) {
  try {
    const raw = process.env.GUESS_FAKE_AI
      ? { feedback: `Not quite — "${guess}" is not it, but you are thinking in the right direction.` }
      : await provider.generateJson(buildFeedbackPrompt(puzzle, guess, shownHints), FEEDBACK_SCHEMA);
    return cleanFeedback(raw?.feedback, puzzle);
  } catch (err) {
    console.warn(`[guess] feedback from ${provider.label} failed: ${err.message}`);
    return null;
  }
}
