# R7 — Checklist Private message

> R7 (1.0): Each client can send a direct text message to any client in the list. **Only the sender and receiver can see the messages.**

## การทำงาน

```
C1 ──emit("private_msg", {to:"C2", text})──> server
                                               1. register แล้วหรือยัง?        → NOT_REGISTERED
                                               2. C2 ออนไลน์อยู่ไหม?           → USER_NOT_FOUND
                                               3. ข้อความว่างหรือยาวเกิน 1000?   → INVALID_TEXT
                                               4. สร้าง msg {from: C1 (server กำหนดเอง), to, text, timestamp}
C2 <──────── target.emit("private_msg", msg) ──┤  ส่งตรงถึง socket ของ C2
C1 <──────── socket.emit("private_msg", msg) ──┘  echo กลับให้ผู้ส่ง
C3 ✗ ไม่ได้รับอะไรเลย (ไม่ใช่การ broadcast)
```

ความเป็นส่วนตัวมาจากการที่ **server ส่งตรงถึง socket 2 ตัวนี้เท่านั้น** ข้อความไม่เคยไปถึงเครื่องอื่นเลย ไม่ใช่ส่งไปทุกเครื่องแล้วให้ client ซ่อนเอง

## ทดสอบด้วยมือ

restart server + refresh client แล้ว login `C1`, `C2`, `C3`
ที่ C3 เปิด DevTools → Network → WS → Messages ค้างไว้**ก่อน**เริ่มส่ง

- [ ] C1 คลิก `C2` แล้วส่ง `secret from C1` → ขึ้นในห้อง C2 ของ C1
- [ ] C2 เห็น unread ที่ `C1` → เปิดแล้วเห็นข้อความ และตอบ `secret from C2`
- [ ] **C3:** sidebar ไม่มี unread ที่ไหนเลย และห้อง C1 / C2 ว่าง
- [ ] **C3 แท็บ Messages:** ไม่มี frame `private_msg` เลย มีแค่ ping/pong (`2`/`3`) หรือ `user_list`
- [ ] C1 ส่งหา C3 → C3 ได้รับ แต่ไม่เห็นบทสนทนา C1↔C2
- [ ] C2 ปิด tab → ห้อง C2 ของ C1 ขึ้น "ออฟไลน์" ช่องพิมพ์ถูกปิด
- [ ] (Console C1) `socket.emit("private_msg", { to: "C2", text: "   " })` → ขึ้น error "ข้อความต้องยาว 1–1000 ตัวอักษร"

เก็บ screenshot ไว้ที่ `docs/evidence/R7/`:
- ~~`R7-sender-receiver.png`~~: ใช้ `evidence/R5_R6/R6-private-room.png` แทน
- ~~`R7-server-log.png`~~: ใช้ `evidence/R2/R2-server-recv-private-msg.png` แทน
- [x] `R7-outsider-c3.png`: หน้าจอ C3 ที่ไม่มีข้อความ C1↔C2
- [x] `R7-server-log.png`: ยืนยันว่า C3 ออนไลน์อยู่ตอนที่ C1↔C2 คุยกัน
- [ ] `R7-outsider-ws-frames.png`: แท็บ Messages ของ C3 ไม่มี frame `private_msg` ของ C1↔C2 _(แนะนำ ไม่บังคับ)_

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- r07`

ผ่าน 13/13: ผู้รับได้ 1 ครั้ง, ผู้ส่งได้ echo 1 ครั้ง, from/to/timestamp ถูกต้อง,
**คนนอก (C3) และ socket ที่ยังไม่ register ไม่ได้รับ frame ใดเลย**, ปลอม `from` ไม่ได้ (server ใช้ชื่อจริงของผู้ส่ง),
ข้อความว่าง / เว้นวรรคล้วน / ยาวเกิน / ไม่มี text → `INVALID_TEXT` และไม่ส่งต่อ, trim ข้อความ,
1000 ตัวอักษร / ภาษาไทย / emoji / ขึ้นบรรทัดใหม่ส่งได้, ส่งถึงคนที่ไม่ออนไลน์ → `USER_NOT_FOUND`,
ยังไม่ register → `NOT_REGISTERED`, ส่งหาตัวเองได้ 1 ครั้ง (ไม่ซ้ำ)
