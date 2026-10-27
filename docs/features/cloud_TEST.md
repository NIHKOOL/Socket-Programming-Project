# Feature: cloud — Deploy บน Cloud (Railway) + Checklist

> โจทย์: "Cloud-based deployment is allowed but optional and will be marked as one special point."

> **⏸ พักไว้ (2026-10-28):** Render deploy ได้ แต่ Discord bot login ไม่ได้บน Render (ยืนยันแล้วว่าบนเครื่องใช้ได้ จึงเป็นที่ host) และ Railway ใช้ไม่ได้
> โค้ดยังอยู่ ถ้ากลับมาทำต่อ ให้เลือก host ใหม่ (เช่น Fly.io / Azure for Students / VM) และตั้งค่า build `npm run build` / start `npm start`
> **ถ้า service บน Render ยังรันอยู่ ให้ลบ `DISCORD_BOT_TOKEN` ออก** ไม่อย่างนั้นวันไหนที่ต่อติดจะมี bot 2 ตัวส่งข้อความซ้ำกับเครื่องที่รันอยู่

**Host ที่ลองแล้ว: [Railway](https://railway.com)** (เดิมใช้ Render แต่ bot ของ Feature discord login ค้างบน Render ซึ่งน่าจะเป็นเพราะ Discord จำกัด IP ที่ใช้ร่วมกันของ Render แบบฟรี
ดู [ย้ายจาก Render](#ย้ายจาก-render) ด้านล่าง)

## การทำงาน

```
มือถือ (4G) / คอมที่ไหนก็ได้
   │  https://simple-chat-xxxx.up.railway.app         ← TLS (HTTPS) จาก Cloud
   ▼
Edge proxy ของ Railway  (ถอด TLS, ใส่ header X-Forwarded-For = IP จริงของ client)
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
- คำสั่ง build / start: `npm run build` / `npm start` (ที่ root)

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

## Deploy บน Railway (ทีมทำเอง)

ต้องมี: บัญชี GitHub ที่มีโปรเจกต์นี้อยู่ (private ได้) และสมัคร [Railway](https://railway.com) ด้วย GitHub
(Railway คิดค่าใช้จ่ายตามการใช้งาน บัญชีใหม่มีเครดิตทดลองให้ **ตรวจเงื่อนไขและราคา ณ ตอนสมัคร** และตั้ง usage limit ไว้กันค่าใช้จ่ายเกิน)

1. **ตรวจก่อน push**: `git status` ต้องไม่มี `.env`, `node_modules/`, `client/dist/` (ถูก `.gitignore` ไว้แล้ว) → push ขึ้น GitHub
2. Railway Dashboard → **New Project** → **Deploy from GitHub repo** → เลือก repo นี้ → Settings → Build Command `npm run build` / Start Command `npm start`
   (ครั้งแรกต้องกด Configure GitHub App ให้ Railway เข้าถึง repo)
3. คลิกที่ service ที่สร้างขึ้น → แท็บ **Variables** → เพิ่ม (ถ้าใช้ Feature discord):

   | Variable | ค่า |
   |---|---|
   | `DISCORD_BOT_TOKEN` | token ของ bot |
   | `DISCORD_CHANNEL_ID` | id ของ channel |
   | `DISCORD_GROUP` | `discord` |

   ไม่ต้องตั้ง `PORT` เพราะ Railway ใส่ให้เอง
4. แท็บ **Settings**:
   - **Region**: เลือก Southeast Asia (Singapore) ใกล้ไทยที่สุด latency ต่ำ
   - **Networking → Public Networking → Generate Domain** → ได้ URL เช่น `https://simple-chat-xxxx.up.railway.app`
     (ถ้าถามพอร์ต ให้ใส่เลขเดียวกับใน log `Chat server listening on port ...`)
5. แท็บ **Deployments** → รอสถานะ **Active** → **View Logs** ต้องเห็น
   ```
   Chat server listening on port ...
   Features: cloud, discord (#discord <-> channel ...)
   [discord] logged in as ...        ← ถ้าตั้ง Discord ไว้
   ```
6. หลังจากนี้ทุกครั้งที่ push ไป branch `main` Railway จะ build + deploy ใหม่ให้อัตโนมัติ

**ถ้า deploy ไม่ผ่าน**: ดู **Build Logs** — มักเป็น build error (ลองรัน `npm run build` บนเครื่องให้ผ่านก่อน)
ถ้า healthcheck ไม่ผ่าน (`/` ต้องตอบ 200): แปลว่า `client/dist` ไม่ถูก build → ดูว่า build log มี `vite build` + `built in ...`

## ย้ายจาก Render

- [ ] **ลบ `DISCORD_BOT_TOKEN` ออกจาก Environment ของ Render** หรือ Suspend / ลบ service ทิ้ง
      ถ้ามีทั้ง 2 ที่และ Render กลับมาต่อ Discord ได้เมื่อไร จะมี bot 2 ตัวส่งข้อความซ้ำกัน
- [ ] ใช้ URL ของ Railway ในสไลด์ / QR code ตอน demo

## ทดสอบบน Cloud

- [ ] คอม: เปิด URL → login `C1`
- [ ] **มือถือ: ปิด Wi-Fi ใช้ 4G/5G** → เปิด URL → login `C2` → เห็นกันในรายชื่อออนไลน์
- [ ] C1 ↔ C2 คุย private + สร้างกลุ่ม / join / คุยในกลุ่มได้ (R3–R11 ทำงานบน Cloud)
- [ ] DevTools (คอม) → Network → WS → Headers: `Request URL: wss://…/socket.io/?EIO=4&transport=websocket` และ `101 Switching Protocols`
- [ ] Railway → Logs: เห็น `[cloud] … real client IP: <IP ของมือถือ>` (ไม่ใช่ IP ของ proxy)
- [ ] `https://<url>/messages` → 404 (R2)

เก็บหลักฐานที่ `docs/evidence/features/cloud/`:
- `cloud-railway-active.png` — หน้า Railway ที่ deployment สถานะ Active + URL
- `cloud-phone-4g.jpg` — มือถือ (เห็นว่าใช้ 4G) คุยกับคอม
- `cloud-wss.png` — DevTools ที่เห็น `wss://` + `101 Switching Protocols`
- `cloud-railway-logs.png` — log ที่เห็น `Features: cloud` และ `real client IP`

## ข้อจำกัด (บอกอาจารย์ได้)

- state อยู่ใน memory → deploy ใหม่ / restart = รายชื่อกลุ่มหายหมด
- มือถือพับจอ/สลับแอป → browser อาจตัด WebSocket → กลับไปหน้า login (เพราะปิด auto-reconnect ตั้งแต่ R4)
- Railway ไม่หลับเหมือน Render แบบฟรี (ไม่ต้องรอ cold start) แต่**ใช้เครดิตตลอดเวลาที่รัน** ถ้าไม่ใช้นานให้ปิด service ไว้

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f01` (ถ้ายังไม่ได้ build client ข้อที่เกี่ยวกับการเสิร์ฟหน้าเว็บจะ SKIP)

ผ่าน 13/13: `/messages` → 404 (R2), `POST /` → 404, path traversal 4 แบบ (`../`, `%2f`, `%2e%2e`, `/assets/../..`) → 404 ไม่รั่วไฟล์ server,
URL encode ผิดรูปแบบ → 404 ไม่ crash, `GET /` → index.html, `GET /assets/*.js` → JavaScript, `HEAD /` → ไม่มี body,
Socket.IO ยังทำงานพร้อมกับการเสิร์ฟหน้าเว็บ, `realClientIp` อ่าน `X-Forwarded-For` ตัวแรก / ไม่มี proxy ใช้ IP ของ socket
