# R10 — Checklist เข้ากลุ่มด้วยตัวเอง

> R10 (1.0): Clients can choose to join a group chat only by themselves; they are not added automatically by the group creator.

## การทำงาน

```
C2 เห็น g1 ใน sidebar ("not a member") → กด "[join]"
  └─ emit("join_group", {group:"g1"}) ──> server
                                            1. register แล้วหรือยัง?    → NOT_REGISTERED
                                            2. มีกลุ่มนี้ไหม?             → GROUP_NOT_FOUND
                                            3. เป็นสมาชิกอยู่แล้ว?        → ALREADY_MEMBER
                                            4. members.add(ชื่อของ socket นี้)  ← ไม่ใช้ชื่อจาก payload
                                            5. socket ของ C2 join room "group:g1"
ทุกคน <── group_list (g1 สมาชิก: C1, C2) ──┤
C2    <── join_group_ok ──────────────────┘ → client เปิดห้อง #g1 ให้ทันที
```

**ทำไมผู้สร้างดึงคนอื่นเข้ากลุ่มไม่ได้**
1. `create_group` สร้างกลุ่มที่มีแค่ผู้สร้าง ไม่มีพารามิเตอร์ให้ใส่สมาชิกคนอื่น (R8)
2. `join_group` เพิ่มเฉพาะเจ้าของ socket ที่ส่ง event ถ้าใส่ `name: "C2"` มาใน payload server ก็ไม่สนใจ
3. ไม่มี event เชิญหรือเพิ่มสมาชิก (เช่น `invite`, `add_member`) อยู่ใน protocol เลย

## ทดสอบด้วยมือ

restart server + refresh client แล้ว login `C1`, `C2`, `C3`

- [ ] C1 สร้าง `g1` → C2 และ C3 เห็น g1 พร้อมปุ่ม **"[join]"** และยังไม่ได้เป็นสมาชิก
- [ ] C1 ส่งข้อความใน g1 → C2 **ไม่ได้รับ** (ไม่มี unread)
- [ ] C2 กด "[join]" → ห้อง `#g1` เปิดให้ทันที ปุ่มหายไป
- [ ] ทุกคนเห็น g1 เปลี่ยนเป็น `2 members: C1, C2`
- [ ] C3 ยังไม่ได้เป็นสมาชิก และปุ่ม "[join]" ยังอยู่ (ไม่ได้ถูกเพิ่มตามไปด้วย)
- [ ] C1 ส่งข้อความใหม่ใน g1 → C2 ได้รับ แต่**ไม่เห็นข้อความเก่า**ที่ส่งก่อน join
- [ ] (Console C1) `socket.emit("join_group", { group: "g1", name: "C3" })` → ขึ้น `You are already a member of "g1"` และ C3 ไม่ได้ถูกเพิ่มเข้าไป
- [ ] ทุกคนออกจาก g1 → login `C4` → g1 ขึ้น "No members" กด "[join]" ได้

เก็บ screenshot ไว้ที่ `docs/evidence/R10/`:
- `R10-join-button.png`: C2 เห็นปุ่ม "[join]" ข้าง g1 ที่ C1 สร้าง
- `R10-after-join.png`: หลัง C2 กด → ห้อง g1 เปิด และรายชื่อสมาชิก `C1, C2`
- `R10-others-not-added.png`: C3 ยังไม่ได้เป็นสมาชิก ปุ่ม "[join]" ยังอยู่
- `R10-cannot-add-others.png`: Console ที่ C1 ลอง join โดยใส่ `name: "C3"` แล้ว C3 ไม่ได้ถูกเพิ่ม

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- r10`

ผ่าน 15/15: สร้างกลุ่มแล้วคนอื่นไม่ถูกเพิ่มเอง, ผู้สร้างเพิ่มคนอื่นผ่าน payload (`name`, `member`, `members`) ไม่ได้,
C3 ส่ง `name: "C2"` มาแล้วคนที่ถูกเพิ่มคือ C3 เอง, คนที่ไม่ใช่สมาชิกไม่ได้รับข้อความกลุ่ม, join แล้วได้ `join_group_ok`,
ทุกคนเห็นสมาชิกใหม่, `join_group_ok` ส่งให้ผู้ join คนเดียว, join แล้ว broadcast `group_list` แค่ 1 ครั้ง,
join แล้วได้รับข้อความใหม่แต่ไม่ได้ข้อความเก่า, join ซ้ำ → `ALREADY_MEMBER` และไม่ broadcast,
กลุ่มที่ไม่มีอยู่หรือไม่ได้ระบุชื่อกลุ่ม → `GROUP_NOT_FOUND`, ยังไม่ register → `NOT_REGISTERED`, join กลุ่มที่ไม่มีสมาชิกเหลือได้
