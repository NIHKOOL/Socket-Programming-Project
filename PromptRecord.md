# Prompt Record

บันทึก prompt ที่สมาชิกในทีมใช้สั่ง AI (Claude, ChatGPT, Copilot ฯลฯ) ระหว่างทำโปรเจกต์
มีไว้เพื่อให้ทีมรู้ว่าโค้ดส่วนไหนได้มาอย่างไร ใช้ทำซ้ำได้ และเตรียมตอบคำถามอาจารย์

**กติกา**
- เพิ่ม entry ใหม่ไว้ท้ายไฟล์เสมอ (เรียงตามเวลา) ห้ามลบของคนอื่น
- คัด prompt มาให้ตรงกับที่พิมพ์จริง ถ้ายาวมากให้สรุป แต่ต้องคงใจความเดิม
- ถ้าใช้โค้ดจาก AI ต้อง**อ่านและเข้าใจก่อน commit** เพราะอาจารย์จะถามเรื่องโค้ด

## Template

```markdown
### [YYYY-MM-DD] <หัวข้อสั้น ๆ>
- **ผู้ใช้:** <ชื่อสมาชิก>
- **AI / Tool:** <เช่น Claude Code (Opus 5.5), ChatGPT>
- **Requirement:** <เช่น R7, R11, Part 3 AI>
- **Prompt:**
  > <ข้อความที่ใช้สั่ง>
- **ผลลัพธ์:** <AI ทำอะไรให้ / ไฟล์ที่สร้างหรือแก้>
- **หมายเหตุ:** <แก้อะไรต่อเอง, ใช้ได้จริงไหม, สิ่งที่ต้องระวัง>
```

---

## Log

### [2026-10-27] สรุปโจทย์ term project
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** ทั้งหมด
- **Prompt:**
  > อ่านไฟล์ Computer_Network_Term_Project_Socket_Programming.pdf แล้วสรุปมาว่าต้องทำอะไรบ้าง
- **ผลลัพธ์:** สรุป requirement R1–R11, Part 3 และลำดับการทำงานที่แนะนำ (ตอบในแชท ไม่ได้สร้างไฟล์)
- **หมายเหตุ:** —

### [2026-10-27] วางเอกสารเริ่มต้นของโปรเจกต์
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1 (เอกสารสถาปัตยกรรม/โปรโตคอล)
- **Prompt:**
  > ก่อนเริ่มทำควรมี SKILL.md อะไรที่ควรใช้ไหมเพื่อทำให้คนที่ clone Project ไปทำต่อเข้าใจได้ง่าย
  >
  > สร้างเลยรวมถึงสร้าง PromptRecode.md เพื่อเก็บสิ่งที่คนในทีม prompt ให้ AI ช่วยทำด้วย
- **ผลลัพธ์:** สร้าง `README.md`, `docs/PROTOCOL.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, `PromptRecord.md` แบบยังไม่ผูกกับภาษาใด (มีช่อง TODO ให้กรอกหลังเลือก stack)
- **หมายเหตุ:** ต้องกรอก Tech Stack, คำสั่งรัน และรายชื่อสมาชิกเพิ่ม

### [2026-10-27] เลือก stack และวางโครง server/client
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1, R2, R3–R11 (ฝั่ง server), R3–R4 (ฝั่ง client)
- **Prompt:**
  > ใช้ Techstack ตามเอกสารเลย
  >
  > (เลือก: Socket.IO + React)
- **ผลลัพธ์:** สร้าง `server/` (Node.js + Socket.IO มี handler ครบ R3–R11 ตาม PROTOCOL) และ `client/` (React + Vite มีหน้า login + รายชื่อออนไลน์ + รายชื่อกลุ่ม) อัปเดต README, CLAUDE.md, docs/PROTOCOL.md (เปลี่ยนเป็น Socket.IO events), docs/ARCHITECTURE.md (ตารางโปรโตคอล What/Why/How)
- **หมายเหตุ:** ทดสอบ server ด้วย client จำลอง 3 ตัวบนเครื่องเดียว ผ่านทุกข้อ ยังไม่ได้ทดสอบข้ามเครื่อง UI ห้องแชท (R5–R8, R10, R11) ยังไม่ได้ทำ

### [2026-10-27] R1 — เตรียมทดสอบข้ามเครื่อง + อธิบายการทำงาน
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1, R2
- **Prompt:**
  > ทำ R1 ก่อนพร้อมบอกว่าทำงานยังไงใช้ code ส่วนไหนบ้าง
- **ผลลัพธ์:** ให้ `server/index.js` พิมพ์ IP ของเครื่องตอน start, สร้าง `docs/R1_TEST.md` (checklist ทดสอบข้ามเครื่อง + คำสั่งเปิด firewall + วิธีแก้ปัญหา), อธิบาย flow การเชื่อมต่อและโค้ดที่เกี่ยวข้องในแชท
- **หมายเหตุ:** ยังไม่ได้ทดสอบข้ามเครื่องจริง ต้องทำตาม R1_TEST.md

### [2026-10-27] จัดเก็บหลักฐาน R1
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1, R4
- **Prompt:**
  > ทำได้แล้วแต่ยังไม่ได้ check แบบ client คนละเครื่องเพราะเครื่องไม่พอไว้ check ทีหลังอันนี้คือรูป R1-C1 R1-C2 ช่วยเก็บให้เป็นระเบียบด้วย
- **ผลลัพธ์:** ย้ายรูปไป `docs/evidence/R1/`, สร้าง `docs/evidence/README.md` (กติกาตั้งชื่อ + ตารางหลักฐาน), อัปเดต README และ R1_TEST.md
- **หมายเหตุ:** ทดสอบผ่านบนเครื่องเดียว (C1, C2 เห็นรายชื่อกันและกัน) ยังต้องทดสอบข้ามเครื่องเพื่อปิด R1

### [2026-10-27] R2 — Socket Programming only
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R2
- **Prompt:**
  > ทำ R2 ต่อเลยพร้อมบอกด้วยว่าทำงานยังไงและบอกว่า code ส่วนไหนทำอะไรบ้าง
- **ผลลัพธ์:** `server/index.js`: HTTP request ที่ไม่ใช่ Socket.IO ตอบ 404 (ไม่มี REST) และ log ทุก event ที่รับผ่าน socket ด้วย `socket.onAny` สร้าง `docs/R2_TEST.md` (วิธีดู WebSocket frame ใน DevTools, ความหมาย packet `42[...]`, Wireshark)
- **หมายเหตุ:** smoke test 7 ข้อผ่าน, `GET /messages` → 404, handshake `/socket.io/` ยังทำงาน ยังต้องเก็บ screenshot หลักฐานใน `docs/evidence/R2/`

### [2026-10-27] แก้ทดสอบ 2 ของ R2 (ส่ง private_msg ไม่ได้)
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R2
- **Prompt:**
  > ทดสอบ 2 ของ R2_TEST.md ไม่ได้เพราะส่ง private_msg หากันไม่ได้
- **ผลลัพธ์:** สาเหตุคือยังไม่มี UI ของ R7 แก้โดยเปิด `window.socket` ใน dev mode (`client/src/App.jsx`) เพื่อส่ง event จาก DevTools Console และแก้ `docs/R2_TEST.md` ให้ตรงกับสิ่งที่ทดสอบได้จริง
- **หมายเหตุ:** `window.socket` ไม่ติดไปใน production build

### [2026-10-27] R2 ทดสอบผ่าน + จัดเก็บหลักฐาน
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R2
- **Prompt:**
  > R2 test หมดแล้วผ่าน
- **ผลลัพธ์:** เปลี่ยนชื่อรูปใน `docs/evidence/R2/` ให้เป็นรูปแบบเดียวกัน (แก้ไฟล์ที่ชื่อมี `/` และช่องว่าง) เพิ่มตารางหลักฐาน R2 ใน `docs/evidence/README.md` และเปลี่ยน R2 ใน README เป็น ✅
- **หมายเหตุ:** ทดสอบโดยให้ server อยู่ที่ 192.168.1.56 และ client ทั้ง 2 ตัวอยู่ที่ 192.168.1.36 (client ทั้งสองอยู่เครื่องเดียวกัน จึงยังปิด R1 ไม่ได้)

### [2026-10-27] R3 — ชื่อ client ไม่ซ้ำกัน
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R3
- **Prompt:**
  > ทำ R3 ก่อนเลย
- **ผลลัพธ์:** `server/index.js`: เช็กชื่อซ้ำแบบไม่สนตัวพิมพ์ (`isNameTaken`), จำกัด 1–20 ตัวอักษร, broadcast `user_list`/`group_list` เฉพาะ room `registered` / `client/src/App.jsx`: register ไม่ผ่าน → disconnect ให้กรอกใหม่ได้ทันที, input `maxLength=20` / อัปเดต `docs/PROTOCOL.md`, สร้าง `docs/R3_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ 12/12 ผ่าน, smoke test เดิม 7/7 ผ่าน, client build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R3/`

### [2026-10-27] ตรวจ R3
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R3
- **Prompt:**
  > ตอนนี้ R3 เสร็จแล้ว ตรวจหน่อย
- **ผลลัพธ์:** ตรวจรูปหลักฐาน 3 รูปแล้วผ่าน (ชื่อซ้ำ, ไม่สนตัวพิมพ์, server log ที่เห็นการปฏิเสธ + เปลี่ยนชื่อแล้วเข้าได้โดยไม่ต้อง refresh) เปลี่ยนชื่อไฟล์ใน `docs/evidence/R3/` และเปลี่ยน R3 ใน README เป็น ✅
- **หมายเหตุ:** screenshot ไม่เห็นขั้น "ชื่อว่างหลัง disconnect" แต่ test อัตโนมัติยืนยันแล้ว

### [2026-10-27] R4 — รายชื่อ client ที่ออนไลน์
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R4
- **Prompt:**
  > ต่อ R4 เลย
- **ผลลัพธ์:** แก้บั๊ก: auto-reconnect อาจได้ NAME_TAKEN จนรายชื่อค้าง → ปิด `reconnection` (`client/src/socket.js`) และให้กลับหน้า login เมื่อหลุด (`client/src/App.jsx`) / ชื่อตัวเองอยู่บนสุด ที่เหลือเรียงตามตัวอักษร / อัปเดต ARCHITECTURE.md (หัวข้อการหลุดการเชื่อมต่อ), PROTOCOL.md, สร้าง `docs/R4_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R4 9/9, R3 12/12, smoke 7/7 ผ่าน, build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R4/`

### [2026-10-27] ตรวจ R4
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R4
- **Prompt:**
  > Test R4 เสร็จแล้วครบทุกอัน
- **ผลลัพธ์:** ตรวจรูปหลักฐาน: `R4-three-clients.png` ผ่าน, `R4-server-down.png` ผ่าน (ยืนยันการแก้บั๊ก reconnect), `R4-after-leave.png` เหมือน three-clients ทุกพิกเซลจึงต้องถ่ายใหม่ เปลี่ยน R4 ใน README เป็น ✅ และอัปเดตตารางหลักฐาน + checklist
- **หมายเหตุ:** รอรูป `R4-after-leave.png` ใหม่

### [2026-10-27] R5 + R6 — ห้องแชทและ UI แชท
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R5, R6
- **Prompt:**
  > เริ่มเลย
  >
  > (ต่อจาก "ต่อไปคือ R5 + R6 (ห้องแชทและ UI แชท) ... จะเริ่มเลยไหมครับ")
- **ผลลัพธ์:** สร้าง `client/src/rooms.js` (id ห้อง + แยกข้อความลงห้อง), `client/src/ChatRoom.jsx` (หน้าต่างข้อความ + ช่องพิมพ์ + auto-scroll), `client/src/App.css` / เขียน `App.jsx` ใหม่: sidebar คลิกเปิดห้อง, เก็บข้อความแยกตามห้อง, unread badge, ห้อง private ปิดช่องพิมพ์เมื่ออีกฝ่ายออฟไลน์ / สร้าง `docs/R5_R6_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R5 9/9, R4 9/9, R3 12/12, smoke 7/7 (บน server ใหม่) ผ่าน, build ผ่าน ยังไม่มีปุ่มสร้าง/เข้ากลุ่ม (R8, R10) ให้ใช้ Console ไปก่อน ข้อที่พบ: กลุ่มที่ไม่มีสมาชิกเหลือจะค้างใน server ตลอด ต้องตัดสินใจตอนทำ R8

### [2026-10-27] ตรวจ R5 + R6
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R5, R6
- **Prompt:**
  > เช็ก R5 R6 เรียบร้อยใช้ได้
- **ผลลัพธ์:** ตรวจรูปหลักฐาน 4 รูปผ่านทั้งหมด ย้ายโฟลเดอร์ `evidence/R5` → `evidence/R5_R6`, แก้ชื่อไฟล์ `sperate` → `separate`, เปลี่ยน R5/R6 ใน README เป็น ✅
- **หมายเหตุ:** —

### [2026-10-27] R7 — Private message
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R7 (และ R11 บางส่วน)
- **Prompt:**
  > เริ่ม R7 เลย
- **ผลลัพธ์:** `server/index.js`: เพิ่ม `cleanText()` (trim, 1–1000 ตัวอักษร, error `INVALID_TEXT`) ใช้ทั้ง `private_msg` และ `group_msg` + comment อธิบายเรื่องความเป็นส่วนตัว / `client/src/App.jsx`: ล้าง error เก่าเมื่อส่งข้อความใหม่ / อัปเดต PROTOCOL.md, สร้าง `docs/R7_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R7 13/13 (รวม "คนนอกไม่ได้รับ frame ใดเลย" และ "ปลอม from ไม่ได้"), smoke 7/7, R3 12/12, R4 9/9, R5 9/9, build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R7/`

### [2026-10-27] R7 — ใช้หลักฐานจาก R5_R6 ซ้ำ
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R7
- **Prompt:**
  > คิดว่า R7 test แล้วเอาจาก folder R5_R6 มาใส่เลยได้ไหม
- **ผลลัพธ์:** ใช้ได้บางส่วน: `R6-private-room.png` ใช้แทน sender-receiver และ `R2-server-recv-private-msg.png` ใช้แทน server log (ใส่ลิงก์ ไม่ copy ไฟล์) แต่ส่วน "only sender and receiver can see" ยังไม่มีหลักฐานมุมมองของ C3 อัปเดต evidence/README.md และ R7_TEST.md
- **หมายเหตุ:** ยังต้องถ่าย `R7-outsider-c3.png` และ `R7-outsider-ws-frames.png`

### [2026-10-27] ตรวจ R7
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R7
- **Prompt:**
  > R7 เสร็จแล้ว
- **ผลลัพธ์:** ตรวจรูปแล้วผ่าน: หน้าจอ C3 ไม่มีข้อความ/unread + server log ยืนยันว่า C3 ออนไลน์อยู่ตอน C1↔C2 คุยกัน ไฟล์ `R7-outsider-ws-frams.png` เป็น server log จึงเปลี่ยนชื่อเป็น `R7-server-log.png`, `R7-outsider-C3.png` → `R7-outsider-c3.png` เปลี่ยน R7 ใน README เป็น ✅
- **หมายเหตุ:** รูป WS frame ของ C3 แนะนำให้มี (ไม่บังคับ) หรือโชว์สดตอน demo

### [2026-10-27] R8 — สร้างกลุ่ม
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R8
- **Prompt:**
  > ทำ R8 เลย เมื่อกลุ่มสมาชิกออกไปหมดแล้ว ให้เหลือกลุ่มนั้นไว้เลย
- **ผลลัพธ์:** `server/index.js`: ชื่อกลุ่ม 1–30 ตัวอักษร, ห้ามซ้ำแบบไม่สนตัวพิมพ์ (`isGroupTaken`), เพิ่ม event `create_group_ok` ส่งให้ผู้สร้าง, กลุ่มที่ไม่มีสมาชิกยังไม่ถูกลบ (ตามที่ทีมตัดสินใจ) / `client/src/App.jsx`: ฟอร์มสร้างกลุ่มใน sidebar, เปิดห้องกลุ่มอัตโนมัติเมื่อสร้างสำเร็จ, แสดง "ไม่มีสมาชิก" / อัปเดต PROTOCOL.md, สร้าง `docs/R8_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R8 15/15, smoke 7/7, R3 12/12, R4 9/9, R5 9/9, R7 13/13, build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R8/`

### [2026-10-27] ตรวจ R8
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R8
- **Prompt:**
  > check R8 แล้วใช่ได้หมด
- **ผลลัพธ์:** ตรวจรูป 4 รูปแล้วผ่าน เปลี่ยนชื่อ `R8-other-client0-view.png` → `R8-other-client-view.png` เปลี่ยน R8 ใน README เป็น ✅
- **หมายเหตุ:** `R8-multiple-groups.png` แสดงว่า C1 เป็น "สมาชิก" หลายกลุ่ม (g2, g3 สร้างโดย C2, C3) ไม่ได้แสดงว่า C1 "สร้าง" หลายกลุ่ม ซึ่ง test อัตโนมัติยืนยันแล้ว แนะนำให้ถ่ายใหม่

### [2026-10-27] R9 — รายชื่อกลุ่มทั้งหมด + สมาชิก
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R9
- **Prompt:**
  > ทำ R9 ต่อเลย
- **ผลลัพธ์:** ตรวจโค้ดแล้ว server ส่ง `group_list` ครบทุกจังหวะ (register, create, join, disconnect) ไม่มีช่องโหว่ เพิ่ม comment อธิบาย R9 ใน `server/index.js` / `client/src/App.jsx`: แสดงจำนวนสมาชิก + "(คุณ)" ในรายชื่อสมาชิกกลุ่ม / สร้าง `docs/R9_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R9 10/10, smoke 7/7, R3 12/12, R4 9/9, R5 9/9, R7 13/13, R8 15/15, build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R9/`

### [2026-10-27] ตรวจ R9
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R9
- **Prompt:**
  > ทำ R10 เลยตอนนี้ R9 เรียบร้อย
- **ผลลัพธ์:** ตรวจรูป 5 รูปแล้วผ่าน เปลี่ยนชื่อ `R9-all-groups1/2.png` → `R9-all-groups-c1/c2.png` เปลี่ยน R9 ใน README เป็น ✅
- **หมายเหตุ:** —

### [2026-10-27] R10 — เข้ากลุ่มด้วยตัวเอง
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R10
- **Prompt:**
  > ทำ R10 เลยตอนนี้ R9 เรียบร้อย
- **ผลลัพธ์:** `server/index.js`: `join_group` ตอบ `ALREADY_MEMBER` ถ้าเป็นสมาชิกอยู่แล้ว (ไม่ broadcast ซ้ำ), เพิ่ม event `join_group_ok`, เพิ่ม comment อธิบายว่าทำไมเพิ่มคนอื่นไม่ได้ / `client/src/App.jsx` + `App.css`: ปุ่ม "เข้าร่วม" ข้างกลุ่มที่ยังไม่เป็นสมาชิก, เปิดห้องอัตโนมัติเมื่อ join สำเร็จ / อัปเดต PROTOCOL.md, สร้าง `docs/R10_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R10 15/15 (รวม "ผู้สร้างใส่ชื่อคนอื่นใน payload แล้วเพิ่มคนอื่นไม่ได้"), smoke 7/7, R3 12/12, R4 9/9, R5 9/9, R7 13/13, R8 15/15, R9 10/10, build ผ่าน ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R10/`

### [2026-10-28] ตรวจ R10
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R10
- **Prompt:**
  > check R10 เรียบร้อยแล้ว
- **ผลลัพธ์:** ตรวจรูป 4 รูปแล้วผ่าน (รวม C1 ส่ง `name: "C3"` แล้ว C3 ไม่ได้ถูกเพิ่ม) เปลี่ยน R10 ใน README เป็น ✅ / เพิ่ม `<link rel="icon" href="data:,">` ใน `client/index.html` กัน 404 favicon ขึ้นใน Console
- **หมายเหตุ:** —

### [2026-10-28] R11 — Group message
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R11
- **Prompt:**
  > ทำ R11 เลย
- **ผลลัพธ์:** ตรวจโค้ดแล้ว logic ถูกต้อง (ตรวจสิทธิ์ผ่าน `members` + ส่งผ่าน Socket.IO room ซึ่ง sync กันทุกจังหวะ) จึงเพิ่มแค่ comment อธิบายการตรวจ 2 ชั้นใน `server/index.js` / สร้าง `docs/R11_TEST.md`
- **หมายเหตุ:** test อัตโนมัติ R11 17/17 (รวม "คนนอกไม่ได้รับ frame ใดเลย" และ "คนใหม่ที่ใช้ชื่อเดิมของสมาชิกที่ออกไปแล้วไม่ได้สิทธิ์สมาชิก"), smoke 7/7, R3–R10 ผ่านทั้งหมด ยังต้องทดสอบด้วยมือและเก็บ screenshot ใน `docs/evidence/R11/`

### [2026-10-28] ตรวจ R11 + ย้าย test อัตโนมัติเข้าโปรเจกต์
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R11, ทุก R (test)
- **Prompt:**
  > check R11 แล้ว
  > ได้เลยย้าย test อัตโนมัติทั้งหมดอยู่ในโฟลเดอร์ชั่วคราว เข้ามาในโปรเจกต์เลย
- **ผลลัพธ์:** ตรวจรูป R11 8 รูปผ่าน (รวม WS frame ของคนนอกที่ไม่มี `group_msg`) เปลี่ยนชื่อ 1 ไฟล์ เปลี่ยน R11 เป็น ✅ / ย้าย test 9 ไฟล์ไป `server/tests/*.test.mjs` + `helpers.mjs` + `run-all.mjs` (แต่ละไฟล์ได้ server ใหม่ที่ port 4100+), เพิ่ม `npm test` และ devDependency `socket.io-client@4.8.1` ใน server, แก้ check ใน R7 test ที่ผ่านง่ายเกินไป (`|| length === 3`) ให้เทียบข้อความทุกตัวอักษร / อัปเดต README, CLAUDE.md, R*_TEST.md (เพิ่มคำสั่งรัน)
- **หมายเหตุ:** `npm test` ผ่าน 9/9 ไฟล์ (107 ข้อ) ทดลองให้ test ล้มแล้วตัวรันแจ้งข้อที่ไม่ผ่านและ exit 1 ถูกต้อง

### [2026-10-28] R1 — ใช้เครื่อง server เป็น client ตัวที่ 2 ได้ไหม
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1
- **Prompt:**
  > เรา test R1 ข้ามเครื่องโดยใช้ Client2 เป็นเครื่องเดียวกับ ที่เป็น Server ได้ไหม เปลี่ยนแค่ Terminal
- **ผลลัพธ์:** ได้ เพราะโจทย์เขียนว่า "The server may run on one of these computers" แนะนำให้ใส่ Server URL เป็น IP จริงแทน localhost เพื่อให้ log แยก IP ของ client ได้ชัด เพิ่มหัวข้อ "Setup ที่ใช้ได้" ใน `docs/R1_TEST.md`
- **หมายเหตุ:** —

### [2026-10-28] R1 — ทดสอบข้ามเครื่องผ่าน
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1
- **Prompt:**
  > ตอนนี้ R1 test ข้าม device ได้แล้ว
  >
  > ข้ามรูปนี้ไปเลยเพราะผลเหมือนกัน
- **ผลลัพธ์:** เปลี่ยน R1 ใน README เป็น ✅ บันทึกในตารางหลักฐานและ R1_TEST.md ว่าทดสอบข้ามเครื่องผ่านแล้ว แต่ทีมตัดสินใจไม่เก็บรูป
- **หมายเหตุ:** ตอน demo ให้โชว์ server log ที่เห็น 2 IP สด ๆ Part 1 + Part 2 ครบทั้งหมด

### [2026-10-28] สร้าง Handbook.md
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** R1–R11 (เอกสาร)
- **Prompt:**
  > ก่อนที่จะเริ่มไป Part 3 ช่วยทำ Handbook.md ได้ไหมว่า Requirement แต่ละข้อทำงานยังไง พร้อม map ไปหาส่วนของ code ตามลำดับการทำงานที่เกี่ยวข้องทั้งหมดเพื่อให้คนในทีมมาดูต่อจะได้เข้าใจได้ทันที
- **ผลลัพธ์:** สร้าง `Handbook.md`: ภาพรวม (แผนภาพ, หน้าที่ของแต่ละไฟล์, state, หลักการ 3 ข้อ, emit 3 แบบ) / R1–R11 ไล่ลำดับการทำงานทีละขั้นพร้อมลิงก์ไปที่บรรทัดของโค้ด / การหลุดการเชื่อมต่อ / คู่มือเพิ่ม event ใหม่ (สำหรับ Part 3) / คำถามที่อาจารย์น่าจะถาม เพิ่มลิงก์ใน README และกฎใน CLAUDE.md ให้อัปเดต Handbook ทุกครั้งที่แก้โค้ด
- **หมายเหตุ:** เลขบรรทัดตรงกับโค้ด ณ วันที่ 2026-10-28

### [2026-10-28] หน้า login แบบ terminal (white theme) อยู่กึ่งกลางจอ
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** UI (R3 หน้า login)
- **Prompt:**
  > ทำให้หน้า login เป็นแนว terminalได้ไหมแต่เป็น white theme นะ แล้วเลื่อนกล่อง login มาอยู่ตรงกึ่งกลางหน้าจอ
- **ผลลัพธ์:** `client/src/App.jsx`: เปลี่ยนโครง HTML ของหน้า login เป็นหน้าต่าง terminal (title bar 3 จุด, prompt `server>` / `name>`, ปุ่ม `> เข้าสู่ระบบ_` ที่ cursor กะพริบ, error แบบ `error: ...`) logic เดิมไม่เปลี่ยน / `client/src/App.css`: style `.login-screen` (grid place-items center) + `.terminal*` ฟอนต์ monospace พื้นขาว / อัปเดตเลขบรรทัด App.jsx ใน Handbook.md (11 ลิงก์)
- **หมายเหตุ:** build ผ่าน ยังไม่ได้ดูใน browser จริง

### [2026-10-28] เปลี่ยน UI เป็นภาษาอังกฤษทั้งหมด
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** UI
- **Prompt:**
  > ขอเป็น English ทั้งหมดได้ไหมสำหรับ UI
- **ผลลัพธ์:** `client/src/App.jsx`, `ChatRoom.jsx`, `index.html` (`lang="en"`, เวลาเปลี่ยนจาก `th-TH` เป็น `en-GB`): ข้อความบนจอทั้งหมดเป็นภาษาอังกฤษ + helper `memberCount` (1 member / n members) และ `withYou` / `server/index.js`: `message` ของ error ทุก code เป็นภาษาอังกฤษ (code เหมือนเดิม) / แทนที่ข้อความบนจอที่อ้างถึงใน `docs/R*_TEST.md`, Handbook, README, PROTOCOL 60 จุด (ไม่แตะ `docs/evidence/README.md` เพราะอธิบายรูปเก่าที่ UI ยังเป็นภาษาไทย) / อัปเดตเลขบรรทัดใน Handbook / เพิ่มกฎใน CLAUDE.md
- **หมายเหตุ:** comment ในโค้ดยังเป็นภาษาไทย test เทียบแค่ error code จึงไม่ต้องแก้ `npm test` ผ่าน 9/9, build ผ่าน

### [2026-10-28] UI ของ client เป็นแนว terminal ทั้งหมด
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** UI (R4–R11 ส่วนแสดงผล)
- **Prompt:**
  > ทำให้ UI ของ Client เป็นแนว Terminal ให้หมด
- **ผลลัพธ์:** `client/src/App.jsx`: ห่อหน้าแชทด้วยหน้าต่าง terminal (title bar `simple-chat — <me>@<host>`), sidebar แบบ `$ whoami`, `# online (n)`, `@user`, `#group`, unread `[n]`, ปุ่ม `[+ create]` / `[join]`, error `error: ...` / `client/src/ChatRoom.jsx`: เขียนใหม่ ข้อความเป็นบรรทัด log `[hh:mm] from: text` (ชื่อตัวเองสีเขียว คนอื่นสีน้ำเงิน) ช่องพิมพ์มี prompt `<me>@<room>:~$` ปุ่ม `[send ⏎]` / `client/src/App.css`: เขียนใหม่ทั้งไฟล์ ฟอนต์ monospace ทั้งแอป สีหลักรวมอยู่ใน `:root` รองรับจอแคบ (sidebar ขึ้นไปอยู่ด้านบน) / logic เดิมไม่เปลี่ยน / อัปเดตข้อความใน docs 36 จุด + remap ลิงก์ App.jsx และ ChatRoom.jsx ใน Handbook
- **หมายเหตุ:** `npm test` 9/9, build ผ่าน ยังไม่ได้ดูใน browser จริง

### [2026-10-28] แยกโครงสร้าง Feature เสริม (Part 3) ออกจาก core
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 (โครงสร้าง)
- **Prompt:**
  > ก่อนทำเราแยกส่วนที่เป็น Feature เสริมได้ไหม อย่าง Server/Client ก็มี folder เพิ่ม handbook.md ก็มีเพิ่ม แล้วก็มีการเก็บ Test เฉพาะ Feature เสริมด้วย
- **ผลลัพธ์:** `server/features/index.js` (ทะเบียน feature + จุดเชื่อม `handleHttp` / `setupSocket`), `server/index.js` เพิ่มแค่จุดเชื่อม 2 จุด + log รายชื่อ feature / `server/tests/features/` + `run-all.mjs` หาไฟล์ใน features ด้วย (`npm test -- features/`) + test `f00-feature-hooks` / `client/src/features/README.md` (กติกาฝั่ง client) / `HandbookFeatures.md`, `docs/features/README.md`, `docs/evidence/features/README.md` / อัปเดต README (โครงสร้าง + ตาราง Part 3), CLAUDE.md (กฎของ feature), PROTOCOL.md (หัวข้อ Feature เสริม), Handbook.md (ลิงก์ + เลื่อนลิงก์ server 58 ตัว)
- **หมายเหตุ:** `npm test` 10/10 (core 9 + feature 1), build ผ่าน

### [2026-10-28] Feature 1: Cloud (เตรียมโค้ด + ทดสอบบนเครื่อง)
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Cloud deployment
- **Prompt:**
  > เริ่มทำเลย
  >
  > (ต่อจาก "พร้อมเริ่ม Feature 1: Cloud")
- **ผลลัพธ์:** `server/features/cloud.js` (เสิร์ฟ `client/dist` เฉพาะ GET/HEAD, กัน path traversal, cache header, log IP จริงจาก `X-Forwarded-For`) ลงทะเบียนใน `server/features/index.js` / `client/src/socket.js`: build แล้วใช้ `window.location.origin` / `package.json` ที่ root (`npm run build` / `npm start`, engines node >= 20) / test `server/tests/features/f01-cloud.test.mjs` / เอกสาร: `docs/features/cloud_TEST.md` (มีขั้นตอน deploy บน Render), หัวข้อ Cloud ใน HandbookFeatures, Deployment ใน ARCHITECTURE (TLS, reverse proxy, X-Forwarded-For, DNS), README, PROTOCOL, CLAUDE.md, ลิงก์ socket.js ใน Handbook
- **หมายเหตุ:** **ปัญหาที่เกิด:** คำสั่ง build รุ่นแรกใช้ `npm ci` ซึ่งลบ `client/node_modules` ระหว่างที่ dev server ล็อกไฟล์อยู่ (EPERM) ทำให้ vite/react หายไป → ติดตั้งคืนแล้ว และเปลี่ยน build เป็น `npm install` / ผลทดสอบ: `npm test` 11/11 (cloud 13/13), root build + start: `/` 200, asset 200, `/messages` 404, socket register ได้, log real IP ถูกต้อง / ยังไม่ได้ deploy ขึ้น Render จริง

### [2026-10-28] UI responsive สำหรับมือถือ
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** UI (R5, R6 บนมือถือ)
- **Prompt:**
  > UI ฝั่ง Client ทำ Responsive ให้มือถือหน่อยได้ไหม
- **ผลลัพธ์:** มือถือ (≤ 720px) แสดงทีละหน้า: หน้ารายชื่อ ↔ ห้องแชทเต็มจอ + ปุ่ม `[< back (n)]` (n = unread ของห้องอื่น) / `App.jsx`: `closeRoom()`, class `room-open`, `otherUnread` / `ChatRoom.jsx`: ปุ่ม back, prompt ย่อเหลือ `$` บนมือถือ, `enterKeyHint="send"` / `device.js`: ไม่ autofocus บนจอสัมผัส (คีย์บอร์ดไม่เด้งเอง) / `App.css`: `100dvh`, input 16px (กัน iPhone zoom), ปุ่มสูง ≥ 40–44px, ข้อความตัดบรรทัดเต็มจอ / `index.html`: `interactive-widget=resizes-content`, `theme-color` / เพิ่ม checklist มือถือใน `docs/R5_R6_TEST.md`, remap ลิงก์ใน Handbook 44 ตัว
- **หมายเหตุ:** build ผ่าน, `npm test` 11/11 ยังไม่ได้ทดสอบบนมือถือจริง

### [2026-10-28] Cloud ใช้งานได้แล้ว นับเป็น Feature 1
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 1 (Cloud)
- **Prompt:**
  > ตอนนี้ On cloud ใช้ได้แล้วแต่ยังไม่เก็บ evidence เดี๋ยวค่อยเก็บ Cloud อันนี้นับเป็น Feature 1 ได้ไหม
- **ผลลัพธ์:** นับได้ (โจทย์: "Cloud-based deployment ... will be marked as one special point") เปลี่ยนสถานะใน README และ HandbookFeatures เป็น ✅ และระบุใน evidence ว่ายังไม่ได้เก็บหลักฐาน
- **หมายเหตุ:** Part 3 ต้องมีฟีเจอร์ AI อย่างน้อย 1 อย่าง / ยังต้องเก็บรูป 4 รูปตาม `docs/features/cloud_TEST.md`

### [2026-10-28] Feature 2: Discord bridge
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 2 (Discord)
- **Prompt:**
  > อยากทำให้เกี่ยวข้องกับ Discord
  >
  > (เลือก: เชื่อมกับ Discord จริง — bridge)
- **ผลลัพธ์:** `server/features/discord.js` (discord.js 14.16.3): กลุ่ม `#discord` ↔ Discord channel, ขาออกผ่าน `onGroupMessage` (`**name**: text`, ปิด ping), ขาเข้าจาก Gateway → `io.to("group:discord")` + `source: "discord"`, ข้ามข้อความจาก bot (กันวนลูป), ปิดตัวเองถ้าไม่มี token / เพิ่มจุดเชื่อม `initFeatures` + `onGroupMessage` (core แตะ 2 จุด) / client: `client/src/features/discord/` (ป้าย `⇄ discord`, `[discord]`, สี blurple, ข้อความจาก Discord ไม่นับเป็นของเรา) / `server/.env.example` / `run-all.mjs` ตั้ง `NODE_ENV=test` + ล้าง token / test `f02-discord` / เอกสาร: `docs/features/discord_TEST.md` (สร้าง bot + ตั้งค่า + checklist), HandbookFeatures (Feature 2 + ตารางจุดเชื่อม 4 จุด), PROTOCOL (`bridge_info`, `source`), ARCHITECTURE (Gateway, REST, token), README, CLAUDE.md / shift ลิงก์ Handbook ด้วย git diff (100 ลิงก์)
- **หมายเหตุ:** `npm test` 12/12 (discord 14/14), build ผ่าน, ทดสอบ server กับ token ปลอมแล้วไม่ crash **ยังไม่ได้ทดสอบกับ Discord จริง** (ต้องสร้าง bot ก่อน)

### [2026-10-28] Discord: หา Channel ID ไม่เจอ
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 2 (Discord)
- **Prompt:**
  > ขั้นตอน 1.4 หาไม่เจอ
- **ผลลัพธ์:** อธิบาย 2 วิธี: ดู Channel ID จาก URL ใน browser (`/channels/<server>/<channel>`) และเปิด Developer Mode (App Settings → Advanced) อัปเดตขั้นตอน 1.4 ใน `docs/features/discord_TEST.md`
- **หมายเหตุ:** —

### [2026-10-28] Discord: ส่งข้อความแล้วไม่ขึ้นทั้งสองฝั่ง
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 2 (Discord)
- **Prompt:**
  > พิมพ์หา Discord แล้วไม่ขึ้น Discord พิมพ์ก็ไม่ขึ้น Log ใน Render ล่าสุดคือการ Join ห้อง
- **ผลลัพธ์:** วิเคราะห์ว่า log ไม่มี `[discord]` เลย สาเหตุที่น่าจะเป็นที่สุดคือไม่ได้ตั้ง env บน Render (`server/.env` ไม่ถูก push) / แก้จุดอ่อนในโค้ด: `server/features/discord.js` เพิ่ม log `connecting to Discord Gateway...`, เตือน `NOT forwarded` เมื่อ bot ยังไม่ต่อ (เดิมข้ามเงียบ ๆ), เตือนให้เปิด MESSAGE CONTENT INTENT เมื่อได้ข้อความว่าง / อัปเดตตารางแก้ปัญหาใน `discord_TEST.md` + ลิงก์ใน HandbookFeatures
- **หมายเหตุ:** `npm test` 12/12 รอผู้ใช้เช็ก log ตอนเริ่ม server บน Render (บรรทัด `Features:`)

### [2026-10-28] Discord: login ค้างบน Render
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 2 (Discord)
- **Prompt:**
  > (วาง log จาก Render: `connecting to Discord Gateway...` แล้วไม่มี `logged in` / `login failed` ตามมา และส่งข้อความแล้วได้ `NOT forwarded`)
- **ผลลัพธ์:** วิเคราะห์ว่า env ถูกต้องแล้ว แต่ login ค้าง (ไม่สำเร็จและไม่ล้ม) สาเหตุที่น่าจะเป็นที่สุดคือ Discord rate limit / บล็อก shared IP ของ Render / เพิ่ม log วินิจฉัยใน `server/features/discord.js`: `[discord][debug]` ทุกขั้นก่อน ready (กรองบรรทัดที่มีคำว่า token), log `rate limited`, เตือนเมื่อผ่าน 30 วินาทีแล้วยังต่อไม่สำเร็จ / อัปเดตตารางแก้ปัญหาใน `discord_TEST.md` + ลิงก์ใน HandbookFeatures
- **หมายเหตุ:** บนเครื่องของ AI ติดต่อ Discord API ได้ปกติ (token ปลอมถูกปฏิเสธทันที) รอผลจาก Render (log debug) + ผลจากการรันบนเครื่องด้วย token จริง

### [2026-10-28] ย้าย Cloud host จาก Render ไป Railway
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature 1 (Cloud) + Feature 2 (Discord)
- **Prompt:**
  > งั้นเปลี่ยนเป็น Host ผ่าน Railway
- **ผลลัพธ์:** เพิ่ม `railway.json` (build `npm run build`, start `npm start`, healthcheck `/`) โค้ดแอปไม่ต้องแก้ / เขียน `docs/features/cloud_TEST.md` ใหม่เป็นขั้นตอน deploy บน Railway (Variables, Region Singapore, Generate Domain) + หัวข้อ "ย้ายจาก Render" (ต้องลบ token ออกจาก Render กัน bot ซ้ำ) / เปลี่ยน Render → Railway ใน HandbookFeatures, ARCHITECTURE, README, discord_TEST, evidence (ชื่อไฟล์หลักฐาน `cloud-railway-*.png`)
- **หมายเหตุ:** ยังไม่ได้ deploy จริง ยังไม่ยืนยันว่า Discord login บน Railway ได้ (ต้องดู log `[discord] logged in as ...`)

### [2026-10-28] Discord ใช้ได้บนเครื่อง + พัก Feature cloud
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** Part 3 — Feature cloud, Feature discord
- **Prompt:**
  > โอเคตอนนี้ใช้งานได้คิดว่าจะลบส่วนของ Cloud ไปก่อน
  >
  > (ตอบคำถาม: Discord bridge บนเครื่องใช้ได้ / Cloud: พักไว้ก่อน ไม่ลบโค้ด)
- **ผลลัพธ์:** ลบ `railway.json` (ยังไม่เคย commit) / สถานะ: discord ✅ (ใช้ได้บนเครื่อง รอเก็บหลักฐาน), cloud ⏸ พักไว้ไม่นับคะแนน (โค้ด cloud.js + root package.json ยังอยู่) / อัปเดต README, HandbookFeatures, cloud_TEST (หมายเหตุว่าพักไว้ + ให้ลบ token ออกจาก Render), evidence
- **หมายเหตุ:** การที่ Discord ใช้ได้บนเครื่องยืนยันว่าปัญหาก่อนหน้านี้อยู่ที่ Render (host)

### [2026-10-28] ยังต้องเปิด 2 port ไหม
- **ผู้ใช้:** <ใส่ชื่อ>
- **AI / Tool:** Claude Code (Opus 5.5)
- **Requirement:** การรันแอป
- **Prompt:**
  > แล้วตอนนี้เรายังต้องเปิด 2 port แบบเดิมไหมเพราะไม่มี cloud แล้ว
- **ผลลัพธ์:** ไม่ต้อง: โค้ด cloud.js ยังอยู่ ใช้แบบ port เดียว (`npm run build && npm start`) สำหรับ demo/ทดสอบข้ามเครื่อง ส่วนแบบ 2 port ใช้ตอนเขียนโค้ด / เปลี่ยนชื่อหัวข้อใน README จาก "รันแบบ Cloud" เป็น "รันแบบ port เดียว" พร้อมอธิบายว่าใช้ตอนไหน
- **หมายเหตุ:** —
