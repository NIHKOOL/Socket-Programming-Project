# Handbook — Feature เสริม (Part 3)

คู่มือของ Feature เสริม แยกจาก [Handbook.md](Handbook.md) ซึ่งเป็นคู่มือของ core (R1–R11)
แต่ละ feature มีหัวข้อของตัวเอง ไล่ลำดับการทำงานทีละขั้นพร้อมลิงก์ไปที่บรรทัดของโค้ด รูปแบบเดียวกับ Handbook หลัก

> **เลขบรรทัดตรงกับโค้ด ณ วันที่ 2026-10-28** ถ้าบรรทัดเลื่อน ให้ค้นจากชื่อ event หรือชื่อฟังก์ชันแทน

> Part 3 (4 คะแนน, ข้อละ 1): **ต้องมีฟีเจอร์ AI อย่างน้อย 1 อย่าง** และ Part 2 ต้องครบก่อน Part 3 จึงจะถูกตรวจ

---

## สารบัญ

- [0. โครงสร้างและการแยก Feature ออกจาก core](#0-โครงสร้างและการแยก-feature-ออกจาก-core)
- [Feature ที่วางแผนไว้](#feature-ที่วางแผนไว้)
- [Feature 1 — Cloud](#feature-1--cloud)
- [Feature 2 — Discord bridge](#feature-2--discord-bridge)
- [Feature 3 — /ping (+ ระบบ slash command)](#feature-3--ping--ระบบ-slash-command)
- [Feature 4 — เกมเป่ายิ้งฉุบ (RPS)](#feature-4--เกมเป่ายิ้งฉุบ-rps)
- [Feature 5 — เกมทายคำ AI (AI บังคับ)](#feature-5--เกมทายคำ-ai-ai-บังคับ)
- [Feature 6 — ส่งไฟล์ / รูปผ่าน socket](#feature-6--ส่งไฟล์--รูปผ่าน-socket)
- [คู่มือเพิ่ม Feature ใหม่](#คู่มือเพิ่ม-feature-ใหม่)

---

## 0. โครงสร้างและการแยก Feature ออกจาก core

```
server/
├── index.js                 core R1–R11 (เรียก feature ผ่าน 5 จุดเชื่อมเท่านั้น)
├── features/
│   ├── index.js             ทะเบียน feature: รวมทุก feature แล้วส่งต่อให้ core
│   └── <ชื่อ>.js             โค้ดฝั่ง server ของแต่ละ feature
└── tests/
    ├── r00…r11.test.mjs     test ของ core
    └── features/            test ของ feature (fXX-<ชื่อ>.test.mjs)
client/src/
├── (core)
└── features/<ชื่อ>/          โค้ดฝั่ง client ของแต่ละ feature (ดู client/src/features/README.md)
ai-bot/                      AI bot: โปรแกรมแยก (Socket.IO client) ต่อเข้า server เป็นผู้ใช้ชื่อ AI (Feature 5)
docs/features/               checklist ทดสอบของแต่ละ feature
docs/evidence/features/      หลักฐานของแต่ละ feature
```

### จุดเชื่อม core ↔ feature (ฝั่ง server)

core รู้จัก feature ผ่าน [server/features/index.js](server/features/index.js) ไฟล์เดียว เพิ่มหรือถอด feature จึงไม่ต้องแก้ core

| # | จุดเชื่อม | core เรียกตอนไหน | feature ใช้ทำอะไร | โค้ด |
|---|---|---|---|---|
| 1 | `initFeatures(app)` | ครั้งเดียวตอน server เริ่ม (หลังสร้าง `io`, `clients`, `groups`) ได้ `{ io, clients, groups, now }` | login บริการภายนอก, เตรียมกลุ่ม (Discord) | core: [server/index.js:38](server/index.js#L38) → [features/index.js:32-34](server/features/index.js#L32-L34) |
| 2 | `handleHttp(req, res)` | ทุก HTTP request ที่ไม่ใช่ `/socket.io/` **ก่อน**ตอบ 404 | เสิร์ฟไฟล์หน้าเว็บ (Cloud) ถ้า return `true` ถือว่า feature ตอบไปแล้ว | core: [server/index.js:17](server/index.js#L17) → [features/index.js:38-40](server/features/index.js#L38-L40) |
| 3 | `setupSocket(socket, ctx)` | ทุกครั้งที่มี socket ใหม่ (หลังสร้าง `requireName`) | เพิ่ม `socket.on("<event ของ feature>")` / ส่งข้อมูลเริ่มต้น (Discord: `bridge_info`) | core: [server/index.js:121-123](server/index.js#L121-L123) → [features/index.js:43-45](server/features/index.js#L43-L45) |
| 4 | `onGroupMessage(msg)` | หลัง core ส่ง `group_msg` ให้สมาชิกแล้ว (**ผ่านการตรวจสิทธิ์ R11 แล้ว**) | ส่งต่อข้อความออกนอกระบบ (Discord) | core: [server/index.js:189](server/index.js#L189) → [features/index.js:48-50](server/features/index.js#L48-L50) |
| 5 | `checkRegister(name, payload)` | ตอน `register` ก่อนจองชื่อ (R3) | สงวนชื่อ: `AI` ต้องมี `AI_BOT_TOKEN` (Feature 5) คืน `{ code, message }` = ปฏิเสธ | core: [server/index.js:98-100](server/index.js#L98-L100) → [features/index.js:53-59](server/features/index.js#L53-L59) |

**`ctx` ที่ feature ได้รับ** ([server/index.js:122](server/index.js#L122)) เป็นตัวเดียวกับที่ core ใช้:

| ชื่อ | คืออะไร |
|---|---|
| `io` | Socket.IO server ใช้ `io.to(room).emit(...)` |
| `clients` | `Map<name, socket>` รายชื่อออนไลน์ (**อ่านอย่างเดียว** ห้ามแก้) |
| `groups` | `Map<groupName, Set<name>>` (**อ่านอย่างเดียว** ห้ามแก้) |
| `requireName()` | คืนชื่อของ socket นี้ ถ้ายังไม่ register จะส่ง `NOT_REGISTERED` แล้วคืน `null` |
| `sendError(code, message)` | ส่ง `error_msg` ให้ socket นี้ (message เป็นภาษาอังกฤษ) |
| `now()` | timestamp แบบ ISO |

**กฎความปลอดภัยเดียวกับ core** (ดู [Handbook.md หลักการ 3 ข้อ](Handbook.md#หลักการ-3-ข้อที่ใช้ทั้งระบบ))
- ตัวตนมาจาก `requireName()` เท่านั้น ห้ามเชื่อชื่อจาก payload
- ข้อความในห้องไหน ต้องส่งเฉพาะคนที่มีสิทธิ์เห็นห้องนั้น (private → 2 คน, group → สมาชิก)
- feature ห้ามแก้ `clients` / `groups` โดยตรง ถ้าจำเป็นต้องแก้ ให้คุยกับทีมก่อน เพราะกระทบ R3–R11
  (ข้อยกเว้นที่ทีมตกลงแล้ว: Discord สร้างกลุ่ม `#discord` แบบไม่มีสมาชิกใน `init` ตอน server เริ่ม)

**Test:** [server/tests/features/f00-feature-hooks.test.mjs](server/tests/features/f00-feature-hooks.test.mjs) ตรวจว่าจุดเชื่อมไม่ทำให้ core เปลี่ยนพฤติกรรม (path อื่นยัง 404, handshake ยังทำงาน, register ยังทำงาน)

---

## Feature ที่วางแผนไว้

| # | Feature | ชื่อใน code | สถานะ | หัวข้อ |
|---|---|---|---|---|
| 1 | Deploy บน Cloud | `cloud` | ⏸ พักไว้ (โค้ดยังอยู่ ยังไม่นับคะแนน) | [Feature 1 — Cloud](#feature-1--cloud) |
| 2 | Discord bridge: กลุ่ม `#discord` ↔ channel ใน Discord จริง | `discord` | ✅ ใช้งานได้บนเครื่อง (รอเก็บหลักฐาน) | [Feature 2 — Discord bridge](#feature-2--discord-bridge) |
| 3 | **เกมทายคำ AI** (`/guess start`): Claude / ChatGPT / Gemini คิดคำ + ใบ้ทีละข้อ คนในกลุ่มแข่งทาย (ภาษาอังกฤษ) — **AI เป็น client อีกตัว** (`ai-bot/`) **(AI บังคับ)** | `bot` + `ai-bot/` | 🟨 โค้ดเสร็จ ทดสอบอัตโนมัติผ่าน (โจทย์ปลอม) + เรียก API จริงทั้ง 3 เจ้าด้วย key ปลอมแล้ว **รอ API key จริง** | [Feature 5 — เกมทายคำ AI](#feature-5--เกมทายคำ-ai-ai-บังคับ) |
| 5 | เกมผ่าน socket: เป่ายิ้งฉุบ (`/play rps`) | `game` | 🟨 โค้ดเสร็จ ทดสอบอัตโนมัติผ่าน รอทดสอบด้วยมือ | [Feature 4 — RPS](#feature-4--เกมเป่ายิ้งฉุบ-rps) |
| 4 | **ส่งไฟล์ / รูปผ่าน socket** (แบ่งชิ้น 64 KB, stop-and-wait, private + group) | `file` | 🟨 โค้ดเสร็จ ทดสอบอัตโนมัติผ่าน + ลองส่งจริงด้วยโค้ด client แล้ว รอทดสอบใน browser | [Feature 6 — ส่งไฟล์](#feature-6--ส่งไฟล์--รูปผ่าน-socket) |
| – | `/ping` / `/ping <ชื่อ>` วัด RTT + ระบบ slash command (`/help`) | `ping` | ⏸ ตัวสำรอง (โค้ด + test ยังอยู่ ไม่นับคะแนน แทนด้วยส่งไฟล์) | [Feature 3 — /ping](#feature-3--ping--ระบบ-slash-command) |

(อัปเดตตารางนี้และเพิ่มหัวข้อของแต่ละ feature เมื่อทำเสร็จ)

---

## Feature 1 — Cloud

> server ตัวเดียวเสิร์ฟทั้งหน้าเว็บและ Socket.IO → deploy บน Cloud (Railway) แล้วใช้งานจากที่ไหนก็ได้ รวมถึงมือถือที่ใช้ 4G
> Checklist + ขั้นตอน deploy: [docs/features/cloud_TEST.md](docs/features/cloud_TEST.md)
>
> **⏸ พักไว้ (2026-10-28):** Render ใช้งานได้ แต่ bot ของ Discord login ไม่ได้บน Render และ Railway ใช้ไม่ได้ ตอนนี้จึงยังไม่นับเป็นคะแนน โค้ดยังอยู่ (`npm run build && npm start` ใช้รันแบบ port เดียวบนเครื่องได้)

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/cloud.js](server/features/cloud.js) | เสิร์ฟไฟล์จาก `client/dist` + log IP จริงหลัง proxy |
| [client/src/socket.js:7-9](client/src/socket.js#L7-L9) | (แก้ core จุดเดียว) build แล้ว Server URL = URL เดียวกับหน้าเว็บ |
| [package.json](package.json) (root) | `npm run build` / `npm start` ให้ Cloud ใช้ (ติดตั้ง + build ทั้ง 2 ฝั่งในคำสั่งเดียว) |

**ลำดับการทำงาน: deploy (Railway)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Cloud host รัน `npm run build` → ติดตั้ง dependency ของ server + client → `vite build` สร้าง `client/dist` | [package.json](package.json) |
| 2 | Railway รัน `npm start` → `node server/index.js` โดยส่ง port มาทาง env `PORT` | [server/index.js:9](server/index.js#L9) |
| 3 | ตอนโหลด feature: ถ้ามี `client/dist/index.html` → ชื่อ feature = `cloud` (log `Features: cloud`) | [server/features/cloud.js:48](server/features/cloud.js#L48) |

**ลำดับการทำงาน: ผู้ใช้เปิด `https://<app>.up.railway.app` บนมือถือ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Browser → edge proxy ของ Railway (HTTPS/TLS) → ส่งต่อเป็น HTTP ธรรมดาเข้า server พร้อม header `X-Forwarded-For` | — (ทำโดย Railway) |
| 2 | core รับ HTTP request → ถาม feature ก่อน (`handleHttp`) | [server/index.js:17](server/index.js#L17) |
| 3 | cloud: รับเฉพาะ `GET`/`HEAD` | [server/features/cloud.js:51](server/features/cloud.js#L51) |
| 4 | แปลง URL → ไฟล์ใน `client/dist` (`/` → `index.html`) | [server/features/cloud.js:24-38](server/features/cloud.js#L24-L38) |
| 5 | **กัน path traversal:** ไฟล์ต้องอยู่ใน `client/dist` เท่านั้น เช่น `/../../server/index.js` → ไม่ใช่ → `false` | [server/features/cloud.js:35](server/features/cloud.js#L35) |
| 6 | ไม่ใช่ไฟล์หน้าเว็บ → return `false` → core ตอบ 404 (**R2 ยังเป็นจริง**) | [server/features/cloud.js:53](server/features/cloud.js#L53) → [server/index.js:18-20](server/index.js#L18-L20) |
| 7 | เป็นไฟล์ → ตอบ 200 + Content-Type + Cache-Control (ไฟล์ใน `assets/` มี hash จึง cache ได้นาน) | [server/features/cloud.js:55-60](server/features/cloud.js#L55-L60) |
| 8 | React โหลดเสร็จ → Server URL เริ่มต้น = `window.location.origin` (`https://<app>`) | [client/src/socket.js:7-9](client/src/socket.js#L7-L9) |
| 9 | login → `io("https://<app>")` → Socket.IO ต่อ `wss://<app>/socket.io/…` (TLS) → proxy → server → 101 → WebSocket | [client/src/socket.js:15](client/src/socket.js#L15) |
| 10 | socket ใหม่ → `setupSocket` ของ cloud log IP จริงจาก `X-Forwarded-For` (core log จะเห็นแค่ IP ของ proxy) | [server/features/cloud.js:42-45](server/features/cloud.js#L42-L45), [:63-67](server/features/cloud.js#L63-L67) |

จากนั้นทุกอย่างเหมือน R3–R11 ใน [Handbook.md](Handbook.md) ทุกประการ

**โปรโตคอลที่เพิ่มเข้ามาเมื่อขึ้น Cloud** (ใช้ตอบคำถาม R1 / อธิบายตอน demo)

| Protocol / กลไก | ใช้ทำอะไร |
|---|---|
| **TLS** (HTTPS / WSS) | เข้ารหัสข้อมูลระหว่าง browser ↔ Railway ข้อความแชทไม่ถูกอ่านระหว่างทาง (บน LAN เราใช้ `http://` / `ws://` ไม่เข้ารหัส) |
| **Reverse proxy** | Railway รับ connection จาก internet แล้วส่งต่อให้ server ของเรา → server เห็น IP ของ proxy |
| **X-Forwarded-For** | header ที่ proxy ใส่ IP จริงของ client มาให้ |
| **DNS** | `<app>.up.railway.app` → IP ของ Railway (บน LAN เราใช้ IP ตรง ๆ ไม่ผ่าน DNS) |

**Test:** [server/tests/features/f01-cloud.test.mjs](server/tests/features/f01-cloud.test.mjs) · `npm test -- f01`

---

## Feature 2 — Discord bridge

> กลุ่ม `#discord` ในแอป ↔ channel หนึ่งใน Discord server จริง พิมพ์ในแอปแล้วขึ้นใน Discord และพิมพ์ใน Discord แล้วขึ้นในแอป
> Checklist + วิธีตั้ง bot: [docs/features/discord_TEST.md](docs/features/discord_TEST.md)

```
 Client (แอปเรา)          Our server (Node.js)                         Discord
┌────────────┐  Socket.IO  ┌──────────────────────────┐  Gateway (WSS, TLS)  ┌──────────┐
│ #discord   │ ══════════> │ core: group_msg (R11)     │ <══════════════════> │ #general │
│ [join]     │ <══════════ │ features/discord.js (bot) │  REST API (HTTPS)    │          │
└────────────┘             └──────────────────────────┘ ───────────────────> └──────────┘
```

server ของเราเป็น **client ของ Discord**: login ผ่าน Discord Gateway (WebSocket over TLS) เพื่อรอรับข้อความ และส่งข้อความผ่าน REST API (HTTPS)
ส่วนแอปเรากับ browser ยังคุยกันผ่าน Socket.IO ทุกอย่าง **R2 ยังเป็นจริง**

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/discord.js](server/features/discord.js) | bot (discord.js): login, รับ/ส่งข้อความ, แปลงข้อความทั้ง 2 ทิศทาง |
| [server/.env.example](server/.env.example) | ตัวอย่าง env ที่ต้องตั้ง (`DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, `DISCORD_GROUP`) |
| [client/src/features/discord/](client/src/features/discord/index.jsx) | ป้าย `⇄ discord` ข้างกลุ่ม, `[discord]` ข้างชื่อผู้ส่ง, สี blurple |
| core ที่แตะ (มี comment `Feature: discord`) | [App.jsx:6](client/src/App.jsx#L6), [:23](client/src/App.jsx#L23), [:65](client/src/App.jsx#L65), [:109-110](client/src/App.jsx#L109-L110), [:286](client/src/App.jsx#L286), [:352](client/src/App.jsx#L352) · [ChatRoom.jsx:3](client/src/ChatRoom.jsx#L3), [:67-80](client/src/ChatRoom.jsx#L67-L80) |

**ลำดับการทำงาน: server เริ่ม**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | `env.js` โหลด `server/.env` (ถ้ามี ยกเว้นตอน test) แล้วอ่าน token / channel id / ชื่อกลุ่ม | [server/features/env.js](server/features/env.js) → [discord.js:15-22](server/features/discord.js#L15-L22) |
| 2 | ไม่มี token หรือ channel → feature ปิดตัวเอง (`discord (off: ...)`) แอปทำงานปกติ | [:22](server/features/discord.js#L22), [:53](server/features/discord.js#L53) |
| 3 | core เรียก `initFeatures` → สร้างกลุ่ม `#discord` แบบ**ไม่มีสมาชิก** ใครอยากคุยก็กด `[join]` เอง (R10) | [server/index.js:38](server/index.js#L38) → [discord.js:55-60](server/features/discord.js#L55-L60) |
| 4 | สร้าง Discord client ขอ intent: Guilds, GuildMessages, **MessageContent** (ต้องเปิดใน Developer Portal) | [discord.js:63-65](server/features/discord.js#L63-L65) |
| 5 | `client.login(token)` → ต่อ Discord Gateway (WSS) → `ClientReady` → เปิด channel ตาม id | [discord.js:112](server/features/discord.js#L112), [:67-74](server/features/discord.js#L67-L74) |

**ลำดับการทำงาน: ขาออก (แอป → Discord)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | สมาชิก `#discord` ส่งข้อความ → core ตรวจสิทธิ์ (R11) → ส่งให้สมาชิกในแอป | [server/index.js:187-188](server/index.js#L187-L188) |
| 2 | core เรียก `onGroupMessage(msg)` | [server/index.js:189](server/index.js#L189) |
| 3 | discord: ไม่ใช่กลุ่มที่ bridge → ข้าม / bot ยังต่อ Discord ไม่สำเร็จ → **log เตือน** `NOT forwarded` (ไม่ข้ามเงียบ ๆ) | [discord.js:123-128](server/features/discord.js#L123-L128) |
| 4 | แปลงเป็น `**C1**: text` (escape markdown ในชื่อ) | [discord.js:27-29](server/features/discord.js#L27-L29) |
| 5 | `channel.send(...)` ผ่าน REST API โดย `allowedMentions: { parse: [] }` → **ไม่ ping `@everyone` / `@user`** | [discord.js:130-132](server/features/discord.js#L130-L132) |

**ลำดับการทำงาน: ขาเข้า (Discord → แอป)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | มีคนพิมพ์ใน Discord → Gateway ส่ง event `MessageCreate` มาที่ bot | [discord.js:77](server/features/discord.js#L77) |
| 2 | ไม่ใช่ channel ที่ bridge หรือเป็นข้อความจาก bot → ข้าม / เนื้อหาว่าง → **log เตือน** ให้เปิด MESSAGE CONTENT INTENT | [discord.js:78](server/features/discord.js#L78) |
| 3 | **ข้อความจาก bot (รวมถึงของตัวเอง) → ข้าม** กันวนลูป: ข้อความที่เราส่งออกไปจะไม่ย้อนกลับมา | [discord.js:34](server/features/discord.js#L34) |
| 4 | แปลงเป็น payload `group_msg`: ชื่อ = nickname ใน server, แนบ URL ของไฟล์, ตัดที่ 1000 ตัวอักษร (เท่า core), `source: "discord"` | [discord.js:33-46](server/features/discord.js#L33-L46) |
| 5 | ส่งให้ **room `group:discord` เท่านั้น** (เหมือน R11 คนที่ไม่ใช่สมาชิกไม่ได้รับ) | [discord.js:86](server/features/discord.js#L86) |
| 6 | Client: ข้อความที่ `source === "discord"` แสดงป้าย `[discord]` สี blurple และ**ไม่นับเป็นข้อความของเรา** แม้ชื่อจะตรงกับเรา (กันปลอมตัว) | [ChatRoom.jsx:67-80](client/src/ChatRoom.jsx#L67-L80) |

**ลำดับการทำงาน: UI รู้ได้อย่างไรว่ากลุ่มไหน bridge**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | socket ใหม่ → `setupSocket` ของ discord ส่ง `bridge_info { group, platform, channel }` | [discord.js:116-118](server/features/discord.js#L116-L118) |
| 2 | Client เก็บไว้ใน `bridges` → แสดง `⇄ discord` ข้างชื่อกลุ่ม และ "bridged to Discord #channel" ในหัวห้อง | [App.jsx:109-110](client/src/App.jsx#L109-L110), [:286](client/src/App.jsx#L286), [:352](client/src/App.jsx#L352) |

**ความปลอดภัย / ความเป็นส่วนตัว**
- **token ห้าม commit** อยู่ใน `server/.env` (gitignore แล้ว) หรือ Variables ของ Railway เท่านั้น
- ข้อความในกลุ่ม `#discord` **คนใน Discord channel เห็นด้วย** UI จึงบอกไว้ชัดเจนด้วยป้าย `⇄ discord` / "bridged to Discord" ส่วนกลุ่มอื่นและ private message ไม่ถูกส่งออกไปเลย
- ข้อความจาก Discord มีป้าย `[discord]` เสมอ คนใน Discord จึงปลอมเป็นผู้ใช้ในแอปไม่ได้

**Test:** [server/tests/features/f02-discord.test.mjs](server/tests/features/f02-discord.test.mjs) · `npm test -- f02` (ไม่ต่อ Discord จริง ทดสอบการแปลงข้อความด้วย message ปลอม + ตรวจว่า feature ปิดเองเมื่อไม่มี token)

---

## Feature 3 — /ping (+ ระบบ slash command)

> พิมพ์ `/ping` ในห้องแชท → วัด **round-trip time (RTT)** ระหว่าง client ↔ server แล้วแสดงผลแบบคำสั่ง `ping` ของ OS
> Checklist: [docs/features/ping_TEST.md](docs/features/ping_TEST.md)

```
C1@#g1:~$ /ping
PING 192.168.1.56:3000 via websocket: 4 requests
reply from server: seq=1 time=12.3 ms
...
--- 4 sent, 4 received, 0% loss · min/avg/max = 9.8/10.8/12.3 ms · server uptime 5m 2s · 3 online
```

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/ping.js](server/features/ping.js) | `ping_check`: ตอบผ่าน **acknowledgement** ทันที / `ping_user`: ส่ง probe ต่อไปหาผู้ใช้ปลายทางแล้วจับเวลาช่วง server ↔ ปลายทาง |
| [client/src/features/commands/](client/src/features/commands/index.js) | ระบบ slash command: แยกคำสั่ง ([parse.js](client/src/features/commands/parse.js)), ทะเบียนคำสั่ง (`/help`, `/ping`), บรรทัดผลลัพธ์ ([SystemLine.jsx](client/src/features/commands/SystemLine.jsx)) |
| [client/src/features/ping/](client/src/features/ping/ping.js) | ส่ง ping ทีละครั้ง จับเวลา ([ping.js](client/src/features/ping/ping.js)) + สรุปผล ([stats.js](client/src/features/ping/stats.js)) |
| core ที่แตะ (มี comment `Feature: ping`) | [App.jsx:7-9](client/src/App.jsx#L7-L9), [:111-112](client/src/App.jsx#L111-L112), [:125-133](client/src/App.jsx#L125-L133) · [ChatRoom.jsx:4](client/src/ChatRoom.jsx#L4), [:66](client/src/ChatRoom.jsx#L66), [:97](client/src/ChatRoom.jsx#L97) |

**ลำดับการทำงาน: พิมพ์อะไรก็ได้ในช่องแชท (ระบบ slash command)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | กด Enter → `sendToActiveRoom(input)` ส่งข้อความให้ระบบคำสั่งดูก่อน | [App.jsx:125-132](client/src/App.jsx#L125-L132) |
| 2 | `parseInput`: ไม่ขึ้นต้นด้วย `/` → ข้อความปกติ / `//text` → ส่ง `/text` เป็นข้อความ / `/name args` → คำสั่ง | [parse.js](client/src/features/commands/parse.js) → [commands/index.js:31-32](client/src/features/commands/index.js#L31-L32) |
| 3 | ข้อความปกติ → คืนข้อความ → core ส่ง `private_msg` / `group_msg` ตามเดิม (R7, R11) | [App.jsx:133-135](client/src/App.jsx#L133-L135) |
| 4 | คำสั่ง → พิมพ์ `$ /ping` แล้วเรียกคำสั่ง (ไม่รู้จัก → `unknown command`) คืน `null` = **ไม่ส่งเป็นแชท** | [commands/index.js:35-41](client/src/features/commands/index.js#L35-L41) |
| 5 | ผลลัพธ์ทุกบรรทัด → `addMessage(ห้องเดิม, systemMessage(line))` → อยู่ในจอเราคนเดียว | [App.jsx:128-132](client/src/App.jsx#L128-L132) |
| 6 | `ChatRoom`: ข้อความ `system` แสดงเป็นบรรทัดสีเทาแบบ output ของ terminal | [ChatRoom.jsx:66](client/src/ChatRoom.jsx#L66) |

**ลำดับการทำงาน: `/ping [n]` (วัดกับ server)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | แยก argument: ไม่ใส่ = 4 ครั้ง, ตัวเลข = จำนวนครั้ง (1–10) | [ping.js:15](client/src/features/ping/ping.js#L15) → [stats.js](client/src/features/ping/stats.js) `parsePingArgs` |
| 2 | พิมพ์ `PING <host> via <transport>` (transport = `websocket` แสดงว่าวัดผ่าน WebSocket จริง) | [ping.js:19](client/src/features/ping/ping.js#L19) |
| 3 | ทีละครั้ง: จับเวลา `t0` → `socket.timeout(3000).emitWithAck("ping_check", { seq })` | [ping.js:23-24](client/src/features/ping/ping.js#L23-L24), [ping.js:40](client/src/features/ping/ping.js#L40) |
| 4 | Server: ต้องมี ack + ต้อง register แล้ว → `ack({ seq, serverTime, uptimeSec, online })` ทันที | [ping.js:27-35](server/features/ping.js#L27-L35) |
| 5 | Client: ได้ ack → `RTT = performance.now() − t0` → `reply from server: seq=1 time=… ms` | [ping.js:41-43](client/src/features/ping/ping.js#L41-L43) |
| 6 | ไม่ได้ ack ภายในเวลา → `request timeout` (นับเป็น loss) | [ping.js:45-47](client/src/features/ping/ping.js#L45-L47) |
| 7 | สรุป sent / received / loss% / min/avg/max + uptime + จำนวนคนออนไลน์จาก server | [ping.js:51-56](client/src/features/ping/ping.js#L51-L56) → [stats.js](client/src/features/ping/stats.js) `summarize` |

**ลำดับการทำงาน: `/ping <ชื่อ> [n]` (วัดกับผู้ใช้อีกคน ผ่าน server)**

ไม่มีทาง ping client ↔ client ตรง ๆ เพราะระบบเป็น client–server (star topology) ทุกอย่างผ่าน server จึงวัด **C1 → server → C2 → server → C1**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | argument แรกไม่ใช่ตัวเลข = ชื่อ (`/ping C2`, `/ping C2 10`, ชื่อที่เป็นตัวเลขใช้ `/ping @10`) | [stats.js](client/src/features/ping/stats.js) `parsePingArgs` |
| 2 | C1: จับเวลา `t0` → `emitWithAck("ping_user", { to: "C2", seq })` | [ping.js:24](client/src/features/ping/ping.js#L24), [ping.js:28](client/src/features/ping/ping.js#L28) |
| 3 | Server: ต้อง register / C2 ต้องออนไลน์ (`USER_NOT_FOUND`) / ห้าม ping ตัวเอง (`SELF`) — ตอบเป็น ack `{ ok: false, code }` | [ping.js:39-46](server/features/ping.js#L39-L46) |
| 4 | Server: จับเวลาช่วงของตัวเอง แล้วส่ง `ping_probe { from: <ชื่อจริงของ C1>, seq }` ไปหา C2 แบบ**มี ack + timeout 2 วินาที** | [ping.js:49-50](server/features/ping.js#L49-L50) |
| 5 | C2: `setupPingProbe` **ตอบ ack ทันที** (ก่อนทำอย่างอื่น ให้เวลาแม่นที่สุด) แล้วแจ้ง `C1 is pinging you` ในห้อง private กับ C1 (ครั้งเดียวต่อรอบ) | [ping.js:61-64](client/src/features/ping/ping.js#L61-L64) ← [App.jsx:111-112](client/src/App.jsx#L111-L112) |
| 6 | Server: ได้ ack จาก C2 → `ack({ ok: true, legMs })` กลับไปหา C1 โดย `legMs` = เวลาช่วง server ↔ C2 / C2 ไม่ตอบ → `TIMEOUT` | [ping.js:51-52](server/features/ping.js#L51-L52) |
| 7 | C1: `RTT` ทั้งหมด แยกเป็น `you↔server = RTT − legMs` + `server↔C2 = legMs` | [ping.js:29-38](client/src/features/ping/ping.js#L29-L38) |
| 8 | `USER_NOT_FOUND` / `SELF` → แสดงเหตุผลแล้วหยุด / `TIMEOUT` → `request timeout … (C2 did not answer)` นับเป็น loss | [ping.js:30-34](client/src/features/ping/ping.js#L30-L34), [ping.js:45-47](client/src/features/ping/ping.js#L45-L47) |

**ทำไมแยกเวลาได้:** server จับเวลาเฉพาะช่วงที่ตัวเองส่ง probe ไปหา C2 จนได้ ack (`legMs`) ส่วน C1 จับเวลาทั้งหมด ผลต่างจึงเป็นช่วง C1 ↔ server เช่น C2 ใช้มือถือ 4G → `server↔C2` สูง ส่วน `you↔server` ยังต่ำ ทำให้รู้ว่า**ช้าที่ฝั่งไหน**

**อธิบายตอน demo: RTT ที่เราวัดคืออะไร**

| | วัดอะไร | ใครส่ง |
|---|---|---|
| **`/ping` ของเรา** | เวลาไป-กลับ **ทั้งทาง**: browser → TCP → WebSocket → Socket.IO → event loop ของ server → ack กลับมา (application layer) | ผู้ใช้สั่ง |
| `ping` ของ OS (ICMP) | เวลาไป-กลับระดับ network layer (IP) ไม่ผ่าน TCP / แอป | OS |
| heartbeat ของ Engine.IO (`2` / `3` ใน DevTools) | ไม่ได้วัดเวลาให้ผู้ใช้ ใช้ตรวจว่า connection ยังไม่ตาย (R4 การหลุดการเชื่อมต่อ) | Socket.IO อัตโนมัติ |

**Acknowledgement คืออะไร:** `emit` ที่แนบ callback ตัวสุดท้าย Socket.IO จะใส่ **packet id** ให้คำขอ แล้วเมื่อ server เรียก `ack(...)` จะส่ง packet ประเภท ACK ที่มี id เดียวกันกลับมา client จึงจับคู่คำตอบกับคำขอได้ถูก แม้ส่งหลายอันพร้อมกัน (มี test ยืนยัน)

**Test:** [server/tests/features/f03-ping.test.mjs](server/tests/features/f03-ping.test.mjs) · `npm test -- f03`

---

## Feature 4 — เกมเป่ายิ้งฉุบ (RPS)

> เล่นเป่ายิ้งฉุบกับผู้ใช้อีกคนผ่าน socket โดย **server เป็นคนตัดสินทั้งหมด** และ**ซ่อนคำตอบไว้จนเลือกครบ 2 คน**
> Checklist: [docs/features/game_TEST.md](docs/features/game_TEST.md)

```
C1: /play rps C2          C2: /accept
C1: /move rock      →  C2 เห็นแค่ "C1 has chosen"  (rock ยังเป็นความลับที่ server)
C2: /move s         →  ทั้งคู่: round 1: C1 ✊ rock vs C2 ✌️ scissors → C1 wins the round · score C1 1 – 0 C2
...                    ทั้งคู่: 🏆 C1 wins the game! score C1 2 – 0 C2
```

**ทำไม server ต้องเป็นคนตัดสิน (server-authoritative)**
- ถ้า C1 ส่ง `rock` ตรงไปให้ C2 → client ของ C2 ได้คำตอบก่อนเลือก (เปิด DevTools ดูได้) แล้วเลือก paper ชนะทุกรอบ
- เราจึงส่งคำตอบไป**เก็บที่ server** เท่านั้น server บอกอีกฝ่ายแค่ "เลือกแล้ว" (`moved: ["C1"]`) และเปิดคำตอบทั้งคู่**พร้อมกัน**เมื่อครบ
- client ส่งแค่ "การกระทำ" (ท้า / ตอบรับ / เลือก / ออก) ส่วนกติกา ตา คะแนน ผู้ชนะ อยู่ที่ server ทั้งหมด → client โกงไม่ได้ (หลักเดียวกับที่ server ตรวจสิทธิ์ใน R7 / R10 / R11)
- update ทุกอันส่งให้**ผู้เล่น 2 คนเท่านั้น** (`clients.get(ชื่อ).emit` เหมือน R7)

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/game.js](server/features/game.js) | สถานะเกมทั้งหมด + กติกา + ตัดสิน + ส่ง `game_update` ให้ผู้เล่น |
| [client/src/features/game/index.js](client/src/features/game/index.js) | รับ `game_update` มาแสดงในห้อง private กับคู่แข่ง + คำสั่ง `/play` `/accept` `/decline` `/move` `/quit` |
| [client/src/features/game/format.js](client/src/features/game/format.js) | แปลง update เป็นข้อความตามมุมมองของแต่ละคน (เช่น "you win" / "C1 wins") |
| core ที่แตะ (มี comment `Feature: game`) | [App.jsx:10](client/src/App.jsx#L10), [:113-114](client/src/App.jsx#L113-L114), [:129](client/src/App.jsx#L129) (ส่ง `room` ให้คำสั่ง) · [commands/index.js:24](client/src/features/commands/index.js#L24) |

**สถานะที่ server เก็บ** ([game.js:30-31](server/features/game.js#L30-L31))
```js
games:   Map<id, { players: [คนท้า, คนถูกท้า], status, bestOf, round, score, moves /* ความลับของรอบนี้ */ }>
playing: Map<ชื่อ, id>   // 1 คนเล่นได้ทีละเกม
```
สิ่งที่ส่งให้ client คือ `publicState` ซึ่ง**ไม่มี `moves`** มีแค่ `moved` (ชื่อคนที่เลือกแล้ว) — [game.js:36-48](server/features/game.js#L36-L48)

**ลำดับการทำงาน**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | C1 `/play rps C2 [1/3/5]` → `emitWithAck("game_challenge", { to, game, bestOf })` | [index.js:50-58](client/src/features/game/index.js#L50-L58) |
| 2 | Server ตรวจ: register / เกมที่รู้จัก / ไม่ท้าตัวเอง / C2 ออนไลน์ / ทั้งคู่ว่าง → สร้างเกม `pending` + ตั้งเวลาหมดอายุ | [game.js:77-105](server/features/game.js#L77-L105) |
| 3 | ส่ง `game_update { event: "challenge" }` ให้ C1 และ C2 → แต่ละฝั่งแสดงในห้อง private กับอีกฝ่าย | [game.js:106](server/features/game.js#L106) → [index.js:9-16](client/src/features/game/index.js#L9-L16) |
| 4 | C2 `/accept` → `game_respond` (**เฉพาะคนถูกท้า** ตอบได้) → `playing` + `accepted` | [game.js:110-127](server/features/game.js#L110-L127) |
| 5 | `/move rock` → `game_move` → server ตรวจ move / เลือกซ้ำ → **เก็บไว้ใน `g.moves`** แล้ว ack บอกคนเลือกคนเดียว | [game.js:129-140](server/features/game.js#L129-L140) |
| 6 | ยังไม่ครบ 2 คน → ส่งแค่ `moved { by: "C1" }` (ไม่มีคำตอบ) | [game.js:142](server/features/game.js#L142) |
| 7 | ครบ 2 คน → `rpsWinner` ตัดสิน → เปิดคำตอบทั้งคู่ใน `result` → เพิ่มคะแนน → ล้าง moves → รอบถัดไป | [game.js:144-151](server/features/game.js#L144-L151) → [game.js:20-23](server/features/game.js#L20-L23) |
| 8 | มีคนได้ `ceil(bestOf/2)` แต้ม → `finished` + ผู้ชนะ / ยังไม่ครบ → `round` | [game.js:152-160](server/features/game.js#L152-L160) |
| 9 | `/decline` → `declined` / `/quit` → `quit` (อีกฝ่ายชนะ) / ไม่ตอบใน 60 วินาที → `expired` / ผู้เล่นหลุด → `abandoned` | [game.js:118-122](server/features/game.js#L118-L122), [game.js:163-173](server/features/game.js#L163-L173), [game.js:99-104](server/features/game.js#L99-L104), [game.js:175-182](server/features/game.js#L175-L182) |
| 10 | Client แปลงแต่ละ event เป็นข้อความตามมุมมองของตัวเอง | [format.js:21](client/src/features/game/format.js#L21) |

**ข้อจำกัด**: state อยู่ใน memory ของ server (restart = เกมหาย) · 1 คนเล่นได้ทีละเกม · ตอนนี้มีแค่ RPS (โครง `GAMES` และ `/play <game>` รองรับการเพิ่มเกมอื่น เช่น XO)

**Test:** [server/tests/features/f04-game.test.mjs](server/tests/features/f04-game.test.mjs) · `npm test -- f04`

---

## Feature 5 — เกมทายคำ AI (AI บังคับ)

> **AI คิดคำลับ + คำใบ้ 10 ข้อ** แล้วส่งคำใบ้ให้กลุ่ม**ทีละข้อผ่าน socket ทุก 30 วินาที** ใครพิมพ์ถูกก่อน (**ภาษาอังกฤษ**) ชนะ ครบ 5 นาทีไม่มีผู้ชนะ
> **เลือก AI ได้ 3 เจ้า: Claude / ChatGPT / Gemini** · **นี่คือฟีเจอร์ AI ที่ Part 3 บังคับ** · Checklist: [docs/features/guess_TEST.md](docs/features/guess_TEST.md)
> **AI เป็น client อีกตัว**: โปรแกรม [ai-bot/](ai-bot/index.js) ต่อเข้า server ด้วย Socket.IO แล้ว login เป็นผู้ใช้ชื่อ **`AI`** ทุกข้อความของ AI จึงวิ่ง **AI bot → server → สมาชิกกลุ่ม** ผ่าน socket เหมือนคนพิมพ์

```
#g1  C1: /guess start animal gemini              (หมวด + AI เลือกได้ ไม่ใส่ = สุ่มหมวด / AI เริ่มต้น)
#g1  AI [ai]: [Gemini] 🎲 C1 started a guessing game — Gemini is thinking of an ANIMAL...
#g1  AI [ai]: [Gemini] I'm thinking of an ANIMAL. You have 5 minutes — first correct guess wins! Type your guess in ENGLISH in this chat.
#g1  AI [ai]: [Gemini] hint 1/10: It is a bird.
#g1  C2: เพนกวิน                                  ← ภาษาไทยไม่นับ
#g1  AI [ai]: [Gemini] hint 2/10: It cannot fly.  (ทุก 30 วินาที)
#g1  C3: penguin
#g1  AI [ai]: [Gemini] 🎉 C3 got it in 41s! The answer was PENGUIN.
```

```
 C1 ──guess_start──> Server ──bot_request (ack)──> AI bot ──HTTPS──> Claude / OpenAI / Gemini API
 C1 <──ack {ok, ai}── Server <──ack─────────────────┘   │  <── { word, aliases, hints[10] } (ความลับ อยู่ที่ bot)
                                                         │
 สมาชิก g1 <══group_msg══ Server (core R11) <══join_group / group_msg "[Gemini] hint 1/10: …"══ AI bot
 C3 ══group_msg "penguin"══> Server (core R11) ══group_msg══> สมาชิก g1 + AI bot (เป็นสมาชิก) ──> เทียบคำตอบ ──> 🎉
```

server log ตอนเล่น (เห็นว่าข้อความของ AI เข้ามาทาง socket เหมือนผู้ใช้):
```
[recv] AI -> register {"name":"AI","token":"***"}
[recv] C1 -> guess_start {"group":"g1","category":"animal","ai":"gemini"}
[recv] AI -> join_group {"group":"g1"}
[recv] AI -> group_msg {"group":"g1","text":"[Gemini] hint 1/10: It is a bird."}
```

**วิธีรัน** (2 โปรแกรม): `npm start` (server) + `npm run bot` (AI bot อีก terminal) · ใส่ `AI_BOT_TOKEN` ค่าเดียวกันใน `server/.env` และ `ai-bot/.env` · API key ของ AI ใส่ใน `ai-bot/.env` เท่านั้น

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [ai-bot/index.js](ai-bot/index.js) | **ตัว bot (Socket.IO client)**: login เป็น `AI` + token, รับ `bot_request`, `join_group` เอง, ส่ง `group_msg`, รับคำทายจากกลุ่ม |
| [ai-bot/game.js](ai-bot/game.js) | สถานะเกมต่อกลุ่ม + ส่งคำใบ้ตามเวลา + หมดเวลา + เทียบคำทาย (ไม่รู้จัก socket ใช้ `say` / `join` ที่ index.js ให้มา) |
| [ai-bot/guess-ai.js](ai-bot/guess-ai.js) | **ตัวกลางของ AI**: prompt + JSON schema ชุดเดียว, เลือก AI (`pickProvider`), ตรวจผล (`cleanPuzzle`, `cleanFeedback`) |
| [ai-bot/ai-providers/](ai-bot/ai-providers/claude.js) | 1 ไฟล์ต่อเจ้า: [claude.js](ai-bot/ai-providers/claude.js) · [openai.js](ai-bot/ai-providers/openai.js) · [gemini.js](ai-bot/ai-providers/gemini.js) — ทุกตัวมี `generateJson(prompt, schema)` หน้าตาเดียวกัน |
| [ai-bot/env.js](ai-bot/env.js) · [.env.example](ai-bot/.env.example) | โหลด `AI_BOT_TOKEN` + API key จาก `ai-bot/.env` |
| [server/features/bot.js](server/features/bot.js) | **ฝั่ง server**: สงวนชื่อ `AI` (ต้องมี token) + ตรวจสมาชิก + ส่งคำสั่ง `/guess` ต่อให้ bot / `BOT_OFFLINE` |
| [client/src/features/guess/](client/src/features/guess/commands.js) | คำสั่ง `/guess start\|hints\|stop\|ai` + ป้าย `[ai]` สีม่วงบนข้อความจากผู้ใช้ `AI` ([AiTag.jsx](client/src/features/guess/AiTag.jsx)) |
| core ที่แตะ | server: [index.js:81-89](server/index.js#L81-L89) (ซ่อน token ใน log), [index.js:98-100](server/index.js#L98-L100) (`checkRegister`) · client (comment `Feature: guess`): [ChatRoom.jsx:5](client/src/ChatRoom.jsx#L5), [:69-70](client/src/ChatRoom.jsx#L69-L70) · [commands/index.js:7](client/src/features/commands/index.js#L7), [:25](client/src/features/commands/index.js#L25) |

**AI ทั้ง 3 เจ้า**

| | Claude | ChatGPT | Gemini |
|---|---|---|---|
| SDK (ใน AI bot เท่านั้น) | `@anthropic-ai/sdk` | `openai` | `@google/genai` |
| เรียก | `client.beta.messages.create` | `client.responses.create` | `client.models.generateContent` |
| บังคับ JSON (structured output) | `output_config.format` json_schema | `text.format` json_schema (`strict`) | `responseMimeType` + `responseJsonSchema` |
| โมเดล | `claude-opus-5-5` (effort low, `fallbacks: "default"`) | `gpt-5.5` (reasoning low) / env `OPENAI_MODEL` | `gemini-flash-latest` / env `GEMINI_MODEL` |
| key (`ai-bot/.env`) | `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` | `GEMINI_API_KEY` |
| โค้ด | [claude.js:16-38](ai-bot/ai-providers/claude.js#L16-L38) | [openai.js:15-35](ai-bot/ai-providers/openai.js#L15-L35) | [gemini.js:22-42](ai-bot/ai-providers/gemini.js#L22-L42) |

**ลำดับการทำงาน: bot เข้าระบบ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | `npm run bot` → ต่อ server (`SERVER_URL`) ด้วย Socket.IO `reconnection: true` (server restart แล้วกลับมาเอง) | [index.js:27](ai-bot/index.js#L27) |
| 2 | `connect` → `register { name: "AI", token }` | [index.js:62-65](ai-bot/index.js#L62-L65) |
| 3 | Server: core เรียก `checkRegister` ก่อนจองชื่อ (R3) → ชื่อ `AI` (ตัวพิมพ์ใดก็ได้) ต้องมี token ตรงกับ `AI_BOT_TOKEN` ไม่งั้น `NAME_RESERVED` → **ผู้ใช้ปลอมเป็น AI ไม่ได้** | [index.js:98-100](server/index.js#L98-L100) → [index.js:53-59](server/features/index.js#L53-L59) → [bot.js:29-36](server/features/bot.js#L29-L36) |
| 4 | ผ่าน → เป็นผู้ใช้คนหนึ่ง: อยู่ในรายชื่อออนไลน์ (R4), `/ping AI` ได้ (ตอบ `ping_probe`) | [index.js:67](ai-bot/index.js#L67), [index.js:101](ai-bot/index.js#L101) |

**ลำดับการทำงาน: เริ่มเกม (AI คิดโจทย์)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | `/guess start [person\|animal\|object] [claude\|chatgpt\|gemini]` ในห้องกลุ่ม → แยกหมวด/AI (ลำดับไหนก็ได้) → `emitWithAck("guess_start", { group, category, ai })` | [commands.js](client/src/features/guess/commands.js) `parseStartArgs` |
| 2 | **Server** ตรวจ: กลุ่มมีอยู่ / **เป็นสมาชิก (R11)** → bot ออนไลน์ไหม (ไม่ → `BOT_OFFLINE`) | [bot.js:39-54](server/features/bot.js#L39-L54) |
| 3 | Server ส่งต่อ `bot_request { event, from, group, category, ai }` ให้ bot แบบมี ack (รอ ≤ 10 วินาที) — **`from` มาจาก server** (`socket.data.name`) bot จึงเชื่อได้ว่าใครสั่ง | [bot.js:55-61](server/features/bot.js#L55-L61) |
| 4 | **Bot** รับ → ตรวจ: ยังไม่มีเกม / หมวดถูก / **เลือก AI** (ระบุมา → ต้องมี key / ไม่ระบุ → `GUESS_AI_PROVIDER` หรือตัวแรกที่มี key) ไม่ผ่าน → ack error ไปถึงคนสั่งคนเดียว **ไม่เริ่มเกม** | [index.js:83-92](ai-bot/index.js#L83-L92) → [game.js:75-86](ai-bot/game.js#L75-L86) → [guess-ai.js:96-108](ai-bot/guess-ai.js#L96-L108) |
| 5 | **จองกลุ่ม** ด้วย `slot` (กันเริ่มซ้อน) แล้วตอบ ack `{ ok, ai }` ทันที (ไม่รอ AI) → server ส่งต่อให้คนสั่ง | [game.js:88-93](ai-bot/game.js#L88-L93) |
| 6 | Bot **`join_group` เอง** (R10 — ไม่มีใครดึงเข้า) รอ `join_group_ok` → เป็นสมาชิก: พูดในกลุ่มได้ + ได้รับคำทายของทุกคน | [game.js:98-99](ai-bot/game.js#L98-L99) → [index.js:37-57](ai-bot/index.js#L37-L57) |
| 7 | ประกาศ `[Gemini] 🎲 C1 started … is thinking of …` = bot `emit("group_msg")` → core ตรวจสิทธิ์ + ส่งให้สมาชิก (R11) | [game.js:104](ai-bot/game.js#L104) → [game.js:45](ai-bot/game.js#L45) → [index.js:31-34](ai-bot/index.js#L31-L34) |
| 8 | `generatePuzzle` → provider ที่เลือกเรียก API ด้วย **prompt + schema ชุดเดียวกัน** (คำตอบภาษาอังกฤษ, คำใบ้ 10 ข้อจากยากไปง่าย, ห้ามหลุดคำตอบ, ห้ามซ้ำ 30 คำล่าสุด) | [game.js:108](ai-bot/game.js#L108) → [guess-ai.js:111-114](ai-bot/guess-ai.js#L111-L114) → prompt [guess-ai.js:36-52](ai-bot/guess-ai.js#L36-L52) / schema [guess-ai.js:21-34](ai-bot/guess-ai.js#L21-L34) |
| 9 | **ตรวจซ้ำที่ bot** (ไม่เชื่อ AI 100%): คำตอบ/alias ต้องเป็นอักษรอังกฤษ (ชื่อไทยถูกตัด), ตัดคำใบ้ที่หลุดคำตอบ, < 3 ข้อ = ใช้ไม่ได้ | [guess-ai.js:71-85](ai-bot/guess-ai.js#L71-L85) |
| 10 | Error (key ผิด / quota / เน็ต / ปฏิเสธ) → ข้อความอ่านเข้าใจ → ประกาศในกลุ่ม + ปลดล็อก (ถ้าเกมถูกยกเลิกไปแล้วระหว่างรอ AI → เงียบ ไม่ลบเกมใหม่ของคนอื่น) | [game.js:107-114](ai-bot/game.js#L107-L114) |
| 11 | ได้โจทย์ → เก็บ `answers` (คำตอบ + alias ที่ normalize แล้ว) **ไว้ที่ bot เท่านั้น** (server ก็ไม่รู้) | [game.js:116-130](ai-bot/game.js#L116-L130) |

**ลำดับการทำงาน: ระหว่างเกม**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ประกาศกติกา (ทายเป็นภาษาอังกฤษ) + hint 1 ทันที | [game.js:132-137](ai-bot/game.js#L132-L137) |
| 2 | `setInterval`: hint ถัดไปทุก `5 นาที / 10 ข้อ = 30 วินาที` → bot ส่ง `group_msg` `[<AI>] hint n/10: …` ผ่าน server ไปที่กลุ่มเท่านั้น | [game.js:139](ai-bot/game.js#L139) → [game.js:67-72](ai-bot/game.js#L67-L72) |
| 3 | สมาชิกพิมพ์แชทตามปกติ → core ตรวจสิทธิ์ + ส่งให้สมาชิก (R11) **รวมถึง bot** → bot ข้ามข้อความของตัวเอง → `onGroupMessage` | [index.js:95-98](ai-bot/index.js#L95-L98) → [game.js:179-199](ai-bot/game.js#L179-L199) |
| 4 | `normalizeGuess`: ตัวพิมพ์ / ช่องว่าง / วรรคตอน / a-an-the → อยู่ใน `answers` (ภาษาอังกฤษเท่านั้น) = ชนะ | [game.js:26-33](ai-bot/game.js#L26-L33), [game.js:182](ai-bot/game.js#L182) |
| 5 | ถูก → `🎉 C3 got it in 41s! The answer was …` → หยุด timer ทั้งหมด | [game.js:183-184](ai-bot/game.js#L183-L184) → [game.js:54-60](ai-bot/game.js#L54-L60) |
| 6 | ครบ 5 นาที → `⏰ time's up — nobody got it` + เฉลย | [game.js:140-143](ai-bot/game.js#L140-L143) |
| 7 | `/guess hints` / `/guess stop` (เฉพาะคนเริ่ม) / `/guess ai` → server ตรวจสมาชิกแล้วส่งต่อแบบเดียวกับ `guess_start` → bot ตอบผ่าน ack | [bot.js:13](server/features/bot.js#L13) → [game.js:148-177](ai-bot/game.js#L148-L177) |
| 8 | Bot หลุด (เช่น server restart) → ล้างทุกเกม แล้วต่อใหม่ + register ใหม่เอง | [index.js:103-107](ai-bot/index.js#L103-L107) → [game.js:63-65](ai-bot/game.js#L63-L65) |

**ลำดับการทำงาน: ทายผิด → AI ใบ้เทียบกับคำทาย**

```
#g1  C2: seal
#g1  AI [ai]: [Gemini] 💬 C2 guessed "seal" — close! It also loves icy water and fish, but it's a bird, not a mammal.
```

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ข้อความไม่ใช่คำตอบ → ดูว่า**เป็นคำทายไหม**: อังกฤษ 1–4 คำ ≤ 30 ตัวอักษร (ประโยคยาว / ภาษาไทย = แชทปกติ ไม่เรียก AI) | [game.js:188](ai-bot/game.js#L188) → [game.js:19-22](ai-bot/game.js#L19-L22) |
| 2 | **จำกัด**: คนเดิมได้ 1 ครั้งต่อ 5 วินาที (`GUESS_FEEDBACK_COOLDOWN_MS`) + ทั้งเกมไม่เกิน 40 ครั้ง (`GUESS_MAX_FEEDBACK`) → กลุ่มไม่รก ค่าใช้จ่ายไม่บาน | [game.js:15-16](ai-bot/game.js#L15-L16), [game.js:188-192](ai-bot/game.js#L188-L192) |
| 3 | เรียก AI **ตัวเดียวกับพิธีกร** (`generateJson` + schema `{ feedback }`) ส่งคำตอบจริง + คำใบ้ที่ออกไปแล้ว + คำทาย ไปให้ AI จาก bot เท่านั้น | [game.js:194-195](ai-bot/game.js#L194-L195) → [guess-ai.js:148-158](ai-bot/guess-ai.js#L148-L158) → prompt [guess-ai.js:126-137](ai-bot/guess-ai.js#L126-L137) |
| 4 | **ตรวจที่ bot**: ข้อความจาก AI มีคำตอบ / alias → ทิ้ง ใช้ `not it, keep trying!` แทน / AI error → ใช้ข้อความกลาง ๆ เกมเล่นต่อได้เสมอ | [guess-ai.js:140-145](ai-bot/guess-ai.js#L140-L145) |
| 5 | ระหว่างรอ AI มีคนถูก / หมดเวลา / หยุดเกม → **ทิ้ง** ไม่ประกาศ / ไม่งั้น bot ส่ง `💬 <คน> guessed "<คำ>" — <คำใบ้>` เข้ากลุ่มผ่าน server | [game.js:196-197](ai-bot/game.js#L196-L197) |

**ทำไมออกแบบแบบนี้ (ใช้ตอบอาจารย์)**
- **AI เป็น client อีกตัว** → ทุกข้อความของ AI วิ่งผ่าน socket เข้า server แล้ว server ส่งต่อด้วยกฎเดียวกับคน (R10 เข้ากลุ่มเอง, R11 ส่งเฉพาะสมาชิก) server log เห็น `[recv] AI -> group_msg …` / ถ้าเล่นในกลุ่ม `#discord` ข้อความ AI ก็ข้ามไป Discord ด้วย (ผ่าน core เหมือนข้อความปกติ)
- **แยกหน้าที่**: server = ตัวกลางส่งข้อความ (ไม่มี API key ไม่รู้คำตอบ) / bot = สมอง (AI + กติกาเกม) → AI ช้าหรือ error ไม่ทำให้ server ค้าง, ปิด bot แล้วแชทยังใช้ได้ (`/guess` ได้ `BOT_OFFLINE`)
- **ชื่อ `AI` สงวนด้วยรหัสลับ** (`AI_BOT_TOKEN`) → client แยกข้อความ AI ด้วยชื่อผู้ส่งได้อย่างปลอดภัย (ป้าย `[ai]`) และ token ถูกซ่อนเป็น `***` ใน server log
- **เรียก AI ครั้งเดียวต่อเกม** (สำหรับโจทย์) ไม่ใช่ทุกคำใบ้ → เร็ว ประหยัด และคำใบ้ทั้ง 10 ข้อสอดคล้องกัน / คำใบ้ตอนทายผิดเรียกเพิ่มทีละครั้ง แต่มี cooldown + เพดานต่อเกม
- **API key อยู่ที่ bot** เท่านั้น browser และ server ไม่เคยเห็น
- **คำตอบไม่เคยถูกส่งให้ client** จนเกมจบ (test ยืนยัน) → เปิด DevTools ก็ไม่เห็น (bot log ก็ไม่พิมพ์คำตอบ เผื่อจอ bot อยู่บนโปรเจกเตอร์)
- **ใครถูกก่อน = ข้อความของใครมาถึง server ก่อน** (server ส่งต่อให้ bot ตามลำดับบน socket เส้นเดียว) → คนที่ `/ping` สูงเสียเปรียบ
- **หลาย AI ผ่าน interface เดียว** (`generateJson(prompt, schema)`) → เกมไม่รู้ว่าเป็นเจ้าไหน เพิ่มเจ้าใหม่ = เพิ่ม 1 ไฟล์ใน `ai-bot/ai-providers/` + 1 บรรทัดใน `PROVIDERS`

**Test:** [server/tests/features/f05-guess.test.mjs](server/tests/features/f05-guess.test.mjs) · `npm test -- f05` — **เปิด AI bot เป็น process แยกจริง** แล้วเล่นผ่าน socket (โจทย์ปลอม `GUESS_FAKE_AI=1` + เกม 3 วินาที **ไม่เรียก AI จริง**)

---

## Feature 6 — ส่งไฟล์ / รูปผ่าน socket

> ส่งไฟล์ไม่เกิน 5 MB ในห้อง private หรือห้องกลุ่ม: ปุ่ม `[+file]` / ลากไฟล์มาวาง / วางรูปจาก clipboard (Ctrl+V)
> ไฟล์ถูก**แบ่งเป็นชิ้นละ 64 KB ส่งทีละชิ้นผ่าน socket** server ส่งต่อทันทีโดย**ไม่เก็บไฟล์** · Checklist: [docs/features/file_TEST.md](docs/features/file_TEST.md)

```
#g1  C1: 📎 cat.png (300.0 KB)
         [##########----------] 50% sending...          ← ระหว่างส่ง (ผู้รับเห็น receiving...)
#g1  C1: 📎 cat.png (300.0 KB)
         <รูปตัวอย่าง>
         [download] sent in 0.4s (750.0 KB/s)
```

```
 C1 ──file_offer {to|group, name, size, type, ref} (ack)──> Server: ตรวจผู้รับ (R7: ออนไลน์ / R11: สมาชิก) + ขนาด ≤ 5 MB
 C1 <──ack {id, chunkSize: 65536}────────────────────────┘ ──file_start {id, from, name, size, chunks}──> ผู้รับ + C1 (echo)
 C1 ──file_chunk {id, seq: 0, data: <binary 64 KB>} (ack)──> Server: เจ้าของ? seq ถูกลำดับ? ขนาด? ──file_chunk──> ผู้รับ เท่านั้น
 C1 <──ack {received}────────────────────────────────────┘   (C1 รอ ack ก่อนส่งชิ้นถัดไป = stop-and-wait)
    ... ทำซ้ำจนครบทุกชิ้น ...
 C1 ──file_end {id} (ack)──> Server: ครบทุก byte? ──file_end──> ผู้รับ: ต่อทุกชิ้น → Blob → รูปตัวอย่าง / [download]
```

server log (ชิ้นไฟล์เป็น binary แสดงแค่ขนาด):
```
[recv] C1 -> file_offer {"to":"C2","name":"cat.png","size":300000,"type":"image/png","ref":"00xirfprk8ay"}
[recv] C1 -> file_chunk {"id":"1","seq":0,"data":"<binary 65536 bytes>"}
[recv] C1 -> file_chunk {"id":"1","seq":4,"data":"<binary 37856 bytes>"}
[recv] C1 -> file_end {"id":"1"}
```

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/file.js](server/features/file.js) | ตรวจสิทธิ์ + ตรวจชิ้น (เจ้าของ / ลำดับ / ขนาด) + ส่งต่อให้ผู้รับ + ยกเลิกเมื่อหลุด / เงียบเกิน 30 วินาที |
| [client/src/features/file/transfer.js](client/src/features/file/transfer.js) | `sendFile` (แบ่งชิ้น + stop-and-wait) / `setupFile` (รับชิ้น → ประกอบเป็นไฟล์) |
| [FileMessage.jsx](client/src/features/file/FileMessage.jsx) · [format.js](client/src/features/file/format.js) · [file.css](client/src/features/file/file.css) | แสดงข้อความไฟล์: progress bar แบบ terminal / รูปตัวอย่าง / `[download]` / ความเร็ว |
| core ที่แตะ (มี comment `Feature: file`) | server: [index.js:81-89](server/index.js#L81-L89) (log binary เป็นขนาด) · client: [App.jsx:54-59](client/src/App.jsx#L54-L59) (`updateFileMessage`), [App.jsx:115-116](client/src/App.jsx#L115-L116), [App.jsx:141-147](client/src/App.jsx#L141-L147), `onSendFile` [App.jsx:337](client/src/App.jsx#L337) · [ChatRoom.jsx:33-37](client/src/ChatRoom.jsx#L33-L37), [ChatRoom.jsx:51-63](client/src/ChatRoom.jsx#L51-L63) (ลากวาง), [ChatRoom.jsx:79](client/src/ChatRoom.jsx#L79), [ChatRoom.jsx:96](client/src/ChatRoom.jsx#L96) (paste), [ChatRoom.jsx:104-117](client/src/ChatRoom.jsx#L104-L117) (ปุ่ม `[+file]`) |

**ลำดับการทำงาน: ส่ง (ผู้ส่ง → server)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ผู้ใช้เลือกไฟล์ (`[+file]` / ลากวาง / Ctrl+V) → `onSendFile(file)` → ผู้รับ = ห้องที่เปิดอยู่ (`{ to }` หรือ `{ group }`) | [ChatRoom.jsx:33-37](client/src/ChatRoom.jsx#L33-L37) → [App.jsx:141-147](client/src/App.jsx#L141-L147) |
| 2 | `file_offer { to\|group, name, size, type, ref }` แบบมี ack (`ref` = เลขสุ่มไว้จับคู่กับไฟล์ในเครื่อง) | [transfer.js:65-74](client/src/features/file/transfer.js#L65-L74) |
| 3 | **Server ตรวจ**: ชื่อไฟล์ (ตัด path / ตัวอักษรควบคุม), ขนาด 1 byte – 5 MB (`FILE_TOO_LARGE`), ส่งพร้อมกันไม่เกิน 3 ไฟล์ | [file.js:78-88](server/features/file.js#L78-L88) → `cleanFileName` [file.js:23-30](server/features/file.js#L23-L30) |
| 4 | **ตรวจผู้รับด้วยกฎเดียวกับแชท**: private → ต้องออนไลน์ ไม่ใช่ตัวเอง (R7) / group → ต้องมีกลุ่ม + เป็นสมาชิก (R11) | [file.js:90-103](server/features/file.js#L90-L103) |
| 5 | สร้างการส่ง (`id`, จำนวนชิ้น = `ceil(size / 64 KB)`) → ack `{ id, chunkSize }` → ส่ง `file_start` ให้ผู้รับ + ผู้ส่ง (`from` มาจาก server) | [file.js:105-117](server/features/file.js#L105-L117) |
| 6 | ผู้ส่งวนทีละชิ้น: `file.slice()` อ่านเฉพาะส่วน → `ArrayBuffer` → `emitWithAck("file_chunk", { id, seq, data })` → **รอ ack ก่อนชิ้นถัดไป** | [transfer.js:78-84](client/src/features/file/transfer.js#L78-L84) |
| 7 | **Server ตรวจทุกชิ้น**: เป็นของ socket นี้ (คนอื่นแทรกไม่ได้ `NO_TRANSFER`) / `seq` ต้องเรียง 0, 1, 2… (`BAD_SEQ`) / เป็น binary ≤ 64 KB และไม่เกินขนาดที่ประกาศ (`BAD_CHUNK`) | [file.js:72-76](server/features/file.js#L72-L76), [file.js:119-127](server/features/file.js#L119-L127) |
| 8 | ผ่าน → ส่งต่อ**เฉพาะผู้รับ** (private = อีกฝ่าย / group = `socket.to(room)` สมาชิกยกเว้นผู้ส่ง) → ack `{ received }` → progress ของผู้ส่ง | [file.js:128-132](server/features/file.js#L128-L132) → [file.js:33-36](server/features/file.js#L33-L36) |
| 9 | ครบ → `file_end` → server ตรวจว่าได้ครบทุก byte (`INCOMPLETE`) → แจ้งทุกคน | [transfer.js:87-88](client/src/features/file/transfer.js#L87-L88) → [file.js:135-143](server/features/file.js#L135-L143) |
| 10 | error / หมดเวลา → ผู้ส่ง `file_cancel` → server แจ้ง `file_abort` ให้ทุกคน | [transfer.js:89-91](client/src/features/file/transfer.js#L89-L91) → [file.js:145-148](server/features/file.js#L145-L148) |

**ลำดับการทำงาน: รับ (server → ผู้รับ)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | `file_start` → สร้างข้อความไฟล์ในห้อง (private: ห้องของอีกฝ่าย / group: ห้องกลุ่ม) สถานะ `receiving` (ผู้ส่ง: จับคู่ `ref` → ใช้ไฟล์ในเครื่องแสดงทันที สถานะ `sending`) | [transfer.js:18-31](client/src/features/file/transfer.js#L18-L31) |
| 2 | `file_chunk` → เก็บต่อท้าย (server รับประกันลำดับแล้ว) → อัปเดต progress | [transfer.js:34-40](client/src/features/file/transfer.js#L34-L40) → [App.jsx:54-59](client/src/App.jsx#L54-L59) |
| 3 | `file_end` → ต่อทุกชิ้นเป็น `Blob` → `URL.createObjectURL` → รูปตัวอย่าง (PNG / JPEG / GIF / WebP / BMP) + `[download]` | [transfer.js:42-53](client/src/features/file/transfer.js#L42-L53) → [FileMessage.jsx:5-36](client/src/features/file/FileMessage.jsx#L5-L36) |
| 4 | ชนิดไฟล์มาจากผู้ส่ง (เชื่อไม่ได้) → ไม่ใช่รูปที่ปลอดภัยใช้ `application/octet-stream` / **ไม่แสดง SVG** (เปิดแล้วรัน script ได้) | [transfer.js:50-51](client/src/features/file/transfer.js#L50-L51), [format.js:15-17](client/src/features/file/format.js#L15-L17) |
| 5 | `file_abort` (ผู้ส่งยกเลิก / หลุด / ผู้รับออฟไลน์ / เงียบเกิน 30 วินาที) → `✗ transfer failed: <เหตุผล>` | [transfer.js:55-61](client/src/features/file/transfer.js#L55-L61) ← [file.js:51-61](server/features/file.js#L51-L61), [file.js:151-159](server/features/file.js#L151-L159) |

**ทำไมออกแบบแบบนี้ (ใช้ตอบอาจารย์)**
- **แบ่งชิ้น (chunking)**: ส่งทั้งไฟล์ใน event เดียวจะติดเพดาน `maxHttpBufferSize` (1 MB) ของ Socket.IO, ต้องโหลดทั้งไฟล์เข้าหน่วยความจำ และไม่มี progress / ชิ้นละ 64 KB จึงส่งไฟล์ใหญ่ได้และเห็นความคืบหน้า
- **framing**: 1 ชิ้น = 1 event ที่มี `{ id, seq, data }` → ผู้รับรู้ว่าชิ้นนี้เป็นของไฟล์ไหน ลำดับที่เท่าไร / `data` ส่งเป็น **binary attachment** ของ Socket.IO (ไม่แปลง base64 ที่ทำให้ใหญ่ขึ้น 33%)
- **stop-and-wait (flow control)**: รอ ack ทีละชิ้น → ผู้ส่งไม่ยิงข้อมูลเร็วกว่าที่ server รับไหว และรู้ทันทีถ้าชิ้นไหนถูกปฏิเสธ (หลักเดียวกับ ACK ของ TCP แต่ทำที่ระดับ application) / แลกกับความเร็ว: แต่ละชิ้นต้องรอ 1 RTT
- **server ไม่เก็บไฟล์**: เป็นตัวส่งต่อ (relay) อย่างเดียว ไม่มี storage / database กลาง → ข้อมูลวิ่งผ่าน socket ล้วน (R2)
- **ตรวจที่ server ทุกชิ้น**: เจ้าของ / ลำดับ / ขนาด → client ปลอมชิ้น แทรกไฟล์คนอื่น หรือส่งเกินที่ประกาศไม่ได้ / ผู้รับใช้กฎเดียวกับแชท (R7, R11) **คนนอกไม่ได้รับแม้แต่ byte เดียว** (test ยืนยัน)
- **หลุดกลางทาง**: ทุกฝ่ายได้ `file_abort` ไม่มีไฟล์ค้างครึ่ง ๆ

**ข้อจำกัด**: ไฟล์ในกลุ่ม `#discord` ไม่ถูกส่งต่อไป Discord (bridge ส่งเฉพาะข้อความ) / คนที่ join กลุ่มระหว่างที่ไฟล์กำลังส่งจะไม่ได้ไฟล์นั้น

**Test:** [server/tests/features/f06-file.test.mjs](server/tests/features/f06-file.test.mjs) · `npm test -- f06`

---

## คู่มือเพิ่ม Feature ใหม่

1. **ออกแบบ** → ถ้ามี event ใหม่ ให้เพิ่มใน [docs/PROTOCOL.md](docs/PROTOCOL.md) ในหัวข้อ "Feature เสริม" (ตาราง + ตัวอย่าง + Changelog)
2. **Server** → สร้าง `server/features/<ชื่อ>.js`
   ```js
   export default {
     name: "<ชื่อ>",
     setupSocket(socket, { requireName, sendError, io, clients, groups, now }) {
       socket.on("<event>", (payload = {}) => {
         const me = requireName();
         if (!me) return;
         // ตรวจ input → sendError("CODE", "English message")
         // emit ให้ถูกคน: socket.emit / io.to(room).emit
       });
     },
   };
   ```
   แล้ว import มาใส่ใน `features` ที่ [server/features/index.js](server/features/index.js)
3. **Client** → สร้าง `client/src/features/<ชื่อ>/` แล้วต่อเข้า `App.jsx` / `ChatRoom.jsx` ให้น้อยที่สุด ทุกจุดมี comment `// Feature: <ชื่อ>`
4. **Test** → `server/tests/features/fXX-<ชื่อ>.test.mjs` (import จาก `../helpers.mjs`) อย่างน้อยต้องมี: กรณีสำเร็จ, กรณี error แต่ละ code, และ**คนที่ไม่ควรได้รับต้องไม่ได้รับ**
5. **รัน** `cd server && npm test` (ต้องผ่านทั้ง core และ feature) + `cd client && npm run build`
6. **เอกสาร** →
   - checklist: `docs/features/<ชื่อ>_TEST.md`
   - หลักฐาน: `docs/evidence/features/<ชื่อ>/` + แถวใน [docs/evidence/features/README.md](docs/evidence/features/README.md)
   - หัวข้อใน Handbook นี้ + อัปเดตตาราง "Feature ที่วางแผนไว้"
   - ตาราง Part 3 ใน [README.md](README.md) และ `PromptRecord.md`
