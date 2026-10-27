# Handbook — แต่ละ Requirement ทำงานอย่างไร

คู่มือสำหรับคนในทีมที่จะมาอ่านหรือแก้โค้ดต่อ แต่ละ requirement ไล่**ลำดับการทำงานจริง**ตั้งแต่ผู้ใช้กดปุ่มจนถึงหน้าจออัปเดต และทุกขั้นมีลิงก์ไปที่บรรทัดของโค้ด

> **เลขบรรทัดตรงกับโค้ด ณ วันที่ 2026-10-28** (จบ Part 2) ถ้าแก้โค้ดแล้วบรรทัดเลื่อน ให้ค้นจากชื่อ event หรือชื่อฟังก์ชันในวงเล็บแทน เช่น ค้น `socket.on("join_group"`

เอกสารที่เกี่ยวข้อง: [README.md](README.md) (วิธีรัน + สถานะ) · [docs/PROTOCOL.md](docs/PROTOCOL.md) (event ทั้งหมด) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (โปรโตคอล What/Why/How) · [docs/evidence/README.md](docs/evidence/README.md) (หลักฐาน)

---

## สารบัญ

- [0. ภาพรวมก่อนอ่าน](#0-ภาพรวมก่อนอ่าน)
- [R1 — System architecture + เชื่อมต่อข้ามเครื่อง](#r1--system-architecture--เชื่อมต่อข้ามเครื่อง)
- [R2 — Socket programming only](#r2--socket-programming-only)
- [R3 — ชื่อไม่ซ้ำ](#r3--ชื่อไม่ซ้ำ)
- [R4 — รายชื่อออนไลน์](#r4--รายชื่อออนไลน์)
- [R5 — ห้องแชทแยกกัน](#r5--ห้องแชทแยกกัน)
- [R6 — Chat box + chat window](#r6--chat-box--chat-window)
- [R7 — Private message](#r7--private-message)
- [R8 — สร้างกลุ่ม](#r8--สร้างกลุ่ม)
- [R9 — รายชื่อกลุ่มทั้งหมด + สมาชิก](#r9--รายชื่อกลุ่มทั้งหมด--สมาชิก)
- [R10 — เข้ากลุ่มด้วยตัวเอง](#r10--เข้ากลุ่มด้วยตัวเอง)
- [R11 — Group message](#r11--group-message)
- [การหลุดการเชื่อมต่อ (ใช้ร่วมหลาย R)](#การหลุดการเชื่อมต่อ-ใช้ร่วมหลาย-r)
- [คู่มือแก้โค้ด: เพิ่ม event ใหม่](#คู่มือแก้โค้ด-เพิ่ม-event-ใหม่)
- [คำถามที่อาจารย์น่าจะถาม](#คำถามที่อาจารย์น่าจะถาม)

---

## 0. ภาพรวมก่อนอ่าน

### แผนภาพ

```
 Browser (เครื่อง A)                                     Server (Node.js)
┌──────────────────────────┐   WebSocket (TCP)    ┌─────────────────────────────┐
│ React: App.jsx            │ ════════════════════ │ index.js                     │
│  ├ socket.js  (เชื่อมต่อ)    │   emit / on events   │  ├ clients: name → socket     │
│  ├ rooms.js   (แยกห้อง)     │                      │  ├ groups:  name → Set(สมาชิก) │
│  └ ChatRoom.jsx (UI ห้อง)  │                      │  └ handler ของแต่ละ event      │
└──────────────────────────┘                      └─────────────────────────────┘
 Browser (เครื่อง B) ════════════════════════════════════════╝
```

### ไฟล์ไหนทำอะไร

| ไฟล์ | หน้าที่ | R ที่เกี่ยวข้อง |
|---|---|---|
| [server/index.js](server/index.js) | server ทั้งหมดในไฟล์เดียว: รับ event → ตรวจสิทธิ์ → ส่งต่อ | ทุกข้อ |
| [client/src/socket.js](client/src/socket.js) | สร้าง connection ไป server | R1, R2, R4 |
| [client/src/App.jsx](client/src/App.jsx) | state ทั้งหมดของ client + socket handlers + sidebar | ทุกข้อ |
| [client/src/rooms.js](client/src/rooms.js) | id ห้อง + ตัดสินว่าข้อความเข้าห้องไหน | R5 |
| [client/src/ChatRoom.jsx](client/src/ChatRoom.jsx) | UI ห้องแชท 1 ห้อง (หน้าต่างข้อความ + ช่องพิมพ์) | R6 |
| [server/tests/](server/tests/) | test อัตโนมัติ 1 ไฟล์ต่อ R (`cd server && npm test`) | ทุกข้อ |

### State ที่ต้องรู้

**Server** ([server/index.js:23-24](server/index.js#L23-L24)) เป็นแหล่งข้อมูลจริงเพียงแห่งเดียว
```js
clients: Map<name, socket>          // ใครออนไลน์ + socket ของเขา
groups:  Map<groupName, Set<name>>  // กลุ่มทั้งหมด + สมาชิก
socket.data.name                    // ชื่อที่ผูกกับ socket ตอน register (ใช้ระบุตัวตนทุก event)
```

**Client** ([client/src/App.jsx:8-22](client/src/App.jsx#L8-L22)) เป็นแค่สำเนาที่ server ส่งมา
```js
me, users, groups      // ได้จาก register_ok / user_list / group_list
messages               // { "dm:C2": [...], "group:g1": [...] } แยกตามห้อง
unread, activeRoom     // ตัวเลข unread ต่อห้อง + ห้องที่เปิดอยู่
```

### หลักการ 3 ข้อที่ใช้ทั้งระบบ

1. **Server เชื่อแค่ตัวตนจาก socket:** `from` ของข้อความ และใครที่ join กลุ่ม มาจาก `socket.data.name` เสมอ ไม่ได้มาจาก payload ที่ client ส่ง client จึงปลอมตัวเป็นคนอื่นไม่ได้ (R7, R10, R11)
2. **Server ตัดสินว่าใครได้รับอะไร:** ข้อความไม่เคยถูกส่งไปที่เครื่องของคนนอก ไม่ใช่ส่งไปทุกเครื่องแล้วให้ client ซ่อนเอง (R7, R11)
3. **Client ไม่แสดงข้อความเองตอนกดส่ง:** รอให้ server ส่งกลับมา (echo) ก่อนจึงแสดง สิ่งที่อยู่บนจอจึงตรงกับ server เสมอ (R6)

### `emit` 3 แบบที่ server ใช้

| คำสั่ง | ส่งถึงใคร | ใช้ใน |
|---|---|---|
| `socket.emit(...)` | socket เดียว | `register_ok`, `error_msg`, `*_ok`, R7 private message |
| `io.to(room).emit(...)` | ทุก socket ใน room | R4/R9 (room `registered`), R11 (room `group:<ชื่อ>`) |
| `io.emit(...)` | ทุก socket ที่เชื่อมต่อ | **ไม่ใช้** เพราะจะส่งถึงคนที่ยังไม่ register ด้วย |

---

## R1 — System architecture + เชื่อมต่อข้ามเครื่อง

> มี client ≥ 2 ตัว บนคอมคนละเครื่อง + อธิบายโปรโตคอล (what / why / how)

**ลำดับการทำงาน: เปิด server → client เชื่อมต่อจากอีกเครื่อง**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | สร้าง HTTP server สำหรับรับ handshake ครั้งแรก | [server/index.js:14-17](server/index.js#L14-L17) |
| 2 | ให้ Socket.IO ทำงานบน HTTP server นั้น และเปิด CORS เพราะหน้าเว็บอยู่คนละ origin | [server/index.js:18-20](server/index.js#L18-L20) |
| 3 | `listen(PORT, "0.0.0.0")` รับ connection จาก**ทุก** network interface ถ้าใช้ `127.0.0.1` จะรับได้แค่จากเครื่องตัวเอง | [server/index.js:184](server/index.js#L184) |
| 4 | พิมพ์ IP ของเครื่องออกมา ให้รู้ว่าเครื่องอื่นต้องใส่ URL อะไร | [server/index.js:186-192](server/index.js#L186-L192) |
| 5 | Client: URL เริ่มต้น = host ของหน้าเว็บ + port 3000 แก้ได้ที่หน้า login | [client/src/socket.js:5-6](client/src/socket.js#L5-L6) |
| 6 | ผู้ใช้กด "เข้าสู่ระบบ" → `connect(serverUrl)` | [client/src/App.jsx:54](client/src/App.jsx#L54) |
| 7 | `io(url, { transports: ["websocket"] })` เปิด TCP → HTTP GET + `Upgrade: websocket` → `101 Switching Protocols` | [client/src/socket.js:12](client/src/socket.js#L12) |
| 8 | Server: `io.on("connection")` ทำงาน และ log IP ของ client (ใช้ยืนยันว่ามาจากคนละเครื่อง) | [server/index.js:71-72](server/index.js#L71-L72) |
| 9 | ต่อไม่ได้ (IP ผิด หรือ firewall บล็อก) → ขึ้นข้อความแจ้งในหน้า login | [client/src/App.jsx:63](client/src/App.jsx#L63) |

**อ่านเพิ่ม:** ตารางโปรโตคอล What/Why/How → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · วิธีทดสอบ + firewall → [docs/R1_TEST.md](docs/R1_TEST.md)

---

## R2 — Socket programming only

> ข้อความแชทระหว่าง server กับ client ต้องส่งผ่าน socket เท่านั้น

**ลำดับการทำงาน: ข้อความ 1 ข้อความวิ่งผ่านระบบ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Client ส่งทุก action เป็น event ผ่าน `socketRef.current.emit(...)` | [client/src/App.jsx:94-99](client/src/App.jsx#L94-L99) |
| 2 | Server log ทุก event ที่เข้ามาผ่าน socket (`[recv] ...`) ใช้โชว์ตอน demo | [server/index.js:75-77](server/index.js#L75-L77) |
| 3 | Server ส่งกลับด้วย `emit` บน socket เดิม → client รับด้วย `socket.on(...)` | [client/src/App.jsx:80-89](client/src/App.jsx#L80-L89) |
| 4 | HTTP request อื่นที่ไม่ใช่ `/socket.io/` ได้ **404** ทั้งหมด จึงไม่มี REST API ให้ส่งหรือดึงข้อความ | [server/index.js:14-17](server/index.js#L14-L17) |

**รูปแบบ frame บน WebSocket:** `42["private_msg",{"to":"C2","text":"hi"}]` → `4` = Engine.IO MESSAGE, `2` = Socket.IO EVENT, ตามด้วย `[ชื่อ event, payload]` (ดูได้ใน DevTools → Network → WS → Messages)

**ทดสอบ:** [docs/R2_TEST.md](docs/R2_TEST.md)

---

## R3 — ชื่อไม่ซ้ำ

> client แต่ละตัวต้องมีชื่อไม่ซ้ำกัน

**ลำดับการทำงาน: login**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ผู้ใช้กรอกชื่อ (จำกัด 20 ตัวที่ฝั่ง client) แล้วกดเข้าสู่ระบบ | [client/src/App.jsx:127](client/src/App.jsx#L127) |
| 2 | เชื่อมต่อสำเร็จ → `emit("register", { name })` ทันที | [client/src/App.jsx:62](client/src/App.jsx#L62) |
| 3 | Server trim ชื่อ แล้วตรวจว่าว่างหรือยาวเกิน 20 → `INVALID_NAME` | [server/index.js:80-83](server/index.js#L80-L83) |
| 4 | socket นี้ register ไปแล้ว → `ALREADY_REGISTERED` | [server/index.js:84](server/index.js#L84) |
| 5 | **ชื่อซ้ำ** (เทียบแบบไม่สนตัวพิมพ์ `C1` = `c1`) → `NAME_TAKEN` | [server/index.js:85](server/index.js#L85) → [`isNameTaken` :35-38](server/index.js#L35-L38) |
| 6 | ผ่าน → ผูกชื่อกับ socket (`socket.data.name`), เพิ่มเข้า `clients`, join room `registered` | [server/index.js:88-90](server/index.js#L88-L90) |
| 7 | ส่ง `register_ok` ให้คนนี้ แล้ว broadcast รายชื่อ + กลุ่มให้ทุกคน | [server/index.js:91-93](server/index.js#L91-L93) |
| 8 | Client ได้ `register_ok` → ตั้ง `me` → React เปลี่ยนจากหน้า login เป็นหน้าแชท | [client/src/App.jsx:64-68](client/src/App.jsx#L64-L68) |
| 8′ | ถ้าได้ `error_msg` แทน → แสดง error และตัด connection ทิ้ง ผู้ใช้เปลี่ยนชื่อแล้วกดเข้าใหม่ได้เลย | [client/src/App.jsx:69-73](client/src/App.jsx#L69-L73) |
| 9 | ชื่อจะว่างอีกครั้งเมื่อเจ้าของ disconnect | [server/index.js:174](server/index.js#L174) |

**จุดสำคัญ:** ต้องตรวจที่ server เพราะ server เป็นที่เดียวที่รู้รายชื่อทุกคน ส่วน `maxLength` ฝั่ง client มีไว้ช่วยผู้ใช้เท่านั้น

**ทดสอบ:** [docs/R3_TEST.md](docs/R3_TEST.md) · `npm test -- r03`

---

## R4 — รายชื่อออนไลน์

> เห็นรายชื่อ client ที่ออนไลน์ทั้งหมด รวมชื่อตัวเอง

**ลำดับการทำงาน: มีคนเข้าหรือออก → ทุกจออัปเดต**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1a | มีคน register สำเร็จ → `broadcastUserList()` | [server/index.js:92](server/index.js#L92) |
| 1b | มีคน disconnect → ลบจาก `clients` → `broadcastUserList()` | [server/index.js:174-178](server/index.js#L174-L178) |
| 2 | ส่ง**รายชื่อทั้งหมด**ให้ทุกคนใน room `registered` (คนที่ยังไม่ login ไม่ได้รับ) | [server/index.js:60-62](server/index.js#L60-L62) |
| 3 | Client ได้ `user_list` → แทนที่ `users` เดิมทั้งก้อน | [client/src/App.jsx:80](client/src/App.jsx#L80) |
| 4 | Render: ชื่อตัวเองอยู่บนสุดพร้อม `(คุณ)` ที่เหลือเรียงตามตัวอักษร | [client/src/App.jsx:145-162](client/src/App.jsx#L145-L162) |

**จุดสำคัญ:** ส่งรายการทั้งหมดทุกครั้ง ไม่ส่งแค่ส่วนที่เปลี่ยน รายชื่อจึงไม่มีทางเพี้ยนสะสม และคนที่เพิ่งเข้าได้รายชื่อครบตั้งแต่ครั้งแรก

**ทดสอบ:** [docs/R4_TEST.md](docs/R4_TEST.md) · `npm test -- r04` · ดูหัวข้อ[การหลุดการเชื่อมต่อ](#การหลุดการเชื่อมต่อ-ใช้ร่วมหลาย-r)ด้วย

---

## R5 — ห้องแชทแยกกัน

> แชทแต่ละคู่ (private) และแต่ละกลุ่ม (group) มีห้องของตัวเอง

**ลำดับการทำงาน: ข้อความเข้ามา → ลงห้องที่ถูก**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ทุกห้องมี id ไม่ซ้ำกัน: `dm:<ชื่อคู่สนทนา>` / `group:<ชื่อกลุ่ม>` | [client/src/rooms.js:4-5](client/src/rooms.js#L4-L5) |
| 2 | ได้ `private_msg` → หาห้องด้วย `roomOfPrivateMsg` | [client/src/App.jsx:88](client/src/App.jsx#L88) |
| 3 | **กฎของห้อง private:** อยู่ห้องของ "อีกฝ่าย" เสมอ (เราส่งหา C2 หรือ C2 ส่งหาเรา → `dm:C2` ทั้งคู่) | [client/src/rooms.js:15-17](client/src/rooms.js#L15-L17) |
| 4 | ได้ `group_msg` → ห้อง `group:<msg.group>` | [client/src/App.jsx:89](client/src/App.jsx#L89) |
| 5 | `addMessage` เพิ่มลง `messages[roomId]` ถ้าห้องนี้ไม่ได้เปิดอยู่ unread +1 | [client/src/App.jsx:32-37](client/src/App.jsx#L32-L37) |
| 6 | ผู้ใช้คลิกชื่อหรือกลุ่ม → `openRoom` ตั้งห้องที่เปิด + ล้าง unread | [client/src/App.jsx:26-30](client/src/App.jsx#L26-L30) |

**จุดสำคัญ:** socket handler ถูกสร้างครั้งเดียวตอน login ถ้าอ่าน state `activeRoom` ตรง ๆ จะได้ค่าเก่าตลอด จึงต้องอ่านผ่าน `activeRoomRef` ([:22](client/src/App.jsx#L22)) และใช้ตัวแปร `myName` ในฟังก์ชัน login แทน state `me` ([:61](client/src/App.jsx#L61)) ด้วยเหตุผลเดียวกัน

**ทดสอบ:** [docs/R5_R6_TEST.md](docs/R5_R6_TEST.md) · `npm test -- r05` (test import `rooms.js` ตัวเดียวกับ client)

---

## R6 — Chat box + chat window

> ทุกห้องมีช่องพิมพ์ และหน้าต่างแสดงข้อความที่ส่งไปและข้อความที่เข้ามาใหม่

**ลำดับการทำงาน: พิมพ์ → ส่ง → ขึ้นจอ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | `renderRoom` เลือก props ตามประเภทห้อง แล้ว render `ChatRoom` (component เดียวใช้ทั้ง 2 ประเภท) | [client/src/App.jsx:216-247](client/src/App.jsx#L216-L247) |
| 2 | ผู้ใช้พิมพ์ + Enter → trim → `onSend(text)` → ล้างช่องพิมพ์ | [client/src/ChatRoom.jsx:16-22](client/src/ChatRoom.jsx#L16-L22) |
| 3 | `sendToActiveRoom` ดูประเภทห้อง → `emit("private_msg")` หรือ `emit("group_msg")` | [client/src/App.jsx:94-99](client/src/App.jsx#L94-L99) |
| 4 | **ยังไม่ขึ้นจอ** รอ server ส่งกลับ → `addMessage` (ดู R5 ขั้น 2-5) | [client/src/App.jsx:88-89](client/src/App.jsx#L88-L89) |
| 5 | Chat window: ข้อความตัวเองอยู่ขวา (`mine`) ของคนอื่นอยู่ซ้ายพร้อมชื่อ + เวลา | [client/src/ChatRoom.jsx:31-41](client/src/ChatRoom.jsx#L31-L41) |
| 6 | มีข้อความใหม่ → scroll ลงล่างสุดเอง | [client/src/ChatRoom.jsx:12-14](client/src/ChatRoom.jsx#L12-L14) |
| 7 | ห้องที่ส่งไม่ได้ (อีกฝ่ายออฟไลน์ / ไม่เป็นสมาชิกแล้ว) → ปิดช่องพิมพ์ + แสดงเหตุผล | [client/src/App.jsx:230](client/src/App.jsx#L230), [:244](client/src/App.jsx#L244) |

**ทดสอบ:** [docs/R5_R6_TEST.md](docs/R5_R6_TEST.md)

---

## R7 — Private message

> ส่งข้อความหาใครก็ได้ในรายชื่อ **เห็นแค่ผู้ส่งกับผู้รับ**

**ลำดับการทำงาน: C1 ส่งหา C2**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | C1 คลิก `C2` ในรายชื่อ → เปิดห้อง `dm:C2` (คลิกชื่อตัวเองไม่ได้) | [client/src/App.jsx:154-155](client/src/App.jsx#L154-L155) |
| 2 | พิมพ์ + ส่ง → `emit("private_msg", { to: "C2", text })` | [client/src/App.jsx:97](client/src/App.jsx#L97) |
| 3 | Server: register แล้วหรือยัง → `NOT_REGISTERED` | [server/index.js:106-107](server/index.js#L106-L107) → [`requireName` :97-103](server/index.js#L97-L103) |
| 4 | C2 ออนไลน์ไหม → `USER_NOT_FOUND` | [server/index.js:108-109](server/index.js#L108-L109) |
| 5 | ข้อความว่างหรือยาวเกิน 1000 → `INVALID_TEXT` | [server/index.js:110-111](server/index.js#L110-L111) → [`cleanText` :51-58](server/index.js#L51-L58) |
| 6 | สร้าง msg โดย **`from` มาจาก socket** ไม่ใช่จาก payload | [server/index.js:115](server/index.js#L115) |
| 7 | **ส่งตรงถึง socket ของ C2** + echo กลับให้ C1 (ไม่ใช่ broadcast) | [server/index.js:116-117](server/index.js#L116-L117) |
| 8 | C1 และ C2 ได้ `private_msg` → ลงห้อง `dm:C2` / `dm:C1` (ดู R5) | [client/src/App.jsx:88](client/src/App.jsx#L88) |

**จุดสำคัญ:** ข้อความไม่เคยถูกส่งไปที่ C3 เลย เปิด DevTools ของ C3 ก็จะไม่เห็น frame `private_msg`

**ทดสอบ:** [docs/R7_TEST.md](docs/R7_TEST.md) · `npm test -- r07` (มี test ว่าคนนอกได้รับ 0 frame และปลอม `from` ไม่ได้)

---

## R8 — สร้างกลุ่ม

> สร้างกลุ่มได้ (หลายกลุ่ม) ตอนสร้างมีสมาชิกแค่ผู้สร้าง

**ลำดับการทำงาน: C1 สร้าง g1**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | C1 กรอกชื่อกลุ่ม + กด "สร้าง" | [client/src/App.jsx:165-175](client/src/App.jsx#L165-L175) |
| 2 | `emit("create_group", { group })` | [client/src/App.jsx:102-109](client/src/App.jsx#L102-L109) |
| 3 | Server: trim ชื่อ แล้วตรวจว่าว่างหรือยาวเกิน 30 → `INVALID_GROUP` | [server/index.js:123-126](server/index.js#L123-L126) |
| 4 | ชื่อซ้ำ (ไม่สนตัวพิมพ์ รวมกลุ่มที่ไม่มีสมาชิกแล้ว) → `GROUP_EXISTS` | [server/index.js:127](server/index.js#L127) → [`isGroupTaken` :45-48](server/index.js#L45-L48) |
| 5 | **สร้างกลุ่มที่มีแค่ผู้สร้าง** `new Set([name])` | [server/index.js:130](server/index.js#L130) |
| 6 | socket ของ C1 join room `group:g1` (เตรียมรับข้อความ R11) | [server/index.js:131](server/index.js#L131) |
| 7 | broadcast `group_list` → ทุกคนเห็นกลุ่มใหม่ (R9) | [server/index.js:132](server/index.js#L132) |
| 8 | ส่ง `create_group_ok` ให้ C1 คนเดียว → client เปิดห้อง `# g1` อัตโนมัติ | [server/index.js:133](server/index.js#L133) → [client/src/App.jsx:83](client/src/App.jsx#L83) |

**การตัดสินใจของทีม:** กลุ่มที่สมาชิกออกหมดแล้ว**ไม่ถูกลบ** ยังแสดงว่า "ไม่มีสมาชิก" และคนอื่น join ได้ ([server/index.js:176](server/index.js#L176))

**ทดสอบ:** [docs/R8_TEST.md](docs/R8_TEST.md) · `npm test -- r08`

---

## R9 — รายชื่อกลุ่มทั้งหมด + สมาชิก

> เห็นกลุ่มทั้งหมดที่ใครก็ได้สร้าง พร้อมรายชื่อสมาชิก

**ลำดับการทำงาน: ข้อมูลกลุ่มเปลี่ยน → ทุกจออัปเดต**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | Server เรียก `broadcastGroupList()` ใน 4 จุด: register / create / join / disconnect | [:93](server/index.js#L93), [:132](server/index.js#L132), [:148](server/index.js#L148), [:179](server/index.js#L179) |
| 2 | ส่ง**ทุกกลุ่ม**พร้อมสมาชิก ไม่กรองตามผู้สร้างหรือตามสมาชิก | [server/index.js:66-69](server/index.js#L66-L69) |
| 3 | Client ได้ `group_list` → แทนที่ `groups` เดิมทั้งก้อน | [client/src/App.jsx:81](client/src/App.jsx#L81) |
| 4 | Render ทุกกลุ่ม: `<จำนวน> คน: <รายชื่อ>` ชื่อตัวเองมี `(คุณ)` ถ้ายังไม่เป็นสมาชิกขึ้น "ยังไม่ได้เป็นสมาชิก" | [client/src/App.jsx:178-206](client/src/App.jsx#L178-L206) |

**จุดสำคัญ:** R9 ให้ทุกคนเห็นว่า "มีกลุ่มอะไร และใครอยู่" ส่วน R11 ให้เฉพาะสมาชิกเห็น "ข้อความ" การกรองจึงเกิดตอนส่งข้อความเท่านั้น

**ทดสอบ:** [docs/R9_TEST.md](docs/R9_TEST.md) · `npm test -- r09`

---

## R10 — เข้ากลุ่มด้วยตัวเอง

> ผู้ใช้เลือกเข้ากลุ่มเอง ผู้สร้างดึงคนอื่นเข้าไม่ได้

**ลำดับการทำงาน: C2 กด "เข้าร่วม" g1**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | กลุ่มที่ยังไม่เป็นสมาชิก → แสดงปุ่ม "เข้าร่วม" (ห้องยังคลิกเข้าไม่ได้) | [client/src/App.jsx:186](client/src/App.jsx#L186), [:199-203](client/src/App.jsx#L199-L203) |
| 2 | `emit("join_group", { group })` ส่งแค่ชื่อกลุ่ม | [client/src/App.jsx:112-115](client/src/App.jsx#L112-L115) |
| 3 | Server: register แล้วหรือยัง / มีกลุ่มนี้ไหม (`GROUP_NOT_FOUND`) | [server/index.js:137-140](server/index.js#L137-L140) |
| 4 | เป็นสมาชิกอยู่แล้ว → `ALREADY_MEMBER` (ไม่ broadcast ซ้ำ) | [server/index.js:141](server/index.js#L141) |
| 5 | **เพิ่มชื่อจาก socket** (`name` ใน payload ถูกเมิน) | [server/index.js:146](server/index.js#L146) |
| 6 | socket ของ C2 join room `group:g1` เริ่มรับข้อความกลุ่มตั้งแต่ตอนนี้ (ไม่ได้ข้อความเก่า) | [server/index.js:147](server/index.js#L147) |
| 7 | broadcast `group_list` (R9) + ส่ง `join_group_ok` ให้ C2 → เปิดห้องอัตโนมัติ | [server/index.js:148-149](server/index.js#L148-L149) → [client/src/App.jsx:85](client/src/App.jsx#L85) |

**ทำไมผู้สร้างดึงคนอื่นเข้าไม่ได้ (3 ชั้น)**
1. `create_group` ไม่มีพารามิเตอร์ให้ใส่สมาชิกคนอื่น ([:130](server/index.js#L130))
2. `join_group` เพิ่มได้แค่เจ้าของ socket ที่ส่ง event ([:146](server/index.js#L146))
3. protocol ไม่มี event สำหรับเชิญหรือเพิ่มสมาชิก

**ทดสอบ:** [docs/R10_TEST.md](docs/R10_TEST.md) · `npm test -- r10` (มี test ว่าส่ง `name: "C3"` มาแล้ว C3 ไม่ถูกเพิ่ม)

---

## R11 — Group message

> ส่งข้อความในกลุ่มที่เข้าร่วม **เห็นเฉพาะสมาชิก**

**ลำดับการทำงาน: A (สมาชิก g1) ส่งข้อความ**

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | A เปิดห้อง `# g1` (เปิดได้เฉพาะกลุ่มที่เป็นสมาชิก) → พิมพ์ + ส่ง | [client/src/App.jsx:186](client/src/App.jsx#L186) |
| 2 | `emit("group_msg", { group: "g1", text })` | [client/src/App.jsx:98](client/src/App.jsx#L98) |
| 3 | Server: register แล้วหรือยัง / มีกลุ่มนี้ไหม | [server/index.js:153-156](server/index.js#L153-L156) |
| 4 | **ชั้นที่ 1 (ใครส่งได้):** A เป็นสมาชิกไหม → `NOT_A_MEMBER` | [server/index.js:157](server/index.js#L157) |
| 5 | ตรวจข้อความ → `INVALID_TEXT` | [server/index.js:158-159](server/index.js#L158-L159) |
| 6 | **ชั้นที่ 2 (ใครได้รับ):** `io.to("group:g1").emit(...)` ส่งเฉพาะ socket ใน room รวมผู้ส่งด้วย (echo) | [server/index.js:167](server/index.js#L167) |
| 7 | สมาชิกได้ `group_msg` → ลงห้อง `group:g1` (ดู R5) | [client/src/App.jsx:89](client/src/App.jsx#L89) |

**`members` Set กับ room ต้องตรงกันเสมอ**

| จังหวะ | `members` Set | Socket.IO room |
|---|---|---|
| create | เพิ่มผู้สร้าง [:130](server/index.js#L130) | join [:131](server/index.js#L131) |
| join | เพิ่มผู้ join [:146](server/index.js#L146) | join [:147](server/index.js#L147) |
| disconnect | ลบออกจากทุกกลุ่ม [:177](server/index.js#L177) | Socket.IO ถอด socket ออกจากทุก room ให้เอง |

ถ้าแก้โค้ดส่วนนี้ ต้องให้ทั้งสองที่เปลี่ยนพร้อมกันเสมอ ไม่อย่างนั้นคนที่ไม่ใช่สมาชิกอาจได้รับข้อความ

**ทดสอบ:** [docs/R11_TEST.md](docs/R11_TEST.md) · `npm test -- r11` (มี test ว่าคนใหม่ที่ใช้ชื่อเดิมของสมาชิกที่ออกไปแล้วไม่ได้สิทธิ์สมาชิก)

---

## การหลุดการเชื่อมต่อ (ใช้ร่วมหลาย R)

| # | เกิดอะไรขึ้น | โค้ด |
|---|---|---|
| 1 | ปิด tab → TCP ปิดทันที / เน็ตหลุด → รู้ได้จาก heartbeat (ประมาณ 45 วินาที) | — |
| 2 | Server: ลบออกจาก `clients` → ชื่อว่าง (R3) | [server/index.js:174](server/index.js#L174) |
| 3 | ลบออกจากทุกกลุ่ม แต่**ไม่ลบตัวกลุ่ม** (R8, R11) | [server/index.js:177](server/index.js#L177) |
| 4 | broadcast รายชื่อ + กลุ่มใหม่ (R4, R9) | [server/index.js:178-179](server/index.js#L178-L179) |
| 5 | Client: ปิด auto-reconnect (ถ้า reconnect อาจได้ `NAME_TAKEN` จนรายชื่อค้าง) | [client/src/socket.js:10-12](client/src/socket.js#L10-L12) |
| 6 | Client: หลุดหลัง login แล้ว → ล้างทุกอย่าง กลับหน้า login พร้อมข้อความแจ้ง | [client/src/App.jsx:74-79](client/src/App.jsx#L74-L79) → [`resetSession` :39-47](client/src/App.jsx#L39-L47) |

อ่านเพิ่ม: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) หัวข้อ "การหลุดการเชื่อมต่อ"

---

## คู่มือแก้โค้ด: เพิ่ม event ใหม่

ใช้ตอนทำ Part 3 เช่น เพิ่มฟีเจอร์ AI, ส่งไฟล์, typing indicator

1. **ออกแบบก่อน** → เพิ่ม event ใน [docs/PROTOCOL.md](docs/PROTOCOL.md) (ตาราง + ตัวอย่าง + Changelog) แล้วแจ้งทีม
2. **Server** → เพิ่ม `socket.on("ชื่อ_event", ...)` ใน `io.on("connection")` ([server/index.js:71](server/index.js#L71)) ตามลำดับนี้:
   - `requireName()` ก่อนเสมอ
   - ตรวจ input แล้วส่ง `sendError(socket, "CODE", "ข้อความ")` ถ้าไม่ผ่าน
   - ใช้ `socket.data.name` เป็นตัวตน **ห้ามเชื่อชื่อจาก payload**
   - เลือก emit ให้ถูก: คนเดียว → `socket.emit` / กลุ่ม → `io.to(room).emit` / ทุกคน → `io.to(REGISTERED).emit`
3. **Client** → เพิ่ม `socket.on(...)` ใน `handleLogin` ([client/src/App.jsx:80-89](client/src/App.jsx#L80-L89)) ถ้าต้องอ่าน state ใน handler ให้ใช้ ref (ดู R5)
4. **Test** → สร้าง `server/tests/rXX-ชื่อ.test.mjs` (copy โครงจากไฟล์ที่มีอยู่) อย่างน้อยต้องมี: กรณีสำเร็จ, กรณี error แต่ละ code, และ**คนที่ไม่ควรได้รับต้องไม่ได้รับ**
5. **รัน** `cd server && npm test` ต้องผ่านทุกไฟล์ + `cd client && npm run build` ต้องผ่าน
6. **เอกสาร** → README (สถานะ), checklist `docs/RXX_TEST.md`, Handbook นี้ (เพิ่มหัวข้อ + อัปเดตเลขบรรทัดที่เลื่อน), `PromptRecord.md`

---

## คำถามที่อาจารย์น่าจะถาม

| คำถาม | คำตอบสั้น | ดูที่ |
|---|---|---|
| ใช้โปรโตคอลอะไร ทำไม | TCP (ข้อมูลมาครบและเรียงลำดับ) → HTTP (handshake) → WebSocket (full-duplex, server push) → Socket.IO (event + room) | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| ทำไม listen `0.0.0.0` | ให้เครื่องอื่นในเครือข่ายเชื่อมต่อได้ | [R1](#r1--system-architecture--เชื่อมต่อข้ามเครื่อง) |
| พิสูจน์ได้ไหมว่าใช้ socket อย่างเดียว | REST ได้ 404 + DevTools เห็น frame `42[...]` + server log `[recv]` | [R2](#r2--socket-programming-only) |
| รู้ได้ยังไงว่าคนนอกไม่เห็น private/group message | server ส่งตรงถึง socket หรือ room ไม่ใช่ broadcast ดู WS frame ของคนนอกก็ไม่มี | [R7](#r7--private-message), [R11](#r11--group-message) |
| ปลอมตัวเป็นคนอื่นได้ไม่ได้ | ไม่ได้ เพราะ `from` มาจาก `socket.data.name` ที่ผูกตอน register | [หลักการข้อ 1](#หลักการ-3-ข้อที่ใช้ทั้งระบบ) |
| จัดการหลาย client พร้อมกันยังไง | Node.js event loop (single thread, non-blocking I/O) แต่ละ event เรียก handler ของ socket นั้น | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| เน็ตหลุดแล้วเป็นยังไง | heartbeat ตรวจพบ → server ลบชื่อ + broadcast → client กลับหน้า login | [การหลุดการเชื่อมต่อ](#การหลุดการเชื่อมต่อ-ใช้ร่วมหลาย-r) |
| ข้อมูลเก็บที่ไหน | memory ของ server อย่างเดียว restart แล้วหาย | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
