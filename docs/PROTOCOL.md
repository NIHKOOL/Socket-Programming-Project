# Application Protocol

เอกสารนี้กำหนดรูปแบบข้อความที่ Client กับ Server ส่งหากัน ทั้งสองฝั่งต้องยึดตามนี้
**ถ้าจะเพิ่มหรือแก้ event ให้แก้เอกสารนี้ก่อน แล้วค่อยแก้โค้ด**

## รูปแบบทั่วไป

- ใช้ **Socket.IO events**: ทุกข้อความประกอบด้วย **ชื่อ event** + **payload ที่เป็น JSON object**
  - ฝั่งส่ง: `socket.emit("private_msg", { to: "bob", text: "hi" })`
  - ฝั่งรับ: `socket.on("private_msg", (payload) => { ... })`
- Encoding: UTF-8 (รองรับภาษาไทย)
- **Framing:** ไม่ต้องทำเอง WebSocket แบ่งข้อมูลเป็น frame ให้ และ Socket.IO จัดการ encode/decode JSON ให้
- ห้ามตั้งชื่อ event ซ้ำกับชื่อที่ Socket.IO สงวนไว้: `connect`, `connect_error`, `disconnect`, `disconnecting`, `newListener`, `removeListener`
  (นี่คือเหตุผลที่ใช้ชื่อ `error_msg` แทน `error`)

## Client → Server

| event | payload | ความหมาย | Req |
|---|---|---|---|
| `register` | `name` | ลงทะเบียนชื่อหลังเชื่อมต่อ | R3 |
| `private_msg` | `to`, `text` | ส่งข้อความส่วนตัว | R7 |
| `create_group` | `group` | สร้างกลุ่มใหม่ (ผู้สร้างเป็นสมาชิกคนแรก) | R8 |
| `join_group` | `group` | ขอเข้ากลุ่มด้วยตัวเอง | R10 |
| `group_msg` | `group`, `text` | ส่งข้อความในกลุ่ม | R11 |

```js
socket.emit("register", { name: "alice" })
socket.emit("private_msg", { to: "bob", text: "สวัสดี" })
socket.emit("create_group", { group: "net-project" })
socket.emit("join_group", { group: "net-project" })
socket.emit("group_msg", { group: "net-project", text: "hello all" })
```

## Server → Client

| event | payload | ความหมาย | Req |
|---|---|---|---|
| `register_ok` | `name` | ลงทะเบียนสำเร็จ | R3 |
| `create_group_ok` | `group` | สร้างกลุ่มสำเร็จ ส่งให้**ผู้สร้างเท่านั้น** (client ใช้เปิดห้องกลุ่มทันที) | R8 |
| `error_msg` | `code`, `message` | เกิดข้อผิดพลาด (ดูตาราง error) | — |
| `user_list` | `users` | รายชื่อ client ที่ออนไลน์ทั้งหมด ส่งให้ทุกคนทุกครั้งที่มีคนเข้า/ออก | R4 |
| `group_list` | `groups` | รายชื่อกลุ่มทั้งหมด + สมาชิก ส่งให้ทุกคนเมื่อมีการสร้างกลุ่ม คนเข้ากลุ่ม หรือคนออฟไลน์ | R9 |
| `private_msg` | `from`, `to`, `text`, `timestamp` | ข้อความส่วนตัว ส่งให้**ผู้รับและผู้ส่งเท่านั้น** | R7 |
| `group_msg` | `group`, `from`, `text`, `timestamp` | ข้อความกลุ่ม ส่งให้**สมาชิกกลุ่มเท่านั้น** | R11 |

```js
// event name → payload
"register_ok" → {"name": "alice"}
"create_group_ok" → {"group": "net-project"}
"error_msg"   → {"code": "NAME_TAKEN", "message": "ชื่อนี้ถูกใช้แล้ว"}
"user_list"   → {"users": ["alice", "bob", "carol"]}
"group_list"  → {"groups": [{"name": "net-project", "members": ["alice", "bob"]}]}
"private_msg" → {"from": "alice", "to": "bob", "text": "สวัสดี", "timestamp": "2026-10-27T15:40:00.000Z"}
"group_msg"   → {"group": "net-project", "from": "alice", "text": "hello all", "timestamp": "2026-10-27T15:41:00.000Z"}
```

## Error codes

| code | เกิดเมื่อ |
|---|---|
| `INVALID_NAME` | register ด้วยชื่อว่าง (หลัง trim) หรือยาวเกิน 20 ตัวอักษร |
| `ALREADY_REGISTERED` | register ซ้ำบน connection เดิม |
| `NAME_TAKEN` | ชื่อที่ register ซ้ำกับคนที่ออนไลน์อยู่ โดย**ไม่สนตัวพิมพ์เล็ก/ใหญ่** (`C1` = `c1`) (R3) |
| `NOT_REGISTERED` | ส่งคำสั่งอื่นก่อน register |
| `USER_NOT_FOUND` | ส่ง private message ถึงคนที่ไม่ได้ออนไลน์ |
| `INVALID_TEXT` | ข้อความ (private/group) ว่างหลัง trim หรือยาวเกิน 1000 ตัวอักษร |
| `INVALID_GROUP` | สร้างกลุ่มด้วยชื่อว่าง (หลัง trim) หรือยาวเกิน 30 ตัวอักษร |
| `GROUP_EXISTS` | สร้างกลุ่มด้วยชื่อที่มีอยู่แล้ว โดย**ไม่สนตัวพิมพ์เล็ก/ใหญ่** (รวมกลุ่มที่ไม่มีสมาชิกเหลือแล้ว) |
| `GROUP_NOT_FOUND` | join หรือส่งข้อความถึงกลุ่มที่ไม่มีอยู่ |
| `NOT_A_MEMBER` | ส่งข้อความในกลุ่มที่ตัวเองยังไม่ได้เข้า (R11) |

## Flow ตัวอย่าง

```
Client(alice)                Server                  Client(bob)
     |== WebSocket connect ====>|<=== WebSocket connect ===|
     |--- register alice ------>|                          |
     |<-- register_ok ----------|                          |
     |<-- user_list [alice,bob]-|-- user_list [alice,bob]->|
     |--- private_msg to bob -->|                          |
     |<-- private_msg (echo) ---|-- private_msg ---------->|
     |--- create_group g1 ----->|                          |
     |<-- group_list -----------|-- group_list ----------->|
     |<-- create_group_ok ------|                          |
     |                          |<-- join_group g1 --------|
     |<-- group_list -----------|-- group_list ----------->|
     |--- group_msg g1 -------->|                          |
     |<-- group_msg ------------|-- group_msg ------------>|
```

## กฎฝั่ง Server

- Server เป็นผู้กำหนด `from` และ `timestamp` เอง ห้ามเชื่อค่าที่ client ส่งมา
- ชื่อผู้ใช้ (R3): trim ช่องว่างหัวท้าย, ยาว 1–20 ตัวอักษร, ห้ามซ้ำแบบไม่สนตัวพิมพ์ ชื่อจะว่างให้คนอื่นใช้อีกครั้งเมื่อเจ้าของ disconnect
- `user_list` / `group_list` broadcast ไปเฉพาะ socket ที่ register สำเร็จแล้ว (room `registered`)
- Client: ถ้าได้ `error_msg` ก่อน `register_ok` ให้ disconnect แล้วให้ผู้ใช้กรอกชื่อใหม่
- `user_list` (R4) ส่งรายชื่อ**ทั้งหมด**ทุกครั้ง ไม่ส่งแค่ส่วนที่เปลี่ยน client จึงแทนที่ state เดิมได้เลย คนที่เพิ่งเข้าก็ได้รายชื่อครบตั้งแต่ครั้งแรก
- Client ปิด auto-reconnect เมื่อ `disconnect` หลัง register แล้ว ให้ล้างรายชื่อและกลับหน้า login (ดู ARCHITECTURE.md)
- ตรวจสิทธิ์ก่อนส่งต่อข้อความทุกครั้ง (private → เฉพาะ 2 คน, group → เฉพาะสมาชิก)
- Group message ส่งผ่าน Socket.IO room ชื่อ `group:<ชื่อกลุ่ม>` socket จะถูก join เข้า room ตอน `create_group` / `join_group` เท่านั้น
- เมื่อ client หลุดการเชื่อมต่อ ให้ลบออกจากรายชื่อออนไลน์และจากทุกกลุ่ม แล้ว broadcast `user_list` กับ `group_list` ใหม่
- กลุ่ม (R8): ชื่อ trim, ยาว 1–30 ตัวอักษร, ห้ามซ้ำแบบไม่สนตัวพิมพ์ ผู้สร้างเป็นสมาชิกคนแรกและคนเดียว
- **กลุ่มไม่ถูกลบ** แม้สมาชิกจะออกหมดแล้วก็ตาม (`members: []`) กลุ่มยังอยู่ใน `group_list` ให้คนอื่น join ได้ และชื่อกลุ่มยังถือว่าถูกใช้อยู่

## Changelog

| วันที่ | ผู้แก้ | การเปลี่ยนแปลง |
|---|---|---|
| 2026-10-27 | — | ร่างแรก |
| 2026-10-27 | — | เปลี่ยนเป็น Socket.IO events, `error` → `error_msg`, เพิ่ม error code `INVALID_NAME`, `ALREADY_REGISTERED`, `INVALID_GROUP` |
| 2026-10-27 | — | R3: ชื่อห้ามซ้ำแบบไม่สนตัวพิมพ์, จำกัด 20 ตัวอักษร, broadcast เฉพาะคนที่ register แล้ว |
| 2026-10-27 | — | R7: ข้อความ trim + จำกัด 1–1000 ตัวอักษร เพิ่ม error `INVALID_TEXT` (ใช้กับ `group_msg` ด้วย) |
| 2026-10-27 | — | R8: เพิ่ม event `create_group_ok`, ชื่อกลุ่มจำกัด 30 ตัวอักษร + ห้ามซ้ำแบบไม่สนตัวพิมพ์, กลุ่มที่ไม่มีสมาชิกยังไม่ถูกลบ |
