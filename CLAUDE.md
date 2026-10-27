# CLAUDE.md

Term project วิชา Computer Network: แอปแชท Client–Server ด้วย Socket Programming
โจทย์เต็ม: `Computer_Network_Term_Project_Socket_Programming.pdf` · สถานะ requirement: `README.md`

## ข้อบังคับจากโจทย์ (ห้ามละเมิด)

- โค้ด client กับ server ต้อง**แยกไฟล์**กัน (`client/` กับ `server/`)
- ข้อความแชทระหว่าง server กับ client ต้องส่ง**ผ่าน socket เท่านั้น** (R2) ห้ามใช้ REST/HTTP polling หรือ database กลางแทน
- ต้องรันข้ามคอมพิวเตอร์จริงได้ (client ≥ 2 ตัวบนคนละเครื่อง) ห้าม hardcode `localhost` ให้รับ host/port จาก argument หรือ config
- Private message ต้องเห็นได้แค่ผู้ส่งกับผู้รับ ส่วน group message ต้องเห็นได้แค่สมาชิก โดย**ตรวจสิทธิ์ที่ฝั่ง server**
- การเข้ากลุ่มต้องให้ผู้ใช้เข้าเอง ผู้สร้างกลุ่มดึงคนอื่นเข้าไม่ได้ (R10)
- Part 3 ต้องมีฟีเจอร์ AI อย่างน้อย 1 อย่าง

## Protocol

รูปแบบข้อความทั้งหมดอยู่ใน `docs/PROTOCOL.md` ถ้าจะเพิ่มหรือแก้ประเภทข้อความ ต้องอัปเดตเอกสารนี้ (รวมถึง Changelog) พร้อมกับโค้ด

## Stack และคำสั่ง

- Server: Node.js + Socket.IO 4.8 (ESM) — `server/index.js` เป็นไฟล์เดียว เก็บ state ใน memory
- Client: React 18 + Vite 5 + socket.io-client 4.8 — `client/src/`
- ทั้งสองฝั่งเป็น npm project แยกกัน ต้องรัน `npm install` ในแต่ละโฟลเดอร์

```bash
cd server && npm run dev     # server ที่ 0.0.0.0:3000 (restart อัตโนมัติ)
cd client && npm run dev     # client ที่ http://localhost:5173 (--host เปิดให้เครื่องอื่นเข้าได้)
cd client && npm run build   # เช็กว่า client build ผ่าน
```

ยังไม่มี test framework ถ้าจะทดสอบ server ให้เขียน script สั้น ๆ ด้วย `socket.io-client` แล้วจำลอง client หลายตัว

## แนวทางการเขียนโค้ด

- ทีมต้องอธิบายโค้ดให้อาจารย์ฟังได้ เขียนให้อ่านง่าย ตรงไปตรงมา และใส่ comment ตรงส่วนที่เกี่ยวกับ socket (bind, listen, accept, connect, send, recv, framing)
- ส่งข้อความแชทผ่าน Socket.IO event เท่านั้น ไม่เพิ่ม REST endpoint สำหรับส่งหรือดึงข้อความ
- ห้ามตั้งชื่อ event ซ้ำกับชื่อที่ Socket.IO สงวนไว้ (`connect`, `disconnect`, `connect_error` ฯลฯ) ให้ใช้ `error_msg` แทน `error`
- API key อ่านจาก `.env` เท่านั้น ห้าม hardcode

## บันทึก Prompt

หลังทำงานที่ผู้ใช้สั่งเสร็จแต่ละครั้ง ให้เพิ่ม entry ใหม่ไว้ท้าย `PromptRecord.md` ตาม template ในไฟล์นั้น
(ผู้ใช้ prompt อะไร, AI ทำอะไร, ไฟล์ที่แก้, requirement ที่เกี่ยวข้อง) ถ้าไม่รู้ชื่อผู้ใช้ให้ถามหนึ่งครั้ง
