# System Architecture

เอกสารนี้ใช้เป็นวัตถุดิบสำหรับสไลด์ "Implementation Explanation" ในส่วน R1

## แผนภาพระบบ

```
                ┌───────────────────────────────┐
                │      Server (Node.js)         │
                │  Socket.IO  · port 3000       │
                │  - clients: name -> socket    │
                │  - groups:  name -> members   │
                │  - ตรวจสิทธิ์ + route ข้อความ     │
                └──────┬─────────────────┬──────┘
      WebSocket (TCP)  │                 │  WebSocket (TCP)
          ┌────────────┴───┐         ┌───┴────────────┐
          │ Client A       │         │ Client B       │
          │ React ใน browser │         │ React ใน browser │
          │ คอมเครื่องที่ 1     │         │ คอมเครื่องที่ 2     │
          └────────────────┘         └────────────────┘
```

> TODO: ระบุว่า Server รันที่ไหน (เครื่องเดียวกับ client / เครื่องที่ 3 / Cloud) พร้อม IP ที่ใช้ตอน demo

## โปรโตคอลที่ใช้ (What / Why / How)

| Layer | Protocol | ทำไมถึงเลือก | ใช้อย่างไรในโปรเจกต์ |
|---|---|---|---|
| Application | **Socket.IO** + event ที่เรากำหนดเอง (ดู [PROTOCOL.md](PROTOCOL.md)) | มีระบบ event, room และ broadcast ในตัว จึงทำแชทส่วนตัว/กลุ่มได้ตรงไปตรงมา มี heartbeat (ping/pong) ไว้ตรวจว่า connection หลุด (ปิด auto-reconnect ไว้ เหตุผลอยู่ในหัวข้อ "การหลุดการเชื่อมต่อ") | แต่ละ action เป็น event เช่น `private_msg`, `join_group` ส่วน group ใช้ room `group:<name>` |
| Application | **WebSocket** (RFC 6455) | full-duplex ผ่าน connection เดียวที่เปิดค้างไว้ server จึง push ข้อความใหม่หา client ได้ทันทีโดยไม่ต้อง polling | Socket.IO ส่งข้อมูลทุกอย่างผ่าน WebSocket (client ตั้ง `transports: ["websocket"]`) |
| Application | **HTTP/1.1** | ใช้เปิด connection ครั้งแรก WebSocket เริ่มด้วย HTTP request แบบ `Upgrade: websocket` | handshake ครั้งเดียวตอนเชื่อมต่อ จากนั้นสลับไปใช้ WebSocket ตลอด |
| Transport | **TCP** | ข้อความแชทต้องมาครบและเรียงลำดับถูกต้อง TCP รับประกันทั้งสองอย่าง ส่วน UDP ไม่รับประกัน | WebSocket ทำงานบน TCP connection เดียวต่อ client 1 ตัว |
| Network | **IPv4** | ใช้ระบุที่อยู่เครื่องในเครือข่าย | client เชื่อมต่อไปที่ `http://<server IP>:3000` |

## การจัดการหลาย Client พร้อมกัน

Node.js ใช้ **event loop** (single thread + non-blocking I/O) จึงไม่ต้องสร้าง thread แยกต่อ client
ทุกครั้งที่มีข้อมูลเข้ามาจาก socket ใด Socket.IO จะเรียก handler ของ event นั้น (`socket.on(...)`)
และเพราะทั้งหมดรันบน thread เดียว `clients` กับ `groups` จึงไม่มีปัญหา race condition

## ข้อมูลที่ Server เก็บ (in-memory)

```js
clients: Map<name, socket>       // R3 ชื่อไม่ซ้ำ, R4 รายชื่อออนไลน์
groups:  Map<groupName, Set<name>> // R8–R11
```

ข้อมูลอยู่ในหน่วยความจำอย่างเดียว ถ้า restart server ข้อมูลจะหายทั้งหมด

## การหลุดการเชื่อมต่อ

- **ปิด tab / ปิด browser:** TCP connection ปิดทันที server ได้ `disconnect` แล้วลบชื่อและ broadcast `user_list` ใหม่ภายในเสี้ยววินาที
- **เน็ตหลุดหรือสาย LAN หลุด:** ไม่มีใครส่ง TCP FIN ทั้งสองฝั่งจึงรู้ได้จาก heartbeat เท่านั้น ค่า default ของ Socket.IO คือ `pingInterval` 25 วินาที + `pingTimeout` 20 วินาที อาจใช้เวลาถึงประมาณ 45 วินาที
- **ทำไมปิด auto-reconnect:** ถ้า client reconnect ก่อนที่ server จะรู้ว่า connection เก่าหลุด การ register ชื่อเดิมจะได้ `NAME_TAKEN` แล้ว UI จะค้างอยู่ในสถานะที่รายชื่อผิด (R4) จึงเลือกให้กลับไปหน้า login พร้อมแจ้งผู้ใช้แทน ถ้าเข้าใหม่ทันทีแล้วชื่อยังไม่ว่าง ให้รอไม่เกินประมาณ 45 วินาที

## Deployment

รองรับ 2 แบบ ใช้โค้ดชุดเดียวกัน

| | LAN (Part 1–2) | Cloud (Feature เสริม: `cloud`) |
|---|---|---|
| รัน | `server: npm start` + `client: npm run dev` (2 process) | root: `npm run build` → `npm start` (process เดียว) |
| URL ของหน้าเว็บ | `http://<IP>:5173` (Vite) | `https://<app>.up.railway.app` (server เสิร์ฟเอง) |
| URL ของ socket | `ws://<IP>:3000` | `wss://<app>.up.railway.app` (URL เดียวกับหน้าเว็บ) |
| เข้ารหัส | ไม่มี | **TLS** ระหว่าง browser ↔ Railway |
| ใครต่อได้ | เครื่องใน Wi-Fi/LAN เดียวกัน | ทุกเครื่องที่มี internet (รวมมือถือ 4G/5G) |
| IP ที่ server เห็น | IP จริงของ client | IP ของ reverse proxy → IP จริงอ่านจาก `X-Forwarded-For` |

```
Cloud:  browser ──HTTPS/WSS (TLS)──> Railway edge proxy ──HTTP/WS──> node server/index.js
                                       (ใส่ X-Forwarded-For)            ├ GET /, /assets/* → client/dist
                                                                         └ /socket.io/      → Socket.IO
```

**โปรโตคอลที่เพิ่มเข้ามาเมื่อขึ้น Cloud**

| Layer | Protocol | ทำไม / ใช้อย่างไร |
|---|---|---|
| Application | **DNS** | แปลงชื่อ `<app>.up.railway.app` เป็น IP ของ Railway (บน LAN เราพิมพ์ IP ตรง ๆ) |
| Application/Transport | **TLS** (HTTPS, WSS) | เข้ารหัสข้อมูลระหว่างทาง ข้อความแชทที่วิ่งผ่าน internet ไม่ถูกอ่าน/แก้ระหว่างทาง Railway จัดการใบรับรองให้ |
| Application | **HTTP header `X-Forwarded-For`** | reverse proxy บอก IP จริงของ client ให้ server (ใช้ใน log) |

**Feature discord: server ของเราเป็น client ของบริการอื่น**

| Protocol | ใช้อย่างไร |
|---|---|
| **Discord Gateway** (WebSocket over TLS, `wss://gateway.discord.gg`) | bot เปิด connection ค้างไว้รับ event `MessageCreate` แบบ real-time ใช้หลักเดียวกับที่ client ของเราต่อ server ด้วย WebSocket |
| **Discord REST API** (HTTPS) | bot ส่งข้อความเข้า channel (`POST /channels/{id}/messages`) |
| **Bot token** (header `Authorization`) | ยืนยันตัวตนของ bot เก็บใน env ไม่ commit |

รายละเอียด: [HandbookFeatures.md → Feature 2](../HandbookFeatures.md#feature-2--discord-bridge)

รายละเอียดการทำงาน + ลิงก์โค้ด: [HandbookFeatures.md → Feature 1 — Cloud](../HandbookFeatures.md#feature-1--cloud) · ขั้นตอน deploy: [features/cloud_TEST.md](features/cloud_TEST.md)
