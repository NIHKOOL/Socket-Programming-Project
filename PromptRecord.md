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
