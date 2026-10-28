# RUN.md — คู่มือรันโปรเจกต์ (ตั้งแต่ clone จนพร้อม demo)

ไฟล์เดียวจบ: ติดตั้ง → ตั้งค่า → รัน → เช็กก่อน demo → แก้ปัญหา
รายละเอียดว่าแต่ละส่วนทำงานอย่างไร: [Handbook.md](Handbook.md) (R1–R11) · [HandbookFeatures.md](HandbookFeatures.md) (Feature เสริม)

## สารบัญ

1. [ระบบมีกี่โปรแกรม](#1-ระบบมีกี่โปรแกรม)
2. [ติดตั้ง (ครั้งแรก)](#2-ติดตั้ง-ครั้งแรก)
3. [ตั้งค่า .env](#3-ตั้งค่า-env)
4. [วิธีรัน](#4-วิธีรัน) — แบบ A เขียนโค้ด · แบบ B demo (port เดียว) · แบบ C ข้ามเครื่อง
5. [Checklist วัน demo](#5-checklist-วัน-demo)
6. [แก้ปัญหาที่เจอบ่อย](#6-แก้ปัญหาที่เจอบ่อย)
7. [Test อัตโนมัติ](#7-test-อัตโนมัติ)

---

## 1. ระบบมีกี่โปรแกรม

```
 browser (client React) ══Socket.IO══╗
 browser (client React) ══Socket.IO══╬══> server (Node.js, port 3000) ══Discord Gateway══> Discord (ถ้าตั้งค่า)
 AI bot (ai-bot/, ผู้ใช้ชื่อ "AI") ═══╝
```

| โปรแกรม | โฟลเดอร์ | จำเป็นไหม | ใช้ทำอะไร |
|---|---|---|---|
| **server** | `server/` | ✅ ต้องมี | ตัวกลางรับ-ส่งทุกข้อความ (R1–R11) + Feature เสริม |
| **client** | `client/` | ✅ ต้องมี | หน้าเว็บแชท (เปิดใน browser กี่ tab / กี่เครื่องก็ได้) |
| **AI bot** | `ai-bot/` | เฉพาะเกมทายคำ `/guess` | client อีกตัวที่ต่อ server แล้วเรียก AI (Claude / ChatGPT / Gemini) |
| Discord bridge | อยู่ใน server | ไม่จำเป็น | กลุ่ม `#discord` ↔ channel ใน Discord จริง (เปิดเองเมื่อใส่ token) |

ไม่รัน AI bot / ไม่ใส่ Discord → แชท, ส่งไฟล์, เกม RPS ยังใช้ได้ปกติ (`/guess` จะขึ้น `AI bot is offline`)

---

## 2. ติดตั้ง (ครั้งแรก)

ต้องมี [Node.js](https://nodejs.org/) **20 ขึ้นไป** (เช็ก: `node -v`)

```bash
git clone <repo-url>
cd Network_Socket_project
npm install --prefix server
npm install --prefix client
npm install --prefix ai-bot      # ถ้าจะเล่นเกมทายคำ
```

---

## 3. ตั้งค่า .env

ค่าลับอยู่ในไฟล์ `.env` 2 ไฟล์ (**ห้าม commit / ห้ามแชร์** — `.gitignore` กันไว้แล้ว) สร้างจากไฟล์ตัวอย่าง:

```bash
cp server/.env.example server/.env
cp ai-bot/.env.example ai-bot/.env
```

### server/.env

| ค่า | ต้องใส่ไหม | ใส่อะไร |
|---|---|---|
| `AI_BOT_TOKEN` | ถ้าใช้ AI bot | รหัสลับอะไรก็ได้ (สร้าง: `node -e "console.log(crypto.randomUUID())"`) **ต้องตรงกับใน `ai-bot/.env`** |
| `DISCORD_BOT_TOKEN` | ถ้าใช้ Discord | token ของ Discord bot — วิธีสร้าง: [discord_TEST.md](docs/features/discord_TEST.md) |
| `DISCORD_CHANNEL_ID` | ถ้าใช้ Discord | id ของ channel ที่จะเชื่อม |
| `DISCORD_GROUP` | ไม่ต้อง | ชื่อกลุ่มในแอป (ค่าเริ่มต้น `discord`) |
| `PORT` | ไม่ต้อง | port ของ server (ค่าเริ่มต้น `3000`) |

### ai-bot/.env

| ค่า | ต้องใส่ไหม | ใส่อะไร |
|---|---|---|
| `AI_BOT_TOKEN` | ✅ | **ค่าเดียวกับ `server/.env`** |
| `SERVER_URL` | ถ้า bot อยู่คนละเครื่องกับ server | เช่น `http://192.168.1.20:3000` (ค่าเริ่มต้น `http://localhost:3000`) |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | ✅ อย่างน้อย 1 ตัว | API key ของ AI — วิธีสร้าง: [guess_TEST.md](docs/features/guess_TEST.md#1-ตั้งค่า-ครั้งแรก) |
| `GEMINI_MODEL` / `OPENAI_MODEL` | ไม่ต้อง | **model ID** ไม่ใช่ชื่อที่แสดง เช่น `gemini-3.5-flash-lite` ✅ / `Gemini 3.5 Flash Lite` ❌ |
| `GUESS_AI_PROVIDER` | ไม่ต้อง | AI เริ่มต้นของ `/guess start`: `claude` / `chatgpt` / `gemini` |

> แก้ `.env` แล้วต้อง **ปิดแล้วเปิดโปรแกรมนั้นใหม่** (อ่านค่าแค่ตอนเริ่ม)

---

## 4. วิธีรัน

### แบบ A — ตอนเขียนโค้ด (หน้าเว็บอัปเดตเองเมื่อแก้โค้ด)

เปิด 3 terminal ที่ root ของโปรเจกต์:

```bash
# terminal 1: server (restart เองเมื่อแก้โค้ด server)
npm run dev --prefix server

# terminal 2: client → เปิด http://localhost:5173
npm run dev --prefix client

# terminal 3: AI bot (ถ้าจะเล่น /guess)
npm run bot
```

หน้า login: ช่อง `server>` ใส่ `http://localhost:3000` (เครื่องอื่นใส่ `http://<IP เครื่อง server>:3000`) แล้วใส่ชื่อ

### แบบ B — ตอน demo (แนะนำ: port เดียว)

server ตัวเดียวเสิร์ฟทั้งหน้าเว็บและ socket ที่ port 3000 → เปิด firewall แค่ port เดียว และช่อง `server>` กรอกให้อัตโนมัติ

```bash
# terminal 1: build หน้าเว็บ (ครั้งแรก หรือหลังแก้โค้ด client) แล้วเปิด server
npm run build
npm start

# terminal 2: AI bot
npm run bot
```

ทุกเครื่อง / มือถือใน Wi-Fi เดียวกัน เปิด `http://<IP เครื่อง server>:3000` (IP ดูได้จากบรรทัด `Clients on other computers can connect to:` ตอน server เริ่ม)

> ปิด server ของแบบ A ก่อน เพราะใช้ port 3000 เหมือนกัน

### แบบ C — ข้ามเครื่อง (R1)

| เครื่อง | รันอะไร |
|---|---|
| เครื่อง 1 (server) | `npm start` (แบบ B) — หรือแบบ A ก็ได้ |
| เครื่อง 2, 3 (client) | เปิด browser ไป `http://<IP เครื่อง 1>:3000` (แบบ B) หรือ `http://<IP เครื่อง 1>:5173` (แบบ A) |
| (ไม่บังคับ) เครื่องไหนก็ได้ | AI bot: ตั้ง `SERVER_URL=http://<IP เครื่อง 1>:3000` ใน `ai-bot/.env` แล้ว `npm run bot` |

ทุกเครื่องต้องอยู่เครือข่ายเดียวกัน (Wi-Fi / LAN / Mobile Hotspot) และเครื่อง server ต้องเปิด firewall ให้ port 3000 (แบบ A เพิ่ม 5173) — ดู [แก้ปัญหา](#6-แก้ปัญหาที่เจอบ่อย)

---

## 5. Checklist วัน demo

**ก่อนเริ่ม (10 นาทีก่อน)**
- [ ] ทุกเครื่องต่อ Wi-Fi / Hotspot เดียวกัน (Wi-Fi มหาวิทยาลัยมักบล็อกเครื่องคุยกัน → เตรียม Hotspot มือถือไว้)
- [ ] `git pull` แล้ว `npm run build` บนเครื่อง server
- [ ] `npm test --prefix server` ผ่านทั้งหมด

**เปิดโปรแกรมตามลำดับ แล้วเช็ก log**

| ลำดับ | คำสั่ง | log ที่ต้องเห็น |
|---|---|---|
| 1 | `npm start` | `Chat server listening on port 3000` |
| | | `Features: cloud, discord, ping, game, bot, file` (ถ้า Discord ขึ้น `discord (off: …)` = ไม่ได้ตั้ง token) |
| | | `[discord] logged in as <bot>, bridging #discord <-> #<channel>` (ถ้าใช้ Discord) |
| 2 | `npm run bot` | `[bot] online as AI — waiting for /guess commands` |
| 3 | เปิด browser ทุกเครื่อง แล้ว login | รายชื่อออนไลน์มี `AI` + ทุกคน / server log มี `[recv] <ชื่อ> -> register` |
| 4 | พิมพ์ `/guess ai` ในห้องไหนก็ได้ | AI ที่ใส่ key ขึ้น `✓ ready` |

**จอที่ควรเปิดให้อาจารย์เห็น**
- terminal ของ **server** — ทุก event วิ่งผ่าน socket: `[recv] C1 -> group_msg …`, `[recv] AI -> group_msg …`, `file_chunk <binary 65536 bytes>`
- terminal ของ **AI bot** — `bot_request` เข้า / `[send] group_msg` ออก (bot ไม่พิมพ์คำตอบของเกม)
- **DevTools → Network → WS → Messages** ของ client — frame จริงของ Socket.IO (R2) และ frame binary ตอนส่งไฟล์

checklist การทดสอบแต่ละส่วน: core `docs/R*_TEST.md` · Feature เสริม [docs/features/](docs/features/README.md)

---

## 6. แก้ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| เครื่องอื่นต่อไม่ได้ (`Cannot connect to …`) | firewall / คนละเครือข่าย / Wi-Fi บล็อก | เช็ก IP ด้วย `ipconfig` · Windows Defender Firewall → Inbound Rules → อนุญาต port 3000 (และ 5173) หรือกด Allow ตอน Windows ถาม · ลอง Mobile Hotspot |
| `EADDRINUSE: address already in use :::3000` | มี server เปิดค้างอยู่ | ปิด terminal เก่า หรือหา process: `netstat -ano \| findstr :3000` แล้ว `taskkill /PID <pid> /F` |
| login แล้วขึ้น `Name "…" is already taken` | ชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) | ใช้ชื่ออื่น (R3) |
| login ชื่อ `AI` ไม่ได้ (`reserved for the AI bot`) | ชื่อนี้สงวนไว้ให้ AI bot | ตั้งใจให้เป็นแบบนี้ ใช้ชื่ออื่น |
| `/guess` ขึ้น `the AI bot is offline` | ไม่ได้รัน bot / bot ต่อ server ไม่ได้ | `npm run bot` แล้วดู log ของ bot |
| bot ขึ้น `AI_BOT_TOKEN is not set` | ไม่มี `ai-bot/.env` หรือไม่ได้ใส่ค่า | ทำตาม [ข้อ 3](#3-ตั้งค่า-env) |
| bot ขึ้น `cannot log in as AI` | token ใน 2 ไฟล์ไม่ตรงกัน / มี bot รันอยู่แล้ว 1 ตัว | ใส่ค่าเดียวกันทั้ง 2 ไฟล์ แล้ว restart **ทั้ง server และ bot** / ปิด bot ตัวเก่า |
| bot ขึ้น `cannot reach http://localhost:3000` | server ยังไม่เปิด / bot อยู่คนละเครื่อง | เปิด server ก่อน (bot ต่อใหม่เอง) / ตั้ง `SERVER_URL` |
| เกมขึ้น `❌ could not start the game: …` | API key ผิด / หมดโควตา / ชื่อ model ผิด | อ่านข้อความ error · `GEMINI_MODEL` ต้องเป็น model ID เช่น `gemini-3.5-flash-lite` |
| `/guess ai` ขึ้น `✗ set GEMINI_API_KEY in ai-bot/.env` | ไม่มี key ของเจ้านั้น | ใส่ key แล้ว restart bot |
| Features มี `discord (off: …)` | ไม่ได้ตั้ง token / channel id | ตั้งใน `server/.env` ([discord_TEST.md](docs/features/discord_TEST.md)) |
| ข้อความจาก Discord มาเป็นค่าว่าง | ไม่ได้เปิด MESSAGE CONTENT INTENT | Discord Developer Portal → Bot → เปิด Message Content Intent |
| ส่งไฟล์ขึ้น `File is larger than 5 MB` | เกินขนาดที่กำหนด | ส่งไฟล์ ≤ 5 MB |
| หน้าเว็บแบบ B ไม่อัปเดตหลังแก้โค้ด client | ยังไม่ได้ build ใหม่ | `npm run build` แล้วรีเฟรช |
| แก้ `.env` แล้วไม่มีผล | อ่านค่าแค่ตอนเริ่มโปรแกรม | ปิดแล้วเปิดโปรแกรมนั้นใหม่ |

---

## 7. Test อัตโนมัติ

```bash
npm test                        # (root) รันทั้งหมด
npm test --prefix server -- r07 # เฉพาะไฟล์ที่ชื่อมี "r07"
npm test --prefix server -- features/   # เฉพาะ Feature เสริม
```

- แต่ละไฟล์ได้ server ตัวใหม่ที่ port 4100 ขึ้นไป **ไม่กระทบ server ที่รันอยู่ที่ port 3000**
- test **ไม่เรียก AI / Discord จริง** (ใช้โจทย์ปลอม + ล้าง token) จึงไม่เสียเงิน
- test เกมทายคำเปิด AI bot เป็นโปรแกรมแยกเอง → ต้อง `npm install --prefix ai-bot` ก่อน

ผลที่ควรได้: `16/16 test files passed` (core R1–R11 + Feature เสริม f00–f06)
