# Feature: discord — Discord bridge + Checklist

กลุ่ม `#discord` ในแอป ↔ channel หนึ่งใน Discord server จริง การทำงานทีละขั้นพร้อมลิงก์โค้ด: [HandbookFeatures.md → Feature 2](../../HandbookFeatures.md#feature-2--discord-bridge)

## 1. สร้าง Discord bot (ทำครั้งเดียว)

1. เข้า [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** → ตั้งชื่อ เช่น `simple-chat-bridge`
2. เมนู **Bot**:
   - **Reset Token** → copy เก็บไว้ (**ห้ามแชร์ / ห้าม commit** ถ้าหลุดให้ Reset ใหม่ทันที)
   - เปิด **MESSAGE CONTENT INTENT** (Privileged Gateway Intents) → Save — ถ้าไม่เปิด bot จะอ่านข้อความใน channel ไม่ได้
3. เมนู **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `View Channels`, `Send Messages`, `Read Message History`
   - copy URL ด้านล่าง → เปิดใน browser → เลือก Discord server ของทีม → Authorize
4. หา **Channel ID** (ตัวเลข 17–20 หลัก) ของ channel ที่จะ bridge ทำได้ 2 วิธี:
   - **ง่ายสุด (ดูจาก URL):** เปิด Discord ใน browser (https://discord.com/app) → คลิกเข้า channel → ดู address bar
     `https://discord.com/channels/<server id>/<channel id>` → **ตัวเลขชุดสุดท้ายคือ Channel ID**
   - **Developer Mode:** ⚙️ (User Settings มุมซ้ายล่างข้างชื่อ) → หมวด **App Settings** → **Advanced** → เปิด **Developer Mode**
     → คลิกขวาที่ channel (มือถือ: กดค้าง) → **Copy Channel ID**

## 2. ตั้งค่า

**บนเครื่อง**: คัดลอก `server/.env.example` เป็น `server/.env` แล้วใส่

```
DISCORD_BOT_TOKEN=<token จากข้อ 1.2>
DISCORD_CHANNEL_ID=<id จากข้อ 1.4>
DISCORD_GROUP=discord
```

**บน Render**: Dashboard → service → **Environment** → เพิ่ม 3 ตัวเดียวกัน → Save (Render จะ deploy ใหม่ให้)

เริ่ม server แล้วต้องเห็นใน log:
```
Features: cloud, discord (#discord <-> channel 1234567890)
[discord] logged in as simple-chat-bridge#1234, bridging #discord <-> #general
```

| log | สาเหตุ | แก้ |
|---|---|---|
| `discord (off: set DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID)` | ไม่ได้ตั้ง env | ตรวจ `server/.env` / Environment บน Render |
| `login failed: An invalid token was provided.` | token ผิด / ถูก reset | Reset Token ใหม่แล้วใส่อีกครั้ง |
| `login failed: Used disallowed intents` | ไม่ได้เปิด MESSAGE CONTENT INTENT | ข้อ 1.2 |
| `cannot open channel ...: Missing Access` | bot ไม่ได้อยู่ใน server / ไม่มีสิทธิ์ดู channel | ข้อ 1.3 / ตั้ง permission ของ channel |
| ข้อความจาก Discord มาแต่เป็นข้อความว่าง | ไม่ได้เปิด MESSAGE CONTENT INTENT | ข้อ 1.2 |

## 3. ทดสอบด้วยมือ

เปิดแอป (บนเครื่องหรือ Cloud) login `C1`, `C2` และเปิด Discord channel ไว้ข้าง ๆ

- [ ] sidebar มีกลุ่ม `#discord ⇄ discord` (0 members) พร้อมปุ่ม `[join]`
- [ ] C1 กด `[join]` → หัวห้องขึ้น `… · bridged to Discord #general`
- [ ] **แอป → Discord:** C1 พิมพ์ `hello from app` → ใน Discord ขึ้น `**C1**: hello from app` (โดย bot)
- [ ] **Discord → แอป:** พิมพ์ใน Discord `hello from discord` → ในแอปขึ้น `[hh:mm] <ชื่อใน Discord> [discord]: hello from discord` (ชื่อสี blurple)
- [ ] C2 **ยังไม่ join** → ไม่ได้รับข้อความของ `#discord` เลย (R11)
- [ ] ส่งรูปใน Discord → ในแอปขึ้นเป็น URL ของรูป
- [ ] พิมพ์ `@everyone test` ในแอป → ใน Discord **ไม่มีใครถูก ping**
- [ ] ตั้งชื่อใน Discord ให้ตรงกับ `C1` แล้วพิมพ์ → ในแอปขึ้นเป็น `C1 [discord]` สี blurple ไม่ได้แสดงเป็นข้อความของ C1 (ปลอมตัวไม่ได้)
- [ ] ข้อความที่ bot โพสต์ใน Discord **ไม่**ย้อนกลับมาในแอปซ้ำ (ไม่วนลูป)
- [ ] private message และกลุ่มอื่นใน Discord **ไม่**มีอะไรโผล่ขึ้นมา

เก็บหลักฐานที่ `docs/evidence/features/discord/`:
- `discord-app-to-discord.png` — แอป (ซ้าย) + Discord (ขวา) ข้อความจากแอปขึ้นใน Discord
- `discord-discord-to-app.png` — ข้อความจาก Discord ขึ้นในแอปพร้อมป้าย `[discord]`
- `discord-server-log.png` — log `[discord] logged in …`, `out ->`, `in  <-`
- `discord-non-member.png` — C2 ที่ไม่ได้ join ไม่เห็นข้อความ

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f02` (ไม่ต่อ Discord จริง — `run-all.mjs` ตั้ง `NODE_ENV=test` และล้าง token ให้)

ผ่าน 14/14: ขาออก `**from**: text` + escape markdown ในชื่อ / ขาเข้า: payload `group_msg` ที่มี `source: "discord"`, ใช้ nickname ก่อน global name,
**ข้ามข้อความจาก bot (กันวนลูป)**, ข้ามข้อความว่าง, แนบ URL ของไฟล์, ไฟล์อย่างเดียวก็ส่งได้, ตัดที่ 1000 ตัวอักษร /
ไม่มี token → feature ปิดเอง, ไม่สร้างกลุ่ม `#discord`, ไม่ส่ง `bridge_info`, `group_msg` ของ core ยังทำงาน

ทดสอบเพิ่มด้วยมือ (AI รันแล้ว): server ที่ตั้ง token ปลอม → log `login failed` แต่ไม่ crash, มีกลุ่ม `#discord`, ส่ง `bridge_info`, join + ส่งข้อความในกลุ่มได้
