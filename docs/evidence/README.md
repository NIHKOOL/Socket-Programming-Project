# Evidence

หลักฐานการทดสอบแต่ละ requirement ใช้ประกอบสไลด์และ demo

**กติกาการเก็บไฟล์**
- 1 requirement = 1 โฟลเดอร์ เช่น `R1/`, `R7/`
- ตั้งชื่อไฟล์ `<R>-<สิ่งที่เห็น>.png` เช่น `R1-C1.png` = หน้าจอของ client ชื่อ C1, `R1-server-log.png` = terminal ของ server
- เพิ่มแถวในตารางด้านล่างทุกครั้งที่เพิ่มรูป

## R1 — System Architecture

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R1-C1.png](R1/R1-C1.png) | 2026-10-27 | server + client 2 ตัว **บนเครื่องเดียวกัน** | หน้าจอของ C1: ออนไลน์ 2 คน (C1 คือตัวเอง และ C2) |
| [R1-C2.png](R1/R1-C2.png) | 2026-10-27 | server + client 2 ตัว **บนเครื่องเดียวกัน** | หน้าจอของ C2: ออนไลน์ 2 คน (C1 และ C2 คือตัวเอง) รายชื่อตรงกับ C1 |

> ⚠️ ยังไม่มีหลักฐานแบบ client คนละเครื่อง ซึ่งโจทย์ R1 บังคับ ต้องทดสอบเพิ่มตาม [R1_TEST.md](../R1_TEST.md) แล้วเก็บรูปต่อไปนี้:
> - `R1-server-log.png`: terminal ของ server ที่เห็น `[connect] ... from <IP>` จาก IP ต่างกันอย่างน้อย 2 ตัว
> - `R1-machines.jpg`: รูปถ่ายคอมแต่ละเครื่องที่เปิดแชทอยู่พร้อมกัน

รูปชุดนี้ใช้เป็นหลักฐานของ **R4** ได้ด้วย (เห็นรายชื่อออนไลน์ทั้งหมดรวมถึงตัวเอง)

## R2 — Socket Programming only

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R2-server-log.png](R2/R2-server-log.png) | 2026-10-27 | server `192.168.1.56`, client `192.168.1.36` | ทดสอบ 1: server แสดง IP ของตัวเอง, C1/C2 connect จาก `192.168.1.36` และ log `[recv] ... register` |
| [R2-console-emit.png](R2/R2-console-emit.png) | 2026-10-27 | เหมือนด้านบน | ทดสอบ 2: C1 ส่ง `socket.emit("private_msg", { to: "C2", ... })` จาก DevTools Console |
| [R2-server-recv-private-msg.png](R2/R2-server-recv-private-msg.png) | 2026-10-27 | เหมือนด้านบน | ทดสอบ 2: server log `[recv] C1 -> private_msg {"to":"C2","text":"hi from console"}` |
| [R2-ws-upgrade.png](R2/R2-ws-upgrade.png) | 2026-10-27 | เหมือนด้านบน | ทดสอบ 2: `ws://192.168.1.56:3000/socket.io/?EIO=4&transport=websocket` ได้ `101 Switching Protocols`, `Upgrade: websocket` |
| [R2-no-fetch-xhr.png](R2/R2-no-fetch-xhr.png) | 2026-10-27 | เหมือนด้านบน | ทดสอบ 2: ตัวกรอง Fetch/XHR ว่าง แปลว่าไม่มี REST call |
| [R2-no-rest.png](R2/R2-no-rest.png) | 2026-10-27 | เหมือนด้านบน | ทดสอบ 3: `http://192.168.1.56:3000/messages` ได้ "This server only accepts Socket.IO connections." |

## R3 — Unique name

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R3-name-taken.png](R3/R3-name-taken.png) | 2026-10-27 | server `192.168.1.56`, client `192.168.1.36` | login เป็น `C1` ซ้ำ → `ชื่อ "C1" ถูกใช้แล้ว` และยังอยู่หน้า login |
| [R3-case-insensitive.png](R3/R3-case-insensitive.png) | 2026-10-27 | เหมือนด้านบน | login เป็น `c1` → `ชื่อ "c1" ถูกใช้แล้ว` (ไม่สนตัวพิมพ์) |
| [R3-server-log.png](R3/R3-server-log.png) | 2026-10-27 | เหมือนด้านบน | การ register ซ้ำทุกครั้งตามด้วย `[disconnect] (unregistered)`, เปลี่ยนเป็น `C2` แล้วเข้าได้, `C1` disconnect |

> ขั้น "ชื่อว่างอีกครั้งหลังเจ้าของ disconnect" ยืนยันด้วย test อัตโนมัติ ยังไม่มี screenshot

## R4 — Online user list

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R1-C1.png](R1/R1-C1.png), [R1-C2.png](R1/R1-C2.png) | 2026-10-27 | เครื่องเดียว | (จาก R1) C1 และ C2 เห็นรายชื่อตรงกันและเห็นชื่อตัวเอง |

> รูปที่ต้องเก็บ (วิธีอยู่ใน [R4_TEST.md](../R4_TEST.md)): `R4-three-clients.png`, `R4-after-leave.png`, `R4-server-down.png`

---

> R2 แนะนำเพิ่ม (ไม่บังคับ): `R2-ws-frames.png` แท็บ **Messages** ที่เห็น frame `42["private_msg",...]` ใช้ประกอบสไลด์อธิบาย packet format
