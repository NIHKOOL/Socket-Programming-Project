# docs/features — Checklist ทดสอบของ Feature เสริม (Part 3)

1 feature = 1 ไฟล์ `<ชื่อ>_TEST.md` ใช้รูปแบบเดียวกับ checklist ของ core (`docs/R*_TEST.md`):
การทำงาน → ทดสอบด้วยมือ (checkbox) → รูปที่ต้องเก็บ → ทดสอบอัตโนมัติ (`cd server && npm test -- features/<ชื่อ>`)

| Feature | Checklist | หลักฐาน |
|---|---|---|
| Discord bridge (`discord`) | [discord_TEST.md](discord_TEST.md) (มีขั้นตอนสร้าง bot) | [evidence/features/discord/](../evidence/features/README.md#discord) |
| Cloud (`cloud`) | [cloud_TEST.md](cloud_TEST.md) (มีขั้นตอน deploy บน Render) | [evidence/features/cloud/](../evidence/features/README.md#cloud) |

คำอธิบายการทำงานพร้อมลิงก์ไปที่โค้ดอยู่ใน [HandbookFeatures.md](../../HandbookFeatures.md)
