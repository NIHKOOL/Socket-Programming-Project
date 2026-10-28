# CLAUDE.md

Term project วิชา Computer Network: แอปแชท Client–Server ด้วย Socket Programming
โจทย์เต็ม: `Computer_Network_Term_Project_Socket_Programming.pdf` · สถานะ requirement: `README.md`

## ข้อบังคับจากโจทย์ (ห้ามละเมิด)

- โค้ด client กับ server ต้อง**แยกไฟล์**กัน (`client/` กับ `server/`)
- ข้อความแชทระหว่าง server กับ client ต้องส่ง**ผ่าน socket เท่านั้น** (R2) ห้ามใช้ REST/HTTP polling หรือ database กลางแทน
- ต้องรันข้ามคอมพิวเตอร์จริงได้ (client ≥ 2 ตัวบนคนละเครื่อง) ห้าม hardcode `localhost` ให้รับ host/port จาก argument หรือ config
- Private message ต้องเห็นได้แค่ผู้ส่งกับผู้รับ ส่วน group message ต้องเห็นได้แค่สมาชิก โดย**ตรวจสิทธิ์ที่ฝั่ง server**
- การเข้ากลุ่มต้องให้ผู้ใช้เข้าเอง ผู้สร้างกลุ่มดึงคนอื่นเข้าไม่ได้ (R10)
- Part 3 ต้องมีฟีเจอร์ AI อย่างน้อย 1 อย่าง

## Protocol

รูปแบบข้อความทั้งหมดอยู่ใน `docs/PROTOCOL.md` ถ้าจะเพิ่มหรือแก้ประเภทข้อความ ต้องอัปเดตเอกสารนี้ (รวมถึง Changelog) พร้อมกับโค้ด

## Stack และคำสั่ง

- Server: Node.js + Socket.IO 4.8 (ESM) — `server/index.js` เป็นไฟล์เดียว เก็บ state ใน memory
- Client: React 18 + Vite 5 + socket.io-client 4.8 — `client/src/`
  - `rooms.js`: id ห้อง (`dm:<name>`, `group:<name>`) และการแยกข้อความลงห้อง
  - `ChatRoom.jsx`: UI ห้องแชท ใช้ร่วมกันทั้ง private และ group
  - `App.jsx`: state ทั้งหมด (users, groups, messages ต่อห้อง, unread) + socket handlers
  - ข้อความที่ส่งไม่แสดงบนจอเอง ต้องรอ server echo กลับมา (server เป็นแหล่งข้อมูลจริง)
- ทั้งสองฝั่งเป็น npm project แยกกัน ต้องรัน `npm install` ในแต่ละโฟลเดอร์

```bash
cd server && npm run dev     # server ที่ 0.0.0.0:3000 (restart อัตโนมัติ)
cd client && npm run dev     # client ที่ http://localhost:5173 (--host เปิดให้เครื่องอื่นเข้าได้)
cd client && npm run build   # เช็กว่า client build ผ่าน
npm run build && npm start   # (root) โหมด Cloud: server ตัวเดียวเสิร์ฟ client/dist + socket ที่ port 3000
                             # build ใช้ npm install (ไม่ใช่ npm ci) เพื่อไม่ลบ node_modules ขณะ dev server เปิดอยู่
npm run bot                  # (root) AI bot ของเกมทายคำ: client อีกตัว ต่อ server เป็นผู้ใช้ชื่อ AI (ต้องมี ai-bot/.env)
cd server && npm test        # รัน test อัตโนมัติทั้งหมด (แต่ละไฟล์ได้ server ใหม่ที่ port 4100+)
cd server && npm test -- r07 # รันเฉพาะไฟล์ที่ชื่อมี "r07"
```

Test อยู่ใน `server/tests/*.test.mjs` (1 ไฟล์ต่อ requirement) ไม่ใช้ framework แต่ใช้ `socket.io-client` จำลอง client หลายตัวต่อ server จริง
- ใช้ `check(label, ok)` / `done()` จาก `tests/helpers.mjs` และอ่าน URL ของ server จาก `URL`
- แก้ server เสร็จแล้วต้องรัน `npm test` ทุกครั้ง และเพิ่ม test ใหม่ทุกครั้งที่เพิ่ม event หรือกฎใหม่
- ถ้า test ฟ้องว่าคนนอกได้รับข้อความ (R7, R11) ถือเป็นบั๊กร้ายแรง ห้ามแก้ test ให้ผ่าน

## แนวทางการเขียนโค้ด

- ทีมต้องอธิบายโค้ดให้อาจารย์ฟังได้ เขียนให้อ่านง่าย ตรงไปตรงมา และใส่ comment ตรงส่วนที่เกี่ยวกับ socket (bind, listen, accept, connect, send, recv, framing)
- ส่งข้อความแชทผ่าน Socket.IO event เท่านั้น ไม่เพิ่ม REST endpoint สำหรับส่งหรือดึงข้อความ
- ห้ามตั้งชื่อ event ซ้ำกับชื่อที่ Socket.IO สงวนไว้ (`connect`, `disconnect`, `connect_error` ฯลฯ) ให้ใช้ `error_msg` แทน `error`
- API key อ่านจาก `.env` เท่านั้น ห้าม hardcode
- **ข้อความที่ผู้ใช้เห็นต้องเป็นภาษาอังกฤษ**: UI ใน `client/` และ `message` ของ `error_msg` จาก server ส่วน comment ในโค้ดเขียนภาษาไทยได้

## Feature เสริม (Part 3)

แยกจาก core (R1–R11) ทั้งหมด รายละเอียดอยู่ใน `HandbookFeatures.md`
- Server: `server/features/<ชื่อ>.js` แล้วลงทะเบียนใน `server/features/index.js` **ห้ามเพิ่ม `socket.on` ของ feature ใน `server/index.js`**
- Client: `client/src/features/<ชื่อ>/` ต่อเข้า `App.jsx` / `ChatRoom.jsx` ให้น้อยที่สุด และทุกจุดต้องมี comment `// Feature: <ชื่อ>`
- Test: `server/tests/features/fXX-<ชื่อ>.test.mjs` (รันด้วย `npm test -- features/`) และ `npm test` ของ core ต้องยังผ่าน
- Docs: `docs/features/<ชื่อ>_TEST.md`, `docs/evidence/features/<ชื่อ>/`, หัวข้อใน `HandbookFeatures.md`
- event ใหม่ต้องเพิ่มใน `docs/PROTOCOL.md` หัวข้อ "Feature เสริม"
- จุดเชื่อม 5 จุด: `initFeatures`, `handleHttp`, `setupSocket`, `onGroupMessage`, `checkRegister` (ดู `server/features/index.js`)
- ค่าลับอยู่ใน `server/.env` (ตัวอย่างที่ `server/.env.example`) โหลดโดย `server/features/env.js` (import ไฟล์นี้ก่อนอ่าน `process.env`)
- AI (Claude / ChatGPT / Gemini): เรียกจาก **AI bot** (`ai-bot/` โปรแกรมแยก ต่อเข้า server เป็นผู้ใช้ชื่อ `AI` ด้วย `AI_BOT_TOKEN`) เท่านั้น server ไม่เรียก AI และไม่มี key (key ห้ามไปถึง client) / ข้อความของ AI ต้องส่งผ่าน socket (`group_msg` ของ bot) ห้าม server สร้างข้อความ AI เอง / ค่าลับของ bot อยู่ที่ `ai-bot/.env` / 1 ไฟล์ต่อเจ้าใน `ai-bot/ai-providers/` ทุกตัวมี `generateJson(prompt, schema)` และลงทะเบียนใน `PROVIDERS` ที่ `ai-bot/guess-ai.js` / Claude: `claude-opus-5-5` + `fallbacks: "default"` / เขียนโค้ด SDK ของ OpenAI / Gemini ตามเอกสารใน `node_modules/<sdk>/README.md` และ type definition ห้ามเดา
- feature ที่ไม่มีค่าลับที่ต้องใช้ต้องปิดตัวเองหรือแจ้ง error ได้ โดยแอปยังทำงานปกติ
- ข้อมูล binary (Feature file) ส่งเป็น Buffer / ArrayBuffer ใน event ได้เลย ห้ามแปลงเป็น base64 / server log ย่อ binary เป็น `<binary N bytes>` แล้ว
- slash command (client): เพิ่มคำสั่งใน `COMMANDS` ที่ `client/src/features/commands/index.js` ผลของคำสั่งแสดงเฉพาะจอคนสั่ง (`systemMessage`)
- test ห้ามต่อบริการจริง: `run-all.mjs` ตั้ง `NODE_ENV=test` + ล้าง token ไว้แล้ว

## Handbook

`Handbook.md` map ทุก requirement ไปที่บรรทัดของโค้ดตามลำดับการทำงาน ถ้าแก้ `server/index.js` หรือ `client/src/*` จนบรรทัดเลื่อน
หรือเพิ่มฟีเจอร์ใหม่ ต้องอัปเดต Handbook ด้วย (เลขบรรทัด + หัวข้อของฟีเจอร์ใหม่) และแก้วันที่ในหมายเหตุด้านบนของไฟล์

## บันทึก Prompt

หลังทำงานที่ผู้ใช้สั่งเสร็จแต่ละครั้ง ให้เพิ่ม entry ใหม่ไว้ท้าย `PromptRecord.md` ตาม template ในไฟล์นั้น
(ผู้ใช้ prompt อะไร, AI ทำอะไร, ไฟล์ที่แก้, requirement ที่เกี่ยวข้อง) ถ้าไม่รู้ชื่อผู้ใช้ให้ถามหนึ่งครั้ง
