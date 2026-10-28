# Feature: ping — /ping + ระบบ slash command + Checklist

พิมพ์ `/ping` ในห้องแชท → วัด round-trip time (RTT) ระหว่าง client ↔ server แล้วแสดงผลแบบคำสั่ง `ping` ของ OS
การทำงานทีละขั้นพร้อมลิงก์โค้ด: [HandbookFeatures.md → Feature 3](../../HandbookFeatures.md#feature-3--ping--ระบบ-slash-command)

## คำสั่งที่มี

| คำสั่ง | ทำอะไร |
|---|---|
| `/help` | แสดงคำสั่งทั้งหมด |
| `/ping` | ping server 4 ครั้ง |
| `/ping 10` | ping 10 ครั้ง (จำกัด 1–10) |
| `/ping C2` | ping ผู้ใช้ C2 **ผ่าน server** 4 ครั้ง แยกเวลา you↔server + server↔C2 |
| `/ping C2 10` | ping C2 10 ครั้ง |
| `/ping @10` | ping ผู้ใช้ที่ชื่อเป็นตัวเลขล้วน (เช่น `10`) |
| `//text` | ส่งข้อความ `/text` เป็นแชทปกติ (ไม่ใช่คำสั่ง) |

ผลของคำสั่ง**เห็นเฉพาะคนที่สั่ง** ไม่ถูกส่งให้คนอื่นในห้อง
(ยกเว้น `/ping <ชื่อ>`: ปลายทางเห็นบรรทัด `C1 is pinging you` ในห้อง private กับคนสั่ง 1 ครั้งต่อรอบ)

## ทดสอบด้วยมือ

แนะนำแบบ port เดียว (`npm run build && npm start` ที่ root) แล้วเปิดจาก 2 เครื่อง

- [ ] เปิดห้องไหนก็ได้ → ช่องพิมพ์ขึ้น `type a message, or /help for commands`
- [ ] พิมพ์ `/help` → เห็นรายการคำสั่งเป็นบรรทัดสีเทา (มี `/ping [name] [1-10]`) และ**อีกฝ่ายไม่เห็นอะไรเลย**
- [ ] พิมพ์ `/ping` **บนเครื่องที่รัน server** → RTT ต่ำมาก (ประมาณ < 2 ms)
- [ ] พิมพ์ `/ping` **บนอีกเครื่อง (ผ่าน Wi-Fi)** → RTT สูงกว่าให้เห็น (ประมาณหลาย ms ถึงหลายสิบ ms) และ `via websocket`
- [ ] บรรทัดสรุปมี `4 sent, 4 received, 0% loss · min/avg/max = … · server uptime … · N online`
- [ ] `/ping 10` → ส่ง 10 ครั้ง / `/ping 50` → จำกัดที่ 10
- [ ] ระหว่าง `/ping 10` ให้กด `Ctrl+C` หยุด server → ครั้งที่เหลือขึ้น `request timeout` และ loss > 0% (แล้วหน้าเว็บจะกลับไปหน้า login ตาม R4)
- [ ] **`/ping C2`** (C1 อยู่บนคอม, C2 อยู่บนอีกเครื่อง/มือถือ) → `reply from C2: seq=1 time=… ms (you↔server … + server↔C2 …)`
- [ ] ฝั่ง C2: ห้อง `@C1` ขึ้น `[1]` และมีบรรทัดสีเทา `C1 is pinging you (/ping C1 to ping back)` **ครั้งเดียว** ไม่ใช่ทุก seq
- [ ] ถ้า C2 อยู่บนมือถือ 4G: ช่วง `server↔C2` สูงกว่า `you↔server` ให้เห็น (รู้ว่าช้าที่ฝั่งไหน)
- [ ] C3 (คนอื่น) ไม่เห็นอะไรเลย
- [ ] `/ping Nobody` → `error: Nobody is not online` / `/ping C1` (ชื่อตัวเอง) → `error: cannot ping yourself …`
- [ ] ระหว่าง `/ping C2 10` ให้ C2 ปิดแท็บ → ครั้งที่เหลือขึ้น `request timeout … (C2 did not answer)` หรือ `C2 is not online`
- [ ] `/abc` → `unknown command: /abc — type /help` และไม่มีอะไรส่งออกไป
- [ ] `//hello` → อีกฝ่ายได้ข้อความ `/hello` ตามปกติ
- [ ] DevTools → Network → WS → Messages ระหว่าง `/ping`: เห็นคู่ frame
      `↑ 42<id>["ping_check",{"seq":1}]` กับ `↓ 43<id>[{"seq":1,…}]`
      (`2` = EVENT, `3` = **ACK** และเลข `<id>` เดียวกันคือการจับคู่คำขอกับคำตอบ)
- [ ] terminal ของ server เห็น `[recv] C1 -> ping_check {"seq":1}`

เก็บหลักฐานที่ `docs/evidence/features/ping/`:
- `ping-lan.png` — `/ping` จากอีกเครื่องผ่าน Wi-Fi พร้อมบรรทัดสรุป
- `ping-help.png` — `/help` (และให้เห็นว่าอีกฝ่ายไม่เห็น)
- `ping-user.png` — `/ping C2` (ฝั่ง C1 เห็นเวลาแยกช่วง) คู่กับจอ C2 ที่ขึ้น `C1 is pinging you`
- `ping-ws-ack.png` — DevTools ที่เห็นคู่ frame `42<id>[...]` / `43<id>[...]`

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f03`

ผ่าน 26/26: **`/ping`** — ยังไม่ register → ไม่ได้ ack (timeout) + `NOT_REGISTERED`, ack ส่ง `seq` กลับมาตรงกัน, ack มี `serverTime` / `uptimeSec` / `online`,
RTT บน localhost < 500 ms, `seq` ไม่ถูกต้อง → `null`, ส่งพร้อมกันหลายอันแล้ว ack จับคู่ถูก, emit แบบไม่มี ack แล้ว server ไม่ crash,
**`/ping <ชื่อ>`** — ack มี `legMs`, ปลายทางได้ probe ที่มีชื่อผู้ส่ง**จริง** (ปลอม `from` ไม่ได้), แจ้งปลายทางครั้งเดียว, คนนอกไม่ได้ probe,
`USER_NOT_FOUND`, `SELF`, ปลายทางไม่ตอบ → `TIMEOUT` ภายใน ~2 วินาที, ผู้สั่งยังไม่ register → ไม่ได้ ack + ปลายทางไม่ถูก probe /
**client** — แยกคำสั่ง (`/ping`, `/PING 10`, `//hello`, ข้อความปกติ), แยก argument ของ ping (server / จำนวน / ชื่อ / ชื่อ+จำนวน / `@ตัวเลข`), สรุปผล min/avg/max/loss, ทุกครั้งหาย, จำนวนครั้ง default/จำกัด, รูปแบบ uptime
