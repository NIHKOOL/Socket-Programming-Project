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
- [คู่มือเพิ่ม Feature ใหม่](#คู่มือเพิ่ม-feature-ใหม่)

---

## 0. โครงสร้างและการแยก Feature ออกจาก core

```
server/
├── index.js                 core R1–R11 (เรียก feature ผ่าน 2 จุดเชื่อมเท่านั้น)
├── features/
│   ├── index.js             ทะเบียน feature: รวมทุก feature แล้วส่งต่อให้ core
│   └── <ชื่อ>.js             โค้ดฝั่ง server ของแต่ละ feature
└── tests/
    ├── r00…r11.test.mjs     test ของ core
    └── features/            test ของ feature (fXX-<ชื่อ>.test.mjs)
client/src/
├── (core)
└── features/<ชื่อ>/          โค้ดฝั่ง client ของแต่ละ feature (ดู client/src/features/README.md)
docs/features/               checklist ทดสอบของแต่ละ feature
docs/evidence/features/      หลักฐานของแต่ละ feature
```

### จุดเชื่อม core ↔ feature (ฝั่ง server)

core รู้จัก feature ผ่าน [server/features/index.js](server/features/index.js) ไฟล์เดียว เพิ่มหรือถอด feature จึงไม่ต้องแก้ core

| # | จุดเชื่อม | core เรียกตอนไหน | feature ใช้ทำอะไร | โค้ด |
|---|---|---|---|---|
| 1 | `handleHttp(req, res)` | ทุก HTTP request ที่ไม่ใช่ `/socket.io/` **ก่อน**ตอบ 404 | เสิร์ฟไฟล์หน้าเว็บ (Cloud) ถ้า return `true` ถือว่า feature ตอบไปแล้ว | core: [server/index.js:17](server/index.js#L17) → [features/index.js:21-23](server/features/index.js#L21-L23) |
| 2 | `setupSocket(socket, ctx)` | ทุกครั้งที่มี socket ใหม่ (หลังสร้าง `requireName`) | เพิ่ม `socket.on("<event ของ feature>")` | core: [server/index.js:108-110](server/index.js#L108-L110) → [features/index.js:26-28](server/features/index.js#L26-L28) |

**`ctx` ที่ feature ได้รับ** ([server/index.js:109](server/index.js#L109)) เป็นตัวเดียวกับที่ core ใช้:

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

**Test:** [server/tests/features/f00-feature-hooks.test.mjs](server/tests/features/f00-feature-hooks.test.mjs) ตรวจว่าจุดเชื่อมไม่ทำให้ core เปลี่ยนพฤติกรรม (path อื่นยัง 404, handshake ยังทำงาน, register ยังทำงาน)

---

## Feature ที่วางแผนไว้

| # | Feature | ชื่อใน code | สถานะ | หัวข้อ |
|---|---|---|---|---|
| 1 | Deploy บน Cloud | `cloud` | ✅ deploy แล้ว (รอเก็บหลักฐาน) | [Feature 1 — Cloud](#feature-1--cloud) |
| 2 | AI ผ่าน slash command (`/ai`, `/summarize`) **(AI บังคับ)** | `ai` | ⬜ | — |
| 3 | ส่งไฟล์/รูปผ่าน socket | `files` | ⬜ | — |
| 4 | `/ping` วัด latency + typing indicator | `ping` | ⬜ | — |

(อัปเดตตารางนี้และเพิ่มหัวข้อของแต่ละ feature เมื่อทำเสร็จ)

---

## Feature 1 — Cloud

> server ตัวเดียวเสิร์ฟทั้งหน้าเว็บและ Socket.IO → deploy บน Cloud (Render) แล้วใช้งานจากที่ไหนก็ได้ รวมถึงมือถือที่ใช้ 4G
> Checklist + ขั้นตอน deploy: [docs/features/cloud_TEST.md](docs/features/cloud_TEST.md)

**ไฟล์ที่เกี่ยวข้อง**

| ไฟล์ | หน้าที่ |
|---|---|
| [server/features/cloud.js](server/features/cloud.js) | เสิร์ฟไฟล์จาก `client/dist` + log IP จริงหลัง proxy |
| [client/src/socket.js:7-9](client/src/socket.js#L7-L9) | (แก้ core จุดเดียว) build แล้ว Server URL = URL เดียวกับหน้าเว็บ |
| [package.json](package.json) (root) | `npm run build` / `npm start` ให้ Cloud ใช้ (ติดตั้ง + build ทั้ง 2 ฝั่งในคำสั่งเดียว) |

**ลำดับการทำงาน: deploy (Render)**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Render รัน `npm run build` → ติดตั้ง dependency ของ server + client → `vite build` สร้าง `client/dist` | [package.json](package.json) |
| 2 | Render รัน `npm start` → `node server/index.js` โดยส่ง port มาทาง env `PORT` | [server/index.js:9](server/index.js#L9) |
| 3 | ตอนโหลด feature: ถ้ามี `client/dist/index.html` → ชื่อ feature = `cloud` (log `Features: cloud`) | [server/features/cloud.js:48](server/features/cloud.js#L48) |

**ลำดับการทำงาน: ผู้ใช้เปิด `https://<app>.onrender.com` บนมือถือ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Browser → reverse proxy ของ Render (HTTPS/TLS) → ส่งต่อเป็น HTTP ธรรมดาเข้า server พร้อม header `X-Forwarded-For` | — (ทำโดย Render) |
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
| **TLS** (HTTPS / WSS) | เข้ารหัสข้อมูลระหว่าง browser ↔ Render ข้อความแชทไม่ถูกอ่านระหว่างทาง (บน LAN เราใช้ `http://` / `ws://` ไม่เข้ารหัส) |
| **Reverse proxy** | Render รับ connection จาก internet แล้วส่งต่อให้ server ของเรา → server เห็น IP ของ proxy |
| **X-Forwarded-For** | header ที่ proxy ใส่ IP จริงของ client มาให้ |
| **DNS** | `<app>.onrender.com` → IP ของ Render (บน LAN เราใช้ IP ตรง ๆ ไม่ผ่าน DNS) |

**Test:** [server/tests/features/f01-cloud.test.mjs](server/tests/features/f01-cloud.test.mjs) · `npm test -- f01`

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
