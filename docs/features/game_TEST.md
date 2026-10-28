# Feature: game — เกมเป่ายิ้งฉุบ (RPS) + Checklist

เล่นเป่ายิ้งฉุบกับผู้ใช้อีกคนผ่าน socket **server เป็นคนตัดสิน** และ**ซ่อนคำตอบจนเลือกครบ 2 คน**
การทำงานทีละขั้นพร้อมลิงก์โค้ด: [HandbookFeatures.md → Feature 4](../../HandbookFeatures.md#feature-4--เกมเป่ายิ้งฉุบ-rps)

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `/play rps <ชื่อ> [1\|3\|5]` | ท้าเล่น best of 1 / 3 / 5 (ไม่ใส่ = 3) |
| `/accept` / `/decline` | ตอบรับ / ปฏิเสธคำท้า (เฉพาะคนถูกท้า) |
| `/move rock` (`paper`, `scissors` หรือ `r` `p` `s`) | เลือก — อีกฝ่ายเห็นแค่ว่า "เลือกแล้ว" |
| `/quit` | ออกจากเกม (อีกฝ่ายชนะ) / ยกเลิกคำท้า |

ข้อความของเกมแสดงใน**ห้อง private ของผู้เล่น 2 คน** (`@คู่แข่ง`) พิมพ์คำสั่งจากห้องไหนก็ได้

## ทดสอบด้วยมือ

แนะนำแบบ port เดียว (`npm run build && npm start`) แล้วเปิด C1, C2, C3 (คนละเครื่องหรือคนละแท็บ)

- [ ] C1 `/play rps C2` → ห้อง `@C2` ของ C1: `challenge sent to C2 …` / ห้อง `@C1` ของ C2 ขึ้น `[1]` + `C1 challenged you … /accept or /decline`
- [ ] C2 `/accept` → ทั้งคู่: `game on! …` + `round 1 · choose: …`
- [ ] C1 `/move rock` → C1: `you chose rock (hidden …)` + `waiting for C2...` / C2: `C1 has chosen · your move: …`
- [ ] **ซ่อนคำตอบ**: เปิด DevTools → WS → Messages ของ **C2** ตอนที่ C1 เลือกแล้ว → frame `game_update` มีแค่ `"moved":["C1"]` **ไม่มีคำว่า rock**
- [ ] C2 `/move s` → ทั้งคู่: `round 1: C1 ✊ rock vs C2 ✌️ scissors → …` + score
- [ ] เลือกเหมือนกัน → `draw` คะแนนไม่เปลี่ยน
- [ ] เล่นจนมีคนชนะ 2 รอบ → `🏆 … wins the game!` ทั้งสองจอ
- [ ] **C3 ไม่เห็นอะไรเกี่ยวกับเกมเลย** (และ DevTools ของ C3 ไม่มี frame `game_update`)
- [ ] กรณีผิด: `/move x` → `invalid move` / เลือกซ้ำ → `you already chose this round` / `/play rps C3` ระหว่างเล่น → `you are already in a game` / C3 `/play rps C1` → `C1 is already in a game` / `/play rps C1` (ตัวเอง) → `you cannot challenge yourself`
- [ ] `/decline` → อีกฝ่ายเห็น `… declined your challenge`
- [ ] ระหว่างเล่น C2 `/quit` → C1: `C2 left the game — you win by forfeit`
- [ ] ระหว่างเล่น C2 ปิดแท็บ → C1: `C2 disconnected — game over`
- [ ] ท้าแล้วไม่ตอบ 60 วินาที → ทั้งคู่: `challenge expired`

เก็บหลักฐานที่ `docs/evidence/features/game/`:
- `game-full-match.png` — C1 กับ C2 เทียบกัน เล่นจนจบเกม
- `game-hidden-move.png` — จอ C2 ตอนที่ C1 เลือกแล้ว (เห็นแค่ `C1 has chosen`)
- `game-ws-frames.png` — DevTools ของ C2: `game_update` ที่มี `"moved":["C1"]` แต่ไม่มีคำตอบ
- `game-outsider.png` — จอ C3 ที่ไม่เห็นอะไรเกี่ยวกับเกม

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f04` (`run-all.mjs` ตั้งให้คำท้าหมดอายุใน 1.5 วินาที แทน 60 วินาที)

ผ่าน 31/31: กติกา (`rpsWinner`, เสมอ, alias `r/p/s`), ท้าตัวเอง / คนที่ไม่ออนไลน์ / เกมที่ไม่รู้จัก, ทั้งคู่ได้ `challenge`,
ติดเกมอยู่ท้าใหม่ไม่ได้ (`YOU_ARE_BUSY` / `OPPONENT_BUSY`), เลือกก่อนตอบรับไม่ได้, **คนท้าตอบรับแทนไม่ได้**, คนนอกแตะเกมไม่ได้,
**คำตอบของคนแรกไม่อยู่ใน update ใด ๆ ของอีกฝ่าย**, เลือกซ้ำ / move ผิด, เปิดคำตอบ + คะแนนถูก, เสมอไม่นับ, best of 3 จบที่ 2 แต้ม,
**คนนอกไม่ได้รับ `game_update` เลย**, decline, quit, ผู้เล่นหลุด → abandoned, ไม่ตอบ → expired,
ข้อความของแต่ละมุมมอง (คำท้า / รอ / ลำดับชื่อคงที่ / "you win")
