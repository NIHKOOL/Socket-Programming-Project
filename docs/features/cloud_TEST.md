# Feature: cloud — Deploy บน Cloud + Checklist

> โจทย์: "Cloud-based deployment is allowed but optional and will be marked as one special point."

## การทำงาน

```
มือถือ (4G) / คอมที่ไหนก็ได้
   │  https://simple-chat-xxxx.onrender.com           ← TLS (HTTPS) จาก Cloud
   ▼
Reverse proxy ของ Render  (ถอด TLS, ใส่ header X-Forwarded-For = IP จริงของ client)
   │  http://<container>:$PORT
   ▼
server/index.js  (process เดียว)
   ├─ GET /, /assets/*         → Feature: cloud เสิร์ฟไฟล์จาก client/dist
   ├─ GET /socket.io/?…        → Socket.IO handshake → 101 → WebSocket (wss:// ฝั่ง browser)
   └─ path อื่น เช่น /messages  → 404 (R2 ยังเป็นจริง)
```

- **URL เดียว** ทั้งหน้าเว็บและ socket → client ใช้ `window.location.origin` เป็น Server URL ไม่ต้องตั้ง CORS
- เพราะหน้าเว็บเป็น `https://` → Socket.IO ต่อด้วย `wss://` (WebSocket over TLS) อัตโนมัติ
- Cloud ส่ง port มาทาง env `PORT` → server อ่านอยู่แล้ว (`process.env.PORT`)

## ทดสอบโหมด Cloud บนเครื่องตัวเองก่อน

```bash
# ที่ root ของโปรเจกต์
npm run build      # ติดตั้ง dependency ของ server + client แล้ว build client → client/dist
npm start          # server ตัวเดียวที่ port 3000 เสิร์ฟทั้งหน้าเว็บและ socket
```

- [ ] terminal ขึ้น `Features: cloud` (ถ้าขึ้น `cloud (client/dist not built)` แปลว่ายังไม่ได้ build)
- [ ] เปิด `http://localhost:3000` → เห็นหน้า login และช่อง `server>` เป็น `http://localhost:3000` เอง
- [ ] มือถือต่อ Wi-Fi เดียวกัน เปิด `http://<IP คอม>:3000` → login แล้วคุยกับคอมได้ (ไม่ต้องเปิด port 5173)
- [ ] `http://localhost:3000/messages` → `This server only accepts Socket.IO connections.` (R2)

## Deploy บน Render (ทีมทำเอง)

ต้องมี: บัญชี GitHub ที่มีโปรเจกต์นี้อยู่ (private ได้) และสมัคร [Render](https://render.com) ด้วย GitHub

1. **ตรวจก่อน push**: `git status` ต้องไม่มี `.env`, `node_modules/`, `client/dist/` (ถูก `.gitignore` ไว้แล้ว) → push ขึ้น GitHub
2. Render Dashboard → **New +** → **Web Service** → เชื่อม GitHub → เลือก repo นี้
3. ตั้งค่า:

   | ช่อง | ค่า |
   |---|---|
   | Name | เช่น `simple-chat` (จะเป็นส่วนหนึ่งของ URL) |
   | Region | **Singapore** (ใกล้ไทยที่สุด latency ต่ำ) |
   | Branch | `main` |
   | Root Directory | _(เว้นว่าง — ใช้ root ของ repo)_ |
   | Runtime | Node |
   | Build Command | `npm run build` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

4. กด **Create Web Service** → รอ log ขึ้น `Chat server listening on port ...` และ `Features: cloud` → สถานะ **Live**
5. ได้ URL เช่น `https://simple-chat-xxxx.onrender.com`
6. หลังจากนี้ทุกครั้งที่ push ไป branch `main` Render จะ build + deploy ใหม่ให้อัตโนมัติ

**ถ้า deploy ไม่ผ่าน**: ดูแท็บ **Logs** ใน Render — มักเป็น build error (ลองรัน `npm run build` บนเครื่องให้ผ่านก่อน) หรือ Node เวอร์ชันต่ำกว่า 20 (ตั้ง env `NODE_VERSION=20` ใน Render)

## ทดสอบบน Cloud

- [ ] คอม: เปิด URL → login `C1`
- [ ] **มือถือ: ปิด Wi-Fi ใช้ 4G/5G** → เปิด URL → login `C2` → เห็นกันในรายชื่อออนไลน์
- [ ] C1 ↔ C2 คุย private + สร้างกลุ่ม / join / คุยในกลุ่มได้ (R3–R11 ทำงานบน Cloud)
- [ ] DevTools (คอม) → Network → WS → Headers: `Request URL: wss://…/socket.io/?EIO=4&transport=websocket` และ `101 Switching Protocols`
- [ ] Render → Logs: เห็น `[cloud] … real client IP: <IP ของมือถือ>` (ไม่ใช่ IP ของ proxy)
- [ ] `https://<url>/messages` → 404 (R2)

เก็บหลักฐานที่ `docs/evidence/features/cloud/`:
- `cloud-render-live.png` — หน้า Render ที่สถานะ Live + URL
- `cloud-phone-4g.jpg` — มือถือ (เห็นว่าใช้ 4G) คุยกับคอม
- `cloud-wss.png` — DevTools ที่เห็น `wss://` + `101 Switching Protocols`
- `cloud-render-logs.png` — log ที่เห็น `Features: cloud` และ `real client IP`

## ข้อจำกัดของ Render Free (บอกอาจารย์ได้)

- ไม่มีคนใช้ ~15 นาที → server หลับ คนแรกที่เข้าต้องรอ ~30–60 วินาที → **ก่อน demo เปิดเว็บทิ้งไว้**
- state อยู่ใน memory → server หลับ/deploy ใหม่ = รายชื่อกลุ่มหายหมด
- มือถือพับจอ/สลับแอป → browser อาจตัด WebSocket → กลับไปหน้า login (เพราะปิด auto-reconnect ตั้งแต่ R4)

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f01` (ถ้ายังไม่ได้ build client ข้อที่เกี่ยวกับการเสิร์ฟหน้าเว็บจะ SKIP)

ผ่าน 13/13: `/messages` → 404 (R2), `POST /` → 404, path traversal 4 แบบ (`../`, `%2f`, `%2e%2e`, `/assets/../..`) → 404 ไม่รั่วไฟล์ server,
URL encode ผิดรูปแบบ → 404 ไม่ crash, `GET /` → index.html, `GET /assets/*.js` → JavaScript, `HEAD /` → ไม่มี body,
Socket.IO ยังทำงานพร้อมกับการเสิร์ฟหน้าเว็บ, `realClientIp` อ่าน `X-Forwarded-For` ตัวแรก / ไม่มี proxy ใช้ IP ของ socket
