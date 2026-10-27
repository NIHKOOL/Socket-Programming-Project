# R1 — Checklist ทดสอบข้ามเครื่อง

เป้าหมาย: Client อย่างน้อย 2 ตัว รันบน**คอมพิวเตอร์คนละเครื่อง** และเชื่อมต่อ Server ได้

## Setup ที่ใช้ได้

โจทย์: "at least two clients, each running on a different physical computer. **The server may run on one of these computers** or on a third one."

ถ้ามีคอมแค่ 2 เครื่อง ให้ server อยู่ร่วมเครื่องกับ client ตัวหนึ่ง:

```
เครื่อง A (เช่น 192.168.1.56)              เครื่อง B (เช่น 192.168.1.36)
├─ Terminal 1: cd server && npm start      └─ browser: Client C1
└─ browser: Client C2                         Server URL = http://192.168.1.56:3000
   Server URL = http://192.168.1.56:3000  ← ใช้ IP จริง ไม่ใช้ localhost
```

- "client" คือ **browser** ที่เปิดแอป เครื่อง A จะรัน `cd client && npm run dev` เองใน terminal อีกอัน หรือเปิดหน้าเว็บจากเครื่อง B (`http://192.168.1.36:5173`) ก็ได้
- ที่เครื่อง A ใช้ IP จริงแทน `localhost` เพื่อให้ log ของ server ขึ้น IP ของ C2 ต่างจาก C1 ชัดเจน

## เตรียม

- [ ] ทุกเครื่องต่อ Wi-Fi / LAN / Hotspot **วงเดียวกัน**
- [ ] ทุกเครื่องมี Node.js ≥ 20 และรัน `npm install` ใน `server/` กับ `client/` แล้ว

## เครื่อง Server

- [ ] `cd server && npm start`
- [ ] จด URL ที่ server พิมพ์ออกมา เช่น `http://192.168.1.23:3000`
      (ถ้ามีหลายบรรทัด ให้เลือก IP ของ interface ที่ต่อวงเดียวกับเครื่องอื่น ปกติขึ้นต้นด้วย `192.168.` หรือ `10.` หรือ `172.`)
- [ ] เปิด firewall (PowerShell แบบ **Run as Administrator**) ทำครั้งเดียว:
      ```powershell
      New-NetFirewallRule -DisplayName "Chat Server 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
      ```
      ถ้าจะให้เครื่องอื่นเปิดหน้าเว็บ client จากเครื่องนี้ ให้เปิด port 5173 ด้วยแบบเดียวกัน
      หรือกด **Allow access** ตอน Windows ถามครั้งแรกที่รัน node (ติ๊กทั้ง Private และ Public)

## เครื่อง Client (ทำทุกเครื่อง)

- [ ] เช็กว่าต่อ server ได้ก่อน: เปิด browser ไปที่ `http://<server IP>:3000/socket.io/?EIO=4&transport=polling`
      → ถ้าขึ้นข้อความที่ขึ้นต้นด้วย `0{"sid":...` แปลว่าต่อถึง server แล้ว
- [ ] `cd client && npm run dev` → เปิด `http://localhost:5173`
- [ ] ใส่ Server URL = `http://<server IP>:3000` แล้วใส่ชื่อ (ห้ามซ้ำกัน)

## ผลที่ต้องเห็น

- [ ] ทุกเครื่องเห็นรายชื่อออนไลน์ครบทุกคน รวมถึงตัวเอง
- [ ] Terminal ของ server แสดง `[connect] ... from <IP ของแต่ละเครื่อง>` ซึ่งต้องเป็น IP คนละตัวกัน (ใช้ยืนยันกับอาจารย์ว่าต่อมาจากคนละเครื่องจริง)
- [ ] ปิด browser ที่เครื่องหนึ่ง แล้วชื่อหายจากรายชื่อของเครื่องอื่น

## แก้ปัญหา

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| ขึ้น "เชื่อมต่อ ... ไม่ได้" | firewall บล็อก / IP ผิด | ทำขั้นตอน firewall, เช็ก IP ด้วย `ipconfig` |
| ping ถึง แต่ต่อ port 3000 ไม่ได้ | firewall | เปิด port 3000 |
| ping ไม่ถึงเลย | Wi-Fi มหาลัยกั้นเครื่องในวงเดียวกันไม่ให้คุยกัน (client isolation) | ใช้ Mobile Hotspot จากมือถือ |
| เครื่องเดียวกันต่อได้ แต่เครื่องอื่นต่อไม่ได้ | server ไม่ได้ listen `0.0.0.0` / firewall | เช็ก `server/index.js` และ firewall |

## หลักฐานสำหรับ demo

เก็บไว้ที่ `docs/evidence/R1/` และเพิ่มแถวใน [evidence/README.md](evidence/README.md)

- [x] หน้าจอ client 2 ตัวเห็นรายชื่อตรงกัน (ทดสอบบนเครื่องเดียว): `R1-C1.png`, `R1-C2.png`
- [x] ทดสอบ client 2 ตัวบนคอมคนละเครื่องผ่านแล้ว (2026-10-28) ทีมตัดสินใจไม่เก็บ `R1-server-log.png` / `R1-machines.jpg` ให้โชว์สดตอน demo แทน
