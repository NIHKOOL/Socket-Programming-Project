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
| Application | **Socket.IO** + event ที่เรากำหนดเอง (ดู [PROTOCOL.md](PROTOCOL.md)) | มีระบบ event, room และ broadcast ในตัว จึงทำแชทส่วนตัว/กลุ่มได้ตรงไปตรงมา และ reconnect อัตโนมัติเมื่อเน็ตหลุด | แต่ละ action เป็น event เช่น `private_msg`, `join_group` ส่วน group ใช้ room `group:<name>` |
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

## Deployment

> TODO: ระบุว่ารันบน LAN หรือ Cloud (ถ้า deploy บน Cloud ได้ special point 1 ข้อ)
