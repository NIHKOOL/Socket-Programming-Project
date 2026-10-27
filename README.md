# Simple Chat Application — Socket Programming Term Project

แอปแชทแบบ Client–Server ที่สื่อสารกันด้วย Socket Programming รองรับแชทส่วนตัว (Private) และแชทกลุ่ม (Group)
โจทย์ฉบับเต็มอยู่ที่ [Computer_Network_Term_Project_Socket_Programming.pdf](Computer_Network_Term_Project_Socket_Programming.pdf)

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Server | Node.js (≥ 20) + [Socket.IO](https://socket.io/docs/v4/) 4.8 |
| Client | React 18 + Vite 5 + socket.io-client 4.8 (รันใน browser) |
| Transport | WebSocket บน TCP (เหตุผลการเลือกอยู่ใน [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) |
| AI feature | _TODO: เช่น Claude API / speech-to-text_ |

## โครงสร้างโปรเจกต์

```
.
├── server/              # โค้ดฝั่ง Server (ต้องแยกจาก client ตามโจทย์)
│   ├── index.js         #   core R1–R11: Socket.IO server เก็บรายชื่อ/กลุ่ม และ route ข้อความ
│   ├── features/        #   Feature เสริม Part 3 (core เรียกผ่าน features/index.js)
│   └── tests/           #   test อัตโนมัติ 1 ไฟล์ต่อ requirement (npm test)
│       └── features/    #     test ของ Feature เสริม
├── client/              # โค้ดฝั่ง Client (React)
│   └── src/
│       ├── socket.js    #   ฟังก์ชันเชื่อมต่อ Socket.IO
│       ├── rooms.js     #   id ห้องแชท + แยกข้อความลงห้อง (R5)
│       ├── ChatRoom.jsx #   UI ห้องแชท: หน้าต่างข้อความ + ช่องพิมพ์ (R6)
│       ├── App.jsx      #   หน้า login, sidebar รายชื่อ/กลุ่ม, state ข้อความ
│       ├── App.css      #   style ทั้งแอป (terminal + responsive มือถือ ที่ @media max-width: 720px)
│       ├── device.js    #   ตรวจจอสัมผัส (ไม่ autofocus บนมือถือ)
│       └── features/    #   Feature เสริม Part 3 ฝั่ง client (1 โฟลเดอร์ต่อ feature)
├── docs/
│   ├── PROTOCOL.md      # รูปแบบข้อความที่ client/server ส่งหากัน (อ่านก่อนเขียนโค้ด!)
│   ├── ARCHITECTURE.md  # แผนภาพระบบ + เหตุผลการเลือกโปรโตคอล (ใช้ทำสไลด์ R1)
│   ├── R1_TEST.md       # checklist ทดสอบข้ามเครื่อง
│   ├── R2_TEST.md       # checklist พิสูจน์ว่าข้อความวิ่งผ่าน socket เท่านั้น
│   ├── R3_TEST.md       # checklist ชื่อไม่ซ้ำ
│   ├── R4_TEST.md       # checklist รายชื่อออนไลน์
│   ├── R5_R6_TEST.md    # checklist ห้องแชท
│   ├── R7_TEST.md       # checklist private message
│   ├── R8_TEST.md       # checklist สร้างกลุ่ม
│   ├── R9_TEST.md       # checklist รายชื่อกลุ่ม + สมาชิก
│   ├── R10_TEST.md      # checklist เข้ากลุ่มด้วยตัวเอง
│   ├── R11_TEST.md      # checklist group message
│   ├── features/        # checklist ทดสอบของ Feature เสริม
│   └── evidence/        # รูปหลักฐานการทดสอบ แยกโฟลเดอร์ตาม R (ดู evidence/README.md)
│       └── features/    #   หลักฐานของ Feature เสริม
├── Handbook.md          # core R1–R11 ทำงานอย่างไร + map ไปหาโค้ดทีละขั้น (อ่านก่อนแก้โค้ด!)
├── HandbookFeatures.md  # Feature เสริม (Part 3) ทำงานอย่างไร + วิธีเพิ่ม feature ใหม่
├── package.json         # คำสั่งรวมสำหรับ Cloud: npm run build / npm start
├── CLAUDE.md            # บริบทโปรเจกต์สำหรับ Claude Code
├── PromptRecord.md      # บันทึก prompt ที่ทีมใช้กับ AI
└── README.md
```

## การติดตั้ง

ต้องมี [Node.js](https://nodejs.org/) เวอร์ชัน 20 ขึ้นไป (เช็กด้วย `node -v`)

```bash
git clone <repo-url>
cd Network_Socket_project
cd server && npm install
cd ../client && npm install
```

ถ้าใช้ฟีเจอร์ AI ให้สร้างไฟล์ `server/.env` (ห้าม commit ไฟล์นี้):

```
AI_API_KEY=your-key-here
```

## วิธีรัน

### 1. รัน Server (เครื่องเดียว)

```bash
cd server
npm start          # หรือ npm run dev เพื่อให้ restart อัตโนมัติเมื่อแก้โค้ด
```

Server จะ listen ที่ `0.0.0.0:3000` เพื่อให้เครื่องอื่นในเครือข่ายเชื่อมต่อเข้ามาได้ (เปลี่ยน port ได้ด้วย env `PORT`)

### 2. รัน Client (แต่ละเครื่อง)

```bash
cd client
npm run dev
```

เปิด browser ไปที่ `http://localhost:5173` ที่หน้า login ให้ใส่ **Server URL** เป็น `http://<IP ของเครื่อง Server>:3000` แล้วใส่ชื่อ

> ถ้าไม่อยากรัน client ทุกเครื่อง ให้เปิด `http://<IP เครื่องที่รัน client>:5173` จากเครื่องอื่นได้เลย เพราะ `npm run dev` ใช้ `--host` อยู่แล้ว
> แต่ละ browser tab นับเป็น client 1 ตัว ตอน demo R1 ต้องเปิดจากคอมคนละเครื่องจริง

### รันแบบ Cloud (server ตัวเดียวเสิร์ฟทั้งหน้าเว็บและ socket)

```bash
# ที่ root ของโปรเจกต์
npm run build    # ติดตั้ง dependency ของ server + client แล้ว build client → client/dist
npm start        # เปิด http://localhost:3000 (เครื่องอื่น/มือถือใน Wi-Fi เดียวกัน: http://<IP>:3000)
```

เป็นคำสั่งเดียวกับที่ Render ใช้ deploy ขั้นตอน deploy ทั้งหมดอยู่ใน [docs/features/cloud_TEST.md](docs/features/cloud_TEST.md)

### เชื่อมต่อข้ามเครื่อง

1. ทุกเครื่องต้องอยู่ในเครือข่ายเดียวกัน (Wi-Fi / LAN เดียวกัน) หรือ Server อยู่บน Cloud
2. หา IP ของเครื่อง Server: Windows `ipconfig` / macOS-Linux `ip addr` หรือ `ifconfig`
3. เปิด port 3000 (และ 5173 ถ้าให้เครื่องอื่นเปิดหน้าเว็บ) ใน Firewall ของเครื่อง Server (Windows Defender Firewall → Inbound Rules) หรือกด Allow ตอน Windows ถามครั้งแรก
4. Wi-Fi มหาวิทยาลัยบางแห่งบล็อกการเชื่อมต่อระหว่างเครื่อง ถ้าต่อไม่ได้ให้ลองใช้ Mobile Hotspot

## Test อัตโนมัติ

```bash
cd server
npm test            # รันทั้งหมด
npm test -- r07     # รันเฉพาะ R7
npm test -- features/   # รันเฉพาะ test ของ Feature เสริม (server/tests/features/)
```

แต่ละไฟล์ใน `server/tests/` จะได้ server ตัวใหม่ของตัวเอง (port 4100 ขึ้นไป) **ไม่กระทบ server ที่รันอยู่ที่ port 3000**
ไฟล์ใช้ `socket.io-client` จำลอง client หลายตัวต่อ server จริง แล้วตรวจว่าใครได้รับ event อะไรบ้าง

```
ok    r00-smoke.test.mjs  (7 passed, 0 failed)
ok    r03-unique-name.test.mjs  (12 passed, 0 failed)
...
ok    features/f00-feature-hooks.test.mjs  (3 passed, 0 failed)

10/10 test files passed
```

ควรรันทุกครั้งก่อน commit ถ้าแก้ `server/index.js` หรือ `client/src/rooms.js`

## สถานะ Requirement

### Part 1 — System Architecture (1.5) ⚠️ ต้องครบก่อน Part 2 จะถูกตรวจ

| ข้อ | รายละเอียด | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| R1 | Client ≥ 2 ตัวบนคอมคนละเครื่อง + อธิบายโปรโตคอล (what/why/how) — ทดสอบตาม [docs/R1_TEST.md](docs/R1_TEST.md) · ทดสอบ client 2 ตัวบนคอมคนละเครื่องผ่านแล้ว (server อยู่ร่วมเครื่องกับ client ตัวหนึ่ง) ([หลักฐาน](docs/evidence/README.md#r1--system-architecture)) | ✅ | |
| R2 | ข้อความแชทส่งผ่าน Socket เท่านั้น — ไม่มี REST (404), log ทุก event · ทดสอบตาม [docs/R2_TEST.md](docs/R2_TEST.md) ผ่านครบ, server กับ client อยู่คนละเครื่อง ([หลักฐาน](docs/evidence/README.md#r2--socket-programming-only)) | ✅ | |

### Part 2 — Fundamental (7) ⚠️ ต้องครบก่อน Part 3 จะถูกตรวจ

| ข้อ | รายละเอียด | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| R3 | ชื่อ Client ไม่ซ้ำกัน (ไม่สนตัวพิมพ์, 1–20 ตัวอักษร) · ทดสอบตาม [docs/R3_TEST.md](docs/R3_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r3--unique-name)) | ✅ | |
| R4 | เห็นรายชื่อ Client ที่ออนไลน์ทั้งหมด (รวมตัวเอง) อัปเดต real-time · ทดสอบตาม [docs/R4_TEST.md](docs/R4_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r4--online-user-list)) | ✅ | |
| R5 | แชทแต่ละห้อง (Private/Group) แยกห้องกัน · ทดสอบตาม [docs/R5_R6_TEST.md](docs/R5_R6_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r5--r6--chat-rooms)) | ✅ | |
| R6 | ทุกห้องมีช่องพิมพ์ + หน้าต่างแสดงข้อความ · ทดสอบตาม [docs/R5_R6_TEST.md](docs/R5_R6_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r5--r6--chat-rooms)) | ✅ | |
| R7 | Private message — เห็นแค่ผู้ส่งกับผู้รับ · ทดสอบตาม [docs/R7_TEST.md](docs/R7_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r7--private-message)) | ✅ | |
| R8 | สร้างกลุ่มได้ (เริ่มต้นมีแค่ผู้สร้าง) กลุ่มที่ไม่มีสมาชิกยังอยู่ · ทดสอบตาม [docs/R8_TEST.md](docs/R8_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r8--create-group)) | ✅ | |
| R9 | เห็นรายชื่อกลุ่มทั้งหมด + สมาชิก อัปเดต real-time · ทดสอบตาม [docs/R9_TEST.md](docs/R9_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r9--group-list-with-members)) | ✅ | |
| R10 | เข้ากลุ่มด้วยตัวเองเท่านั้น (ปุ่ม "[join]") · ทดสอบตาม [docs/R10_TEST.md](docs/R10_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r10--join-group-by-self)) | ✅ | |
| R11 | ส่งข้อความในกลุ่ม — เห็นแค่สมาชิก · ทดสอบตาม [docs/R11_TEST.md](docs/R11_TEST.md) ผ่าน ([หลักฐาน](docs/evidence/README.md#r11--group-message)) | ✅ | |

### Part 3 — Special Features (4, ข้อละ 1)

โค้ด, test, เอกสาร และหลักฐานของ Feature เสริมแยกจาก core ทั้งหมด ดู [HandbookFeatures.md](HandbookFeatures.md)

| # | ฟีเจอร์ | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| 1 | Deploy บน Cloud (`cloud`) — server เสิร์ฟหน้าเว็บเอง URL เดียว · [checklist + วิธี deploy](docs/features/cloud_TEST.md) · **deploy แล้วใช้งานได้** (หลักฐานยังไม่ได้เก็บ) | ✅ | |
| 2 | AI ผ่าน slash command `/ai`, `/summarize` (`ai`) — **AI บังคับอย่างน้อย 1** | ⬜ | |
| 3 | ส่งไฟล์/รูปผ่าน socket (`files`) | ⬜ | |
| 4 | `/ping` วัด latency + typing indicator (`ping`) | ⬜ | |

สัญลักษณ์: ⬜ ยังไม่เริ่ม · 🟨 กำลังทำ · ✅ เสร็จและทดสอบข้ามเครื่องแล้ว

## แนวทางการทำงานร่วมกัน

- **คนที่เพิ่งเข้ามา:** อ่าน [Handbook.md](Handbook.md) ก่อน มีลำดับการทำงานของทุก requirement พร้อมลิงก์ไปที่บรรทัดของโค้ด
- **อ่าน [docs/PROTOCOL.md](docs/PROTOCOL.md) ก่อนเขียนโค้ด** ถ้าจะเพิ่มหรือแก้ประเภทข้อความ ให้แก้เอกสารนี้ก่อนแล้วแจ้งทีม
- แยก branch ตามฟีเจอร์ เช่น `feature/private-message`, `feature/group-chat`
- ถ้าใช้ AI ช่วยเขียนโค้ด ให้บันทึก prompt ไว้ใน [PromptRecord.md](PromptRecord.md)
- ห้าม commit API key หรือไฟล์ `.env`

## สมาชิกในทีม

| ชื่อ | รหัสนักศึกษา | หน้าที่ |
|---|---|---|
| | | |
