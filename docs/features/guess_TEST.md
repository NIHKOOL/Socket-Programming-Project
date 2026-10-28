# Feature: guess — เกมทายคำ AI + Checklist (AI บังคับของ Part 3)

**AI (Claude / ChatGPT / Gemini — เลือกได้) คิดคำลับ + คำใบ้ 10 ข้อ** แล้วส่งคำใบ้ให้กลุ่มทีละข้อผ่าน socket ทุก 30 วินาที
ใครพิมพ์ถูกก่อน (**ภาษาอังกฤษเท่านั้น**) ชนะ ครบ 5 นาทีไม่มีผู้ชนะ
**AI เป็น client อีกตัว**: โปรแกรม `ai-bot/` ต่อเข้า server ด้วย Socket.IO แล้ว login เป็นผู้ใช้ชื่อ `AI` ทุกข้อความของ AI จึงวิ่ง AI bot → server → สมาชิกกลุ่ม
การทำงานทีละขั้นพร้อมลิงก์โค้ด: [HandbookFeatures.md → Feature 5](../../HandbookFeatures.md#feature-5--เกมทายคำ-ai-ai-บังคับ)

## 1. ตั้งค่า (ครั้งแรก)

**1.1 ติดตั้ง bot:** `cd ai-bot && npm install`

**1.2 รหัสลับของ bot** (server สงวนชื่อ `AI` ไว้ให้เฉพาะ bot ที่รู้รหัสนี้):
สร้างค่าสุ่ม เช่น `node -e "console.log(crypto.randomUUID())"` แล้วใส่**ค่าเดียวกัน**ใน 2 ไฟล์ (**ห้ามแชร์ / ห้าม commit**)
- `server/.env` (คัดลอกจาก `server/.env.example`): `AI_BOT_TOKEN=...`
- `ai-bot/.env` (คัดลอกจาก `ai-bot/.env.example`): `AI_BOT_TOKEN=...`

**1.3 API key ของ AI (อย่างน้อย 1 เจ้า)** ใส่ใน `ai-bot/.env` เท่านั้น (server ไม่ต้องมี key)

| AI | สร้าง key ที่ | ใส่ใน `ai-bot/.env` | เปลี่ยนโมเดล (ไม่บังคับ) |
|---|---|---|---|
| Claude | [console.anthropic.com](https://console.anthropic.com) → API Keys | `ANTHROPIC_API_KEY=sk-ant-...` | — (`claude-opus-5-5`) |
| ChatGPT | [platform.openai.com](https://platform.openai.com) → API keys | `OPENAI_API_KEY=sk-...` | `OPENAI_MODEL=` (ค่าเริ่มต้น `gpt-5.5`) |
| Gemini | [aistudio.google.com](https://aistudio.google.com) → Get API key | `GEMINI_API_KEY=...` | `GEMINI_MODEL=` (ค่าเริ่มต้น `gemini-flash-latest`) |

- `GUESS_AI_PROVIDER=claude|chatgpt|gemini` = AI ที่ใช้เมื่อไม่ได้ระบุตอนเริ่มเกม (ไม่ตั้ง = ตัวแรกที่มี key: Claude → ChatGPT → Gemini)
- ทุกเจ้าคิดเงินตามการใช้งาน: เรียก AI 1 ครั้งต่อเกม (โจทย์) + 1 ครั้งต่อคำทายผิด (มี cooldown + สูงสุด 40 ครั้งต่อเกม) ตั้ง usage limit / budget ไว้ใน console ของแต่ละเจ้า
- server อยู่เครื่องอื่น → ตั้ง `SERVER_URL=http://<IP ของ server>:3000` ใน `ai-bot/.env`

**1.4 รัน 2 โปรแกรม** (คนละ terminal):

```bash
npm start        # server (หรือ cd server && npm start)
npm run bot      # AI bot → ต้องขึ้น "[bot] online as AI — waiting for /guess commands"
```

เช็กว่าตั้งถูก: ในห้องไหนก็ได้พิมพ์ `/guess ai` → ตัวที่ใส่ key แล้วขึ้น `✓ ready` และรายชื่อออนไลน์มีผู้ใช้ `AI`

## 2. วิธีเล่น

| คำสั่ง (พิมพ์ในห้องกลุ่ม) | ทำอะไร |
|---|---|
| `/guess start` | เริ่มเกม สุ่มหมวด ใช้ AI เริ่มต้น |
| `/guess start animal` | เลือกหมวด: `person` (คนดัง) / `animal` (สัตว์) / `object` (สิ่งของ) |
| `/guess start animal gemini` | เลือกหมวด + AI (`claude` / `chatgpt` / `gemini` · พิมพ์ `gpt`, `openai`, `google` ก็ได้ · ลำดับไหนก็ได้) |
| _(พิมพ์แชทตามปกติ)_ | **ทั้งหมดนับเป็นคำทาย** ไม่ต้องใช้คำสั่ง **ต้องเป็นภาษาอังกฤษ** (ตัวพิมพ์เล็ก/ใหญ่ ช่องว่าง วรรคตอน ไม่สำคัญ) |
| _(ทายผิด)_ | **AI ใบ้เทียบคำทายของเรากับคำตอบจริง** ลงกลุ่ม เช่น `[Gemini] 💬 C2 guessed "seal" — close! ...` (เฉพาะคำทายภาษาอังกฤษ 1–4 คำ, คนละ 1 ครั้งต่อ 5 วินาที, สูงสุด 40 ครั้งต่อเกม) |
| `/guess hints` | ดูคำใบ้ที่ออกไปแล้ว + AI ที่ใช้ (เห็นคนเดียว) |
| `/guess stop` | หยุดเกม + เฉลย (เฉพาะคนที่เริ่ม) |
| `/guess ai` | ดูว่า AI ตัวไหนพร้อมใช้ (มี key ใน `ai-bot/.env` แล้ว) |

## 3. ทดสอบด้วยมือ

login `C1`, `C2`, `C3` → C1 สร้าง `g1`, C2 join (C3 **ไม่** join)

**AI เป็น client อีกตัว**
- [ ] ก่อนรัน bot: `/guess start` → `error: the AI bot is offline (start it with: npm run bot)` / แชทปกติยังใช้ได้
- [ ] รัน `npm run bot` → รายชื่อออนไลน์ของทุกคนมี `AI` เพิ่มขึ้น (R4) / `/ping AI` ได้ผล
- [ ] ลอง login ในเบราว์เซอร์ด้วยชื่อ `AI` หรือ `ai` → `Name "AI" is reserved for the AI bot` (ปลอมเป็น AI ไม่ได้)
- [ ] เริ่มเกม → รายชื่อสมาชิก `g1` มี `AI` เพิ่ม (bot join เอง, R10)
- [ ] **terminal ของ server ระหว่างเกม**: เห็น `[recv] AI -> join_group …` และ `[recv] AI -> group_msg {"group":"g1","text":"[Gemini] hint 1/10: …"}` = ข้อความของ AI เข้ามาทาง socket / ตอน bot login เห็น `"token":"***"` (ไม่หลุดรหัส)
- [ ] terminal ของ bot: เห็น `[recv] bot_request guess_start from C1 #g1` และ `[send] group_msg …` แต่**ไม่มีคำตอบ**
- [ ] ปิด bot ระหว่างเกม (Ctrl+C) → `AI` หายจากรายชื่อ / เปิดใหม่ → `AI` กลับมา และ `/guess start` ได้อีก

**เกม**
- [ ] `/guess ai` → เห็น claude / chatgpt / gemini พร้อมสถานะ `✓ ready` หรือ `✗ set <KEY> in ai-bot/.env`
- [ ] C1 `/guess start animal` ใน `#g1` → ภายในไม่กี่วินาที: `[<AI>] 🎲 C1 started a guessing game — <AI> is thinking of an ANIMAL...` แล้ว `I'm thinking of an ANIMAL ... Type your guess in ENGLISH` + `hint 1/10: ...` (ผู้ส่ง = `AI` พร้อม `[ai]` สีม่วง)
- [ ] **ลองทุก AI ที่มี key**: `/guess start object claude`, `/guess start object chatgpt`, `/guess start object gemini` → ข้อความขึ้นต้นด้วย `[Claude]` / `[ChatGPT]` / `[Gemini]` ตรงกับที่เลือก
- [ ] เลือก AI ที่ไม่มี key → `error: Gemini is not configured (set GEMINI_API_KEY in ai-bot/.env)` เห็นคนเดียว และเกมไม่เริ่ม
- [ ] ทุก 30 วินาทีมีคำใบ้ข้อถัดไปเองโดยไม่มีใครทำอะไร (bot push ผ่าน server)
- [ ] คำใบ้ไม่มีคำตอบ / ตัวอักษรแรก / จำนวนตัวอักษร และค่อย ๆ ง่ายขึ้น
- [ ] C2 ทายผิด (เช่น `seal`) → ภายในไม่กี่วินาที AI ตอบในกลุ่ม `💬 C2 guessed "seal" — …` บอกว่าใกล้/ไกลยังไง **โดยไม่เฉลย** ทุกคนในกลุ่มเห็น
- [ ] C2 ทายผิดรัว ๆ ภายใน 5 วินาที → AI ตอบแค่ครั้งแรก / คนอื่นทายในช่วงเดียวกัน → AI ตอบได้
- [ ] พิมพ์ประโยคยาว (เช่น `I have no idea what this is`) → เป็นแชทปกติ AI ไม่ตอบ
- [ ] C2 ทายเป็น**ภาษาไทย** (แม้ถูกความหมาย) → **ไม่นับ** และ AI ไม่ตอบ
- [ ] C2 พิมพ์คำถูกเป็นภาษาอังกฤษ (ลองตัวพิมพ์ใหญ่ หรือรูปพหูพจน์) → `🎉 C2 got it in …! The answer was …` ทุกคนในกลุ่มเห็น และคำใบ้หยุด
- [ ] **C3 (ไม่ได้ join) ไม่เห็นอะไรเกี่ยวกับเกมเลย**
- [ ] **DevTools → WS → Messages ของ C2 ระหว่างเกม: ไม่มีคำตอบอยู่ใน frame ใดเลย** จนกว่าจะมีคนถูกหรือหมดเวลา
- [ ] `/guess start` ซ้อนตอนมีเกมอยู่ → `a game is already running in this group`
- [ ] C2 `/guess stop` → `only the player who started the game can stop it` / C1 `/guess stop` → หยุด + เฉลย
- [ ] เริ่มใหม่แล้วไม่มีใครทาย 5 นาที → `⏰ time's up — nobody got it. The answer was …`
- [ ] เล่นหลายรอบ → AI ไม่ใช้คำซ้ำกับรอบก่อน ๆ
- [ ] `/guess start` ในห้อง private → `error: /guess works in a group room`
- [ ] (ถ้าเปิด Discord bridge) เล่นในกลุ่ม `#discord` → ข้อความของ AI ขึ้นใน Discord ด้วย และคนใน Discord ทายได้

เก็บหลักฐานที่ `docs/evidence/features/guess/`:
- `guess-full-game.png` — ทั้งเกมตั้งแต่เริ่ม คำใบ้หลายข้อ จนมีคนชนะ
- `guess-server-log.png` — terminal ของ server: `[recv] AI -> group_msg …` (AI ส่งผ่าน socket) + `"token":"***"`
- `guess-bot-terminal.png` — terminal ของ bot: `online as AI`, `bot_request`, `[send] group_msg`
- `guess-three-ais.png` — เกมที่ Claude / ChatGPT / Gemini เป็นพิธีกร (หรือเท่าที่มี key)
- `guess-feedback.png` — ทายผิดแล้ว AI ใบ้เทียบกับคำทาย (`💬 … guessed …`)
- `guess-winner.png` — ข้อความ 🎉 ผู้ชนะ
- `guess-timeout.png` — หมดเวลาไม่มีผู้ชนะ
- `guess-ws-no-answer.png` — DevTools ของผู้เล่นระหว่างเกม: frame คำใบ้ไม่มีคำตอบ
- `guess-outsider.png` — จอ C3 ที่ไม่เห็นเกม
- `guess-name-reserved.png` — login ด้วยชื่อ `AI` แล้วถูกปฏิเสธ

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f05` (ต้อง `npm install` ใน `ai-bot/` ก่อน)
test **เปิด AI bot เป็น process แยกจริง** ให้ต่อ server ของ test แล้วเล่นผ่าน socket ทั้งหมด
`run-all.mjs` ตั้ง `AI_BOT_TOKEN=test-bot-token`, `GUESS_FAKE_AI=1` (โจทย์ปลอม: penguin — **ไม่เรียก AI จริง ไม่เสียเงิน**) และ `GUESS_DURATION_MS=3000` (เกม 3 วินาที)

ผ่าน 49/49: **AI เป็น client อีกตัว** (ชื่อ `AI` / `ai` ไม่มี token หรือ token ผิด → `NAME_RESERVED` ทั้งตอน bot ปิดและเปิด, bot ปิด → `BOT_OFFLINE`, bot login ผ่าน socket แล้วอยู่ใน `user_list`, bot join กลุ่มเองเป็นสมาชิก, ทุกข้อความ AI ขึ้นต้นด้วย `[Gemini]`) /
**ทายผิด → AI ใบ้** (`looksLikeGuess` อังกฤษสั้น vs ไทย/ประโยคยาว, `cleanFeedback` ทิ้งข้อความที่หลุดคำตอบ, ทายผิดแล้วกลุ่มได้คำใบ้, คำใบ้ไม่เฉลย, cooldown ต่อคน, ประโยคยาวไม่เรียก AI, ภาษาไทยไม่เรียก AI) / `normalizeGuess`, `cleanPuzzle` (**อังกฤษเท่านั้น: alias ไทยถูกตัด, คำตอบไม่ใช่อังกฤษถูกปฏิเสธ**, ตัดคำใบ้ที่หลุดคำตอบ),
**เลือก AI** (ชื่อเล่น gpt/openai/google, ไม่มี key เลย, AI ที่เลือกไม่มี key, ชื่อไม่รู้จัก, ค่าเริ่มต้น = ตัวแรกที่มี key, `GUESS_AI_PROVIDER`), แยก argument ของ `/guess start`,
กลุ่มที่ไม่มี / ไม่ใช่สมาชิก / หมวดผิด / AI ไม่รู้จัก (ไม่เริ่มเกม), `guess_ai`, แนะนำ (ENGLISH) + hint 1,
เริ่มซ้อนไม่ได้, **คนนอกไม่ได้รับอะไร**, **คำตอบไม่หลุดไปที่ client ก่อนมีคนถูก**, `guess_hints`, คำใบ้มาเรื่อย ๆ ตามเวลา,
**ทายภาษาไทยไม่ชนะ**, คนอื่นหยุดไม่ได้, **ทายถูกด้วย alias อังกฤษ → ชนะ**, จบแล้วไม่มีคำใบ้ต่อ, ไม่เลือก AI → ใช้ตัวเริ่มต้น, คนเริ่มหยุด → เฉลย, หมดเวลา → ไม่มีผู้ชนะ + เฉลย

ทดสอบเพิ่มด้วยมือ (AI รันแล้ว):
- รัน server + bot + client จริง (โจทย์ปลอม) → server log เห็น `[recv] AI -> register {"name":"AI","token":"***"}`, `[recv] AI -> join_group`, `[recv] AI -> group_msg "[Claude] hint 1/10: …"` ครบทั้งเกมจนมีผู้ชนะ
- ไม่มี key → แจ้งในกลุ่ม ไม่ crash และเริ่มใหม่ได้
- **เรียก API จริงของทั้ง 3 เจ้าด้วย key ปลอม** (ไม่เสียเงิน) → `Claude API key is invalid` / `ChatGPT API key is invalid` / `Gemini API key is invalid` (ยืนยันว่า SDK ทั้ง 3 ตัวต่อ API ได้และแปลง error ถูก)
- หยุดเกมระหว่างที่ AI ยังคิดอยู่ → ไม่มีข้อความ error ซ้ำ และไม่ลบเกมใหม่ของคนอื่น
