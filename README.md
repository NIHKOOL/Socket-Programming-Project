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
│   └── index.js         #   Socket.IO server: เก็บรายชื่อ/กลุ่ม และ route ข้อความ
├── client/              # โค้ดฝั่ง Client (React)
│   └── src/
│       ├── socket.js    #   ฟังก์ชันเชื่อมต่อ Socket.IO
│       └── App.jsx      #   หน้า login + UI แชท
├── docs/
│   ├── PROTOCOL.md      # รูปแบบข้อความที่ client/server ส่งหากัน (อ่านก่อนเขียนโค้ด!)
│   ├── ARCHITECTURE.md  # แผนภาพระบบ + เหตุผลการเลือกโปรโตคอล (ใช้ทำสไลด์ R1)
│   └── R1_TEST.md       # checklist ทดสอบข้ามเครื่อง
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

### เชื่อมต่อข้ามเครื่อง

1. ทุกเครื่องต้องอยู่ในเครือข่ายเดียวกัน (Wi-Fi / LAN เดียวกัน) หรือ Server อยู่บน Cloud
2. หา IP ของเครื่อง Server: Windows `ipconfig` / macOS-Linux `ip addr` หรือ `ifconfig`
3. เปิด port 3000 (และ 5173 ถ้าให้เครื่องอื่นเปิดหน้าเว็บ) ใน Firewall ของเครื่อง Server (Windows Defender Firewall → Inbound Rules) หรือกด Allow ตอน Windows ถามครั้งแรก
4. Wi-Fi มหาวิทยาลัยบางแห่งบล็อกการเชื่อมต่อระหว่างเครื่อง ถ้าต่อไม่ได้ให้ลองใช้ Mobile Hotspot

## สถานะ Requirement

### Part 1 — System Architecture (1.5) ⚠️ ต้องครบก่อน Part 2 จะถูกตรวจ

| ข้อ | รายละเอียด | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| R1 | Client ≥ 2 ตัวบนคอมคนละเครื่อง + อธิบายโปรโตคอล (what/why/how) — ทดสอบตาม [docs/R1_TEST.md](docs/R1_TEST.md) | 🟨 | |
| R2 | ข้อความแชทส่งผ่าน Socket เท่านั้น | ⬜ | |

### Part 2 — Fundamental (7) ⚠️ ต้องครบก่อน Part 3 จะถูกตรวจ

| ข้อ | รายละเอียด | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| R3 | ชื่อ Client ไม่ซ้ำกัน | 🟨 | |
| R4 | เห็นรายชื่อ Client ที่ออนไลน์ทั้งหมด (รวมตัวเอง) | 🟨 | |
| R5 | แชทแต่ละห้อง (Private/Group) แยกห้องกัน | ⬜ | |
| R6 | ทุกห้องมีช่องพิมพ์ + หน้าต่างแสดงข้อความ | ⬜ | |
| R7 | Private message — เห็นแค่ผู้ส่งกับผู้รับ | ⬜ | |
| R8 | สร้างกลุ่มได้ (เริ่มต้นมีแค่ผู้สร้าง) | ⬜ | |
| R9 | เห็นรายชื่อกลุ่มทั้งหมด + สมาชิก | ⬜ | |
| R10 | เข้ากลุ่มด้วยตัวเองเท่านั้น | ⬜ | |
| R11 | ส่งข้อความในกลุ่ม — เห็นแค่สมาชิก | ⬜ | |

### Part 3 — Special Features (4, ข้อละ 1)

| # | ฟีเจอร์ | สถานะ | ผู้รับผิดชอบ |
|---|---|---|---|
| 1 | (AI feature — บังคับอย่างน้อย 1) | ⬜ | |
| 2 | | ⬜ | |
| 3 | | ⬜ | |
| 4 | | ⬜ | |

สัญลักษณ์: ⬜ ยังไม่เริ่ม · 🟨 กำลังทำ · ✅ เสร็จและทดสอบข้ามเครื่องแล้ว

## แนวทางการทำงานร่วมกัน

- **อ่าน [docs/PROTOCOL.md](docs/PROTOCOL.md) ก่อนเขียนโค้ด** ถ้าจะเพิ่มหรือแก้ประเภทข้อความ ให้แก้เอกสารนี้ก่อนแล้วแจ้งทีม
- แยก branch ตามฟีเจอร์ เช่น `feature/private-message`, `feature/group-chat`
- ถ้าใช้ AI ช่วยเขียนโค้ด ให้บันทึก prompt ไว้ใน [PromptRecord.md](PromptRecord.md)
- ห้าม commit API key หรือไฟล์ `.env`

## สมาชิกในทีม

| ชื่อ | รหัสนักศึกษา | หน้าที่ |
|---|---|---|
| | | |
