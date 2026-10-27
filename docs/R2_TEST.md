# R2 — Checklist พิสูจน์ว่าข้อความส่งผ่าน Socket เท่านั้น

> R2 (0.5): The chat messages between the server and each client must be implemented using Socket Programming only.

## วิธีที่ระบบทำตาม R2

| ด้าน | การออกแบบ | โค้ด |
|---|---|---|
| ส่งข้อความ | ทุก action เป็น Socket.IO event ส่งด้วย `socket.emit(...)` ผ่าน WebSocket | `client/src/App.jsx`, `server/index.js` |
| รับข้อความ | server **push** ข้อความหา client ผ่าน socket ทันที client ไม่ต้องถาม (no polling) | `target.emit`, `io.to(room).emit` |
| ไม่มี REST | HTTP request ทุก path ยกเว้น `/socket.io/` ตอบ `404` | `createServer((req, res) => 404)` |
| ไม่มี database กลาง | state อยู่ใน memory ของ server (`clients`, `groups`) และส่งต่อผ่าน socket อย่างเดียว | `server/index.js` |
| ตรวจสอบได้ | server log ทุก event ที่รับเข้ามาผ่าน socket (`[recv] ...`) | `socket.onAny(...)` |

## ทดสอบ 1: Server log

1. `cd server && npm start` แล้วเปิด client 2 ตัว login (บรรทัด `private_msg` จะขึ้นหลังจากส่งผ่าน Console ตามทดสอบ 2)
2. ดู terminal ของ server ต้องเห็นบรรทัดลักษณะนี้

```
[connect] ycK2mdKy5Knfq3_QAAAA from 192.168.1.57
[recv] ycK2mdKy5Knfq3_QAAAA -> register {"name":"C1"}
[recv] C1 -> private_msg {"to":"C2","text":"hi"}
```

- [ ] เก็บ screenshot: `docs/evidence/R2/R2-server-log.png`

## ทดสอบ 2: ดู WebSocket frame ใน browser (หลักฐานที่ชัดที่สุด)

1. เปิด client 2 ตัว (C1, C2) ใน Chrome/Edge ที่หน้าของ C1 กด `F12` → แท็บ **Network** → กดตัวกรอง **WS** (หรือ Socket ใน Edge)
2. Refresh หน้าแล้ว login เป็น C1 จากนั้น login C2 ในอีก tab หรืออีกเครื่อง
3. คลิก request `?EIO=4&transport=websocket` → แท็บ **Messages**
4. จะเห็น frame ที่ส่ง (↑ สีเขียว) และรับ (↓ สีแดง) เช่น

```
↑ 42["register",{"name":"C1"}]
↓ 42["register_ok",{"name":"C1"}]
↓ 42["user_list",{"users":["C1","C2"]}]
```

### ส่ง private message ก่อนมี UI (R7 ยังไม่ได้ทำ)

ตอนนี้ UI ส่งได้แค่ `register` ส่วน event อื่นให้ส่งเองผ่าน DevTools **Console** ได้
(ใช้ได้เฉพาะ `npm run dev` เพราะ `window.socket` เปิดไว้ใน dev mode เท่านั้น)

```js
// พิมพ์ใน Console ของ C1
socket.emit("private_msg", { to: "C2", text: "hi from console" })
```

ผลที่ต้องเห็น:
- แท็บ Messages ของ C1: `↑ 42["private_msg",{"to":"C2","text":"hi from console"}]` และ `↓ 42["private_msg",{"from":"C1",...}]` (server echo กลับมาให้ผู้ส่ง)
- แท็บ Messages ของ C2: `↓ 42["private_msg",{"from":"C1","to":"C2",...}]`
- terminal ของ server: `[recv] C1 -> private_msg {"to":"C2","text":"hi from console"}`

หน้าจอยังไม่แสดงข้อความ เพราะ UI ห้องแชทจะทำใน R5–R7 แต่ R2 ดูแค่ว่าข้อความวิ่งผ่าน socket ซึ่งพิสูจน์ได้จาก frame แล้ว

ความหมายของตัวเลขนำหน้า (Socket.IO packet format):
- `4` = Engine.IO packet type **MESSAGE**
- `2` = Socket.IO packet type **EVENT**
- ตามด้วย JSON array `[ชื่อ event, payload]`
- frame `2` / `3` ที่ส่งเป็นระยะคือ **ping / pong** (heartbeat เช็กว่า connection ยังอยู่)

ในแท็บ Headers ของ request เดียวกันจะเห็น `Status Code: 101 Switching Protocols` และ `Upgrade: websocket` ซึ่งเป็นหลักฐานการ upgrade จาก HTTP เป็น WebSocket

- [ ] เก็บ screenshot แท็บ Messages: `docs/evidence/R2/R2-ws-frames.png`
- [ ] เก็บ screenshot แท็บ Headers (101): `docs/evidence/R2/R2-ws-upgrade.png`
- [ ] แท็บ Network แบบ **Fetch/XHR** ต้อง**ว่าง** ระหว่างแชท แปลว่าไม่มี REST call

## ทดสอบ 3: ไม่มี REST endpoint

เปิด browser ไปที่ `http://<server IP>:3000/messages` (หรือ path อะไรก็ได้)
→ ต้องขึ้น `This server only accepts Socket.IO connections.` (HTTP 404)

- [ ] เก็บ screenshot: `docs/evidence/R2/R2-no-rest.png`

## (เสริม) Wireshark

ถ้าอยากโชว์ระดับ packet: capture interface ที่ต่อ LAN แล้วใช้ filter `tcp.port == 3000`
จะเห็น TCP 3-way handshake (SYN, SYN-ACK, ACK) → HTTP `GET /socket.io/?...transport=websocket` + `Upgrade` → `101` → WebSocket frames
(ต้องจับข้ามเครื่องจริง เพราะ localhost ต้องใช้ adapter loopback แยกต่างหาก)
