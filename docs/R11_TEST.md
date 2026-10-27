# R11 — Checklist Group message

> R11 (1.0): Each client can send a text message to the group that they joined. **Only the members of the chat group can see the messages.**

## การทำงาน

```
A (สมาชิก g1) ──emit("group_msg", {group:"g1", text})──> server
                                                          1. register แล้วหรือยัง?          → NOT_REGISTERED
                                                          2. มีกลุ่มนี้ไหม?                   → GROUP_NOT_FOUND
                                                          3. ชั้นที่ 1: A เป็นสมาชิกไหม?       → NOT_A_MEMBER
                                                          4. ข้อความว่างหรือยาวเกิน 1000?      → INVALID_TEXT
                                                          5. ชั้นที่ 2: io.to("group:g1").emit(...)
A, B (สมาชิกทุกคนใน room)  <──── group_msg {group, from: A (server กำหนดเอง), text, timestamp}
C (ไม่ใช่สมาชิก)           ✗ ไม่ได้รับ frame ใดเลย
```

**การตรวจ 2 ชั้นต้องตรงกันเสมอ**

| จังหวะ | `members` Set (ใครส่งได้) | Socket.IO room (ใครได้รับ) |
|---|---|---|
| `create_group` | เพิ่มผู้สร้าง | `socket.join("group:g1")` |
| `join_group` | เพิ่มผู้ join | `socket.join("group:g1")` |
| disconnect | ลบออกจากทุกกลุ่ม | Socket.IO ถอด socket ออกจากทุก room ให้เอง |

ถ้ามีคนใหม่ login ด้วยชื่อเดิมของสมาชิกที่ออกไปแล้ว คนนั้นจะ**ไม่ได้**สิทธิ์สมาชิกเดิมกลับมา

## ทดสอบด้วยมือ

restart server + refresh client แล้ว login `C1`, `C2`, `C3`
ที่ C3 เปิด DevTools → Network → WS → Messages ค้างไว้**ก่อน**เริ่มส่ง

- [ ] C1 สร้าง `g1` → C2 กด "[join]" (C3 **ไม่ต้อง**เข้า)
- [ ] C1 ส่ง `hello g1` → ขึ้นในห้อง `#g1` ของ C1 (ชื่อสีเขียว)
- [ ] C2 เห็น unread ที่ g1 → เปิดแล้วเห็น `hello g1` พร้อมชื่อ `C1`
- [ ] C2 ตอบ `hi from C2` → C1 เห็นในห้อง g1
- [ ] **C3:** g1 ไม่มี unread และคลิกเข้าห้องไม่ได้ (ยังไม่เป็นสมาชิก)
- [ ] **C3 แท็บ Messages:** ไม่มี frame `group_msg` เลย มีแค่ `group_list` / ping-pong
- [ ] (Console C3) `socket.emit("group_msg", { group: "g1", text: "intruder" })` → ขึ้น "You are not a member of this group" และ C1, C2 ไม่ได้รับ
- [ ] C3 กด "[join]" → C1 ส่งข้อความใหม่ → C3 ได้รับ (แต่ไม่เห็นข้อความเก่า)

เก็บ screenshot ไว้ที่ `docs/evidence/R11/`:
- `R11-members-chat.png`: C1 กับ C2 เทียบกัน เห็นบทสนทนากลุ่มเดียวกัน
- `R11-outsider-c3.png`: หน้าจอ C3 ที่ไม่มีข้อความ / unread ของ g1
- `R11-outsider-ws-frames.png`: แท็บ Messages ของ C3 ไม่มี frame `group_msg` (หลักฐานที่ชัดที่สุด)
- `R11-not-a-member.png`: C3 ส่งผ่าน Console แล้วถูกปฏิเสธ
- `R11-server-log.png`: `[recv] C1 -> group_msg ...` และการถูกปฏิเสธของ C3

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- r11`

ผ่าน 17/17: สมาชิกได้รับข้อความ 1 ครั้ง, ผู้ส่งได้ echo 1 ครั้ง, group/from/timestamp กำหนดโดย server,
**คนที่ไม่ใช่สมาชิก / สมาชิกของกลุ่มอื่น / socket ที่ยังไม่ register ไม่ได้รับ frame ใดเลย**,
คนที่ไม่ใช่สมาชิกส่งได้ `NOT_A_MEMBER` และไม่มีใครได้รับ, ปลอม `from` ไม่ได้, ข้อความแต่ละกลุ่มไม่ปนกัน,
ข้อความว่างหรือยาวเกิน → `INVALID_TEXT`, กลุ่มที่ไม่มีอยู่ → `GROUP_NOT_FOUND`, ยังไม่ register → `NOT_REGISTERED`,
**คนใหม่ที่ใช้ชื่อเดิมของสมาชิกที่ออกไปแล้ว ไม่ได้รับข้อความและส่งไม่ได้** (members กับ room ตรงกัน), join แล้วได้รับข้อความใหม่
