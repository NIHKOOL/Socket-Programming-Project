# docs/features — Checklist ทดสอบของ Feature เสริม (Part 3)

1 feature = 1 ไฟล์ `<ชื่อ>_TEST.md` ใช้รูปแบบเดียวกับ checklist ของ core (`docs/R*_TEST.md`):
การทำงาน → ทดสอบด้วยมือ (checkbox) → รูปที่ต้องเก็บ → ทดสอบอัตโนมัติ (`cd server && npm test -- features/<ชื่อ>`)

| Feature | Checklist | หลักฐาน |
|---|---|---|
| เกมทายคำ AI (`guess` + `bot`, AI bot ใน `ai-bot/`) | [guess_TEST.md](guess_TEST.md) (มีขั้นตอนตั้ง bot + สร้าง API key) | [evidence/features/guess/](../evidence/features/README.md#guess) |
| เกม RPS (`game`) | [game_TEST.md](game_TEST.md) | [evidence/features/game/](../evidence/features/README.md#game) |
| /ping (`ping`) | [ping_TEST.md](ping_TEST.md) | [evidence/features/ping/](../evidence/features/README.md#ping) |
| Discord bridge (`discord`) | [discord_TEST.md](discord_TEST.md) (มีขั้นตอนสร้าง bot) | [evidence/features/discord/](../evidence/features/README.md#discord) |
| Cloud (`cloud`) | [cloud_TEST.md](cloud_TEST.md) (มีขั้นตอน deploy บน Railway) | [evidence/features/cloud/](../evidence/features/README.md#cloud) |

คำอธิบายการทำงานพร้อมลิงก์ไปที่โค้ดอยู่ใน [HandbookFeatures.md](../../HandbookFeatures.md)
