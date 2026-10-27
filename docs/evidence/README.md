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
| [R4-three-clients.png](R4/R4-three-clients.png) | 2026-10-27 | server `192.168.1.56`, client `192.168.1.36` (3 หน้าต่าง) | C1/C2/C3 เห็น `ออนไลน์ (3)` ตรงกัน `(คุณ)` อยู่บนสุดของแต่ละคน ที่เหลือเรียงตามตัวอักษร |
| [R4-after-leave.png](R4/R4-after-leave.png) | 2026-10-27 | — | ⚠️ **ต้องถ่ายใหม่:** ไฟล์นี้เหมือน `R4-three-clients.png` ทุกพิกเซล ยังไม่เห็นรายชื่อลดเหลือ 2 (ยืนยันด้วย test อัตโนมัติแล้ว) |
| [R4-server-down.png](R4/R4-server-down.png) | 2026-10-27 | เหมือนด้านบน | หยุด server → C1, C2 กลับหน้า login พร้อม "หลุดการเชื่อมต่อจาก server กรุณาเข้าสู่ระบบใหม่" |
| [R1-C1.png](R1/R1-C1.png), [R1-C2.png](R1/R1-C2.png) | 2026-10-27 | เครื่องเดียว | (จาก R1) C1 และ C2 เห็นรายชื่อตรงกันและเห็นชื่อตัวเอง |

## R5 + R6 — Chat rooms

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R5-separate-rooms.png](R5_R6/R5-separate-rooms.png) | 2026-10-27 | client `localhost:5173` | C1 มีห้อง C2 / C3 / g1 แยกกันใน sidebar ห้อง C2 เห็นเฉพาะบทสนทนา C1↔C2 + สร้าง g1 ผ่าน Console |
| [R5-unread-badge.png](R5_R6/R5-unread-badge.png) | 2026-10-27 | เหมือนด้านบน | C2 เปิดห้อง C1 อยู่ ส่วน g1 ขึ้น unread `10` ข้อความกลุ่มไม่ปนในห้อง private |
| [R6-private-room.png](R5_R6/R6-private-room.png) | 2026-10-27 | เหมือนด้านบน | C1 กับ C2 เทียบกัน: บทสนทนาเดียวกัน ข้อความตัวเองขวา อีกฝ่ายซ้ายพร้อมชื่อ + เวลา + ช่องพิมพ์ |
| [R6-group-room.png](R5_R6/R6-group-room.png) | 2026-10-27 | เหมือนด้านบน | C3 ในห้อง `# g1` หัวห้องแสดงสมาชิก 3 คน มีข้อความจาก C1, C2, C3 พร้อมชื่อผู้ส่ง |

## R7 — Private message

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R6-private-room.png](R5_R6/R6-private-room.png) | 2026-10-27 | (ใช้ซ้ำจาก R6) | C1 ส่งหา C2 และ C2 ตอบกลับ ทั้งสองฝั่งเห็นบทสนทนาเดียวกัน (ส่วน "send a direct message") |
| [R7-server-log.png](R7/R7-server-log.png) | 2026-10-27 | client `192.168.1.36` | C1, C2, C3 register **ก่อน** จากนั้น C1↔C2 ส่ง `private_msg` หากัน (C3 ออนไลน์อยู่ตลอด) |
| [R7-outsider-c3.png](R7/R7-outsider-c3.png) | 2026-10-27 | เหมือนด้านบน | **Only sender and receiver:** หน้าจอ C3 หลัง C1↔C2 คุยกัน ไม่มี unread ที่ C1 หรือ C2 |

> แนะนำเพิ่ม (ไม่บังคับ): `R7-outsider-ws-frames.png` แท็บ DevTools → WS → Messages ของ C3 ที่ไม่มี frame `private_msg` หรือโชว์สดตอน demo

## R8 — Create group

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R8-create-group.png](R8/R8-create-group.png) | 2026-10-27 | client `localhost:5173` | C1 สร้าง g1 → ห้องเปิดอัตโนมัติ "สมาชิก 1 คน: C1" |
| [R8-other-client-view.png](R8/R8-other-client-view.png) | 2026-10-27 | เหมือนด้านบน | C2 เห็น g1 สมาชิก C1 คนเดียว + "ยังไม่ได้เป็นสมาชิก" (ไม่ถูกเพิ่มเข้าไปเอง) |
| [R8-multiple-groups.png](R8/R8-multiple-groups.png) | 2026-10-27 | เหมือนด้านบน | ⚠️ C1 เป็น**สมาชิก** g1, g2, g3 แต่ g2/g3 สร้างโดย C2/C3 จึงไม่ได้แสดงว่า C1 **สร้าง**หลายกลุ่ม (ยืนยันด้วย test อัตโนมัติแล้ว แนะนำถ่ายใหม่โดยให้ C1 สร้างเองทั้ง 3 กลุ่ม) |
| [R8-empty-group-kept.png](R8/R8-empty-group-kept.png) | 2026-10-27 | เหมือนด้านบน | หลัง C1 ออก: g1 ยังอยู่ "ไม่มีสมาชิก" และ g2 เหลือแค่ C2 |

## R9 — Group list with members

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R9-new-client.png](R9/R9-new-client.png) | 2026-10-27 | client `localhost:5173` | C3 เพิ่ง login เห็น g1 (สร้างโดย C1) และ g2 (สร้างโดย C2) ครบทันที |
| [R9-new-client-join.png](R9/R9-new-client-join.png) | 2026-10-27 | เหมือนด้านบน | C3 join g1 ผ่าน Console → g1 เป็น `2 คน: C1, C3 (คุณ)` |
| [R9-all-groups-c1.png](R9/R9-all-groups-c1.png) | 2026-10-27 | เหมือนด้านบน | C1 เห็นกลุ่มทั้งหมด: g1 ของตัวเอง + g2 ของ C2 ("ยังไม่ได้เป็นสมาชิก") พร้อมรายชื่อสมาชิก |
| [R9-all-groups-c2.png](R9/R9-all-groups-c2.png) | 2026-10-27 | เหมือนด้านบน | C2 เห็นกลุ่มทั้งหมด: g1 ของ C1 (`2 คน: C1, C3`) + g2 ของตัวเอง |
| [R9-member-update.png](R9/R9-member-update.png) | 2026-10-27 | เหมือนด้านบน | C2 หลัง C3 join: g1 อัปเดตเป็น `2 คน: C1, C3` (หน้าจอเดียวกับ all-groups-c2) |

## R10 — Join group by self

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R10-join-button.png](R10/R10-join-button.png) | 2026-10-28 | client `localhost:5173` | C2 เห็น g1 ของ C1 "ยังไม่ได้เป็นสมาชิก" พร้อมปุ่ม "เข้าร่วม" |
| [R10-after-join.png](R10/R10-after-join.png) | 2026-10-28 | เหมือนด้านบน | C2 กดเข้าร่วม → ห้อง `# g1` เปิดอัตโนมัติ "สมาชิก 2 คน: C1, C2" |
| [R10-others-not-added.png](R10/R10-others-not-added.png) | 2026-10-28 | เหมือนด้านบน | C3 ไม่ถูกเพิ่มตามไปด้วย ยังมีปุ่ม "เข้าร่วม" |
| [R10-cannot-add-others.png](R10/R10-cannot-add-others.png) | 2026-10-28 | เหมือนด้านบน | C1 ส่ง `join_group {group:"g1", name:"C3"}` → "เป็นสมาชิกกลุ่ม g1 อยู่แล้ว" และ g1 ยังเป็น `C1, C2` (ผู้สร้างเพิ่มคนอื่นไม่ได้) |

## R11 — Group message

| ไฟล์ | วันที่ | สภาพแวดล้อม | สิ่งที่แสดง |
|---|---|---|---|
| [R11-member-chat-c1.png](R11/R11-member-chat-c1.png), [R11-member-chat-c2.png](R11/R11-member-chat-c2.png) | 2026-10-28 | client `localhost:5173` | C1 กับ C2 (สมาชิก g1) เห็นบทสนทนาเดียวกัน |
| [R11-outsider-c3.png](R11/R11-outsider-c3.png) | 2026-10-28 | เหมือนด้านบน | C3 (ไม่ใช่สมาชิก) ไม่มี unread ที่ g1 |
| [R11-insider-ws-frames.png](R11/R11-insider-ws-frames.png) | 2026-10-28 | เหมือนด้านบน | สมาชิก C2 ได้รับ frame `group_msg` เวลา 00:29:38 และ 00:29:43 |
| [R11-outsider-ws-frames.png](R11/R11-outsider-ws-frames.png) | 2026-10-28 | เหมือนด้านบน | **Only members:** ช่วงเวลาเดียวกัน C3 ได้แค่ `group_list` + ping/pong (`2`/`3`) **ไม่มี `group_msg`** (ดูคู่กับรูปด้านบน) |
| [R11-not-a-member.png](R11/R11-not-a-member.png) | 2026-10-28 | เหมือนด้านบน | C3 ส่ง `group_msg` ผ่าน Console → "ยังไม่ได้เข้ากลุ่มนี้" |
| [R11-joined-later-no-history.png](R11/R11-joined-later-no-history.png) | 2026-10-28 | เหมือนด้านบน | C3 join ทีหลัง → เห็นเฉพาะข้อความใหม่ ไม่เห็นข้อความก่อนหน้า |
| [R11-server-log.png](R11/R11-server-log.png) | 2026-10-28 | เหมือนด้านบน | `[recv] C1 -> group_msg {"group":"g1",...}` |
| [R6-group-room.png](R5_R6/R6-group-room.png) | 2026-10-27 | (ใช้ซ้ำจาก R6) | สมาชิก 3 คนส่งข้อความในห้อง g1 พร้อมชื่อผู้ส่ง |

---

> R2 แนะนำเพิ่ม (ไม่บังคับ): `R2-ws-frames.png` แท็บ **Messages** ที่เห็น frame `42["private_msg",...]` ใช้ประกอบสไลด์อธิบาย packet format
