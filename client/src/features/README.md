# client/src/features — Feature เสริม (Part 3)

โค้ดฝั่ง client ของ Feature เสริมอยู่ที่นี่ แยกจาก core (R1–R11) ที่อยู่ใน `client/src/`

## กติกา

- 1 feature = 1 โฟลเดอร์ เช่น `features/ping/`, `features/ai/`
- เขียน UI / logic ของ feature ให้จบในโฟลเดอร์ของตัวเอง (component, hook, ฟังก์ชัน)
- เวลาต้องต่อเข้ากับ `App.jsx` หรือ `ChatRoom.jsx` ให้แก้ core **น้อยที่สุด** (import + เรียกใช้)
  และทุกจุดที่แก้ต้องมี comment `// Feature: <ชื่อ>` จะได้ค้นเจอและถอดออกได้ง่าย
- ข้อความที่ผู้ใช้เห็นเป็นภาษาอังกฤษ และใช้ style terminal เดียวกับ core (ใช้สีจาก `:root` ใน `App.css`)
- อธิบาย feature ใน [HandbookFeatures.md](../../../HandbookFeatures.md)

## Feature ที่มีตอนนี้

| Feature | โฟลเดอร์ | หมายเหตุ |
|---|---|---|
| เกมทายคำ AI (`guess`) | [guess/](guess/commands.js) | `/guess start [หมวด] [claude\|chatgpt\|gemini]` `hints` `stop` `ai` + ป้าย `[ai]` (แตะ `ChatRoom.jsx`: ข้อความที่มี `source` ไม่ใช่ของเรา) |
| เกม RPS (`game`) | [game/](game/index.js) | คำสั่ง `/play` `/accept` `/decline` `/move` `/quit` (ลงทะเบียนผ่าน `gameCommands`) ข้อความเกมแสดงในห้อง private กับคู่แข่ง |
| /ping + slash command (`ping`) | [commands/](commands/index.js), [ping/](ping/ping.js) | ระบบคำสั่ง (`/help`) ใช้ต่อกับคำสั่งอื่นได้ เพิ่มคำสั่งใน `COMMANDS` ที่ `commands/index.js` |
| Discord bridge (`discord`) | [discord/](discord/index.jsx) | ป้าย `⇄ discord` / `[discord]`, แตะ core ที่ `App.jsx` และ `ChatRoom.jsx` (ค้น `Feature: discord`) |
| Cloud (`cloud`) | — (ไม่มีโฟลเดอร์) | แก้ core จุดเดียว: `client/src/socket.js` ให้ build แล้วใช้ Server URL = URL เดียวกับหน้าเว็บ |
