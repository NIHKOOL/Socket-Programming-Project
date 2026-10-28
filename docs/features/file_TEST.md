# Feature: file — ส่งไฟล์ / รูปผ่าน socket + Checklist

ส่งไฟล์ไม่เกิน **5 MB** ในห้อง private หรือห้องกลุ่ม ไฟล์ถูกแบ่งเป็นชิ้นละ **64 KB** ส่งทีละชิ้นผ่าน socket
ผู้ส่งรอ ack ของแต่ละชิ้นก่อนส่งชิ้นถัดไป (stop-and-wait) server ตรวจแล้วส่งต่อทันที **ไม่เก็บไฟล์**
การทำงานทีละขั้นพร้อมลิงก์โค้ด: [HandbookFeatures.md → Feature 6](../../HandbookFeatures.md#feature-6--ส่งไฟล์--รูปผ่าน-socket)

## 1. วิธีใช้

| ทำอย่างไร | ผล |
|---|---|
| กด `[+file]` ข้างช่องพิมพ์ แล้วเลือกไฟล์ (เลือกหลายไฟล์ได้ / มือถือเลือกจากคลังรูปหรือถ่ายรูปได้) | ส่งไปห้องที่เปิดอยู่ |
| ลากไฟล์จากเครื่องมาวางในหน้าต่างแชท (กรอบเขียวประ) | เหมือนกัน |
| คัดลอกรูป (เช่น screenshot) แล้วกด Ctrl+V ในช่องพิมพ์ | ส่งรูปนั้น |

ระหว่างส่ง: `[########------------] 40% sending...` (ผู้รับเห็น `receiving...`)
ครบแล้ว: รูป (PNG / JPEG / GIF / WebP / BMP) แสดงตัวอย่างในแชท + `[download]` / ไฟล์อื่นมีแค่ `[download]` / ผู้ส่งเห็น `sent in 0.4s (750.0 KB/s)`

## 2. ทดสอบด้วยมือ

login `C1`, `C2`, `C3` (ควรอยู่คนละเครื่อง) → C1 สร้าง `g1`, C2 join (C3 **ไม่** join)

**Private**
- [ ] C1 เปิดห้อง `@C2` → `[+file]` → เลือกรูป → ทั้ง C1 และ C2 เห็น progress แล้วเห็นรูป + `[download]`
- [ ] C2 กด `[download]` → ไฟล์ที่ได้เปิดได้ เหมือนต้นฉบับ
- [ ] ส่งไฟล์ที่ไม่ใช่รูป (เช่น `.pdf`, `.zip`) → มีแค่ `[download]` และเปิดได้
- [ ] ส่งรูปขนาด 3–5 MB → เห็น progress bar ขยับทีละขั้น (ส่งข้ามเครื่องจะเห็นชัดกว่า)
- [ ] ลากไฟล์มาวาง / Ctrl+V รูปจาก screenshot → ส่งได้
- [ ] **C3 ไม่เห็นอะไรเลย** (ไม่มีข้อความไฟล์ ไม่มี unread)

**Group**
- [ ] C1 ส่งรูปในห้อง `#g1` → C2 เห็นรูป / **C3 (ไม่ใช่สมาชิก) ไม่ได้รับอะไร**
- [ ] C2 ส่งไฟล์ในกลุ่มบ้าง → C1 เห็น

**ข้อจำกัด / error**
- [ ] ไฟล์ใหญ่กว่า 5 MB → `error: File is larger than 5 MB` เห็นคนเดียว ไม่มีอะไรถูกส่ง
- [ ] ห้อง private กับคนที่ออฟไลน์ → ปุ่ม `[+file]` กดไม่ได้
- [ ] C1 ส่งไฟล์ใหญ่ แล้ว**ปิดแท็บ C1 กลางทาง** → C2 เห็น `✗ transfer failed: C1 disconnected`
- [ ] C1 ส่งไฟล์ใหญ่ให้ C2 แล้ว**ปิดแท็บ C2 กลางทาง** → C1 เห็น `✗ transfer failed: C2 went offline`

**พิสูจน์ว่าวิ่งผ่าน socket**
- [ ] **terminal ของ server**: เห็น `[recv] C1 -> file_offer {...}` แล้ว `[recv] C1 -> file_chunk {"id":"1","seq":0,"data":"<binary 65536 bytes>"}` ทีละชิ้นจนถึง `file_end`
- [ ] **DevTools → Network → WS → Messages ของ C2**: เห็น frame ข้อความ `file_chunk` ตามด้วย frame **binary** ขนาดประมาณ 64 KB ทีละคู่
- [ ] DevTools ของ C3 ระหว่างที่ C1 ส่งไฟล์ให้ C2: ไม่มี frame `file_*` เลย

เก็บหลักฐานที่ `docs/evidence/features/file/`:
- `file-private-image.png` — ส่งรูปในห้อง private: จอผู้ส่งกับผู้รับคู่กัน
- `file-group.png` — ส่งไฟล์ในกลุ่ม: สมาชิกเห็น
- `file-progress.png` — progress bar ระหว่างส่งไฟล์ใหญ่
- `file-server-log.png` — terminal ของ server: `file_offer` → `file_chunk <binary 65536 bytes>` → `file_end`
- `file-ws-binary.png` — DevTools WS ของผู้รับ: frame binary ของชิ้นไฟล์
- `file-outsider.png` — จอ C3 ที่ไม่ได้รับไฟล์
- `file-too-large.png` — error ไฟล์ใหญ่เกิน 5 MB

## ทดสอบอัตโนมัติ

รันเอง: `cd server && npm test -- f06`

ผ่าน 27/27: `cleanFileName` (ตัด path / ตัวอักษรควบคุม), `formatSize`, `progressBar`, `canPreview` (ไม่แสดง SVG) /
**private**: ส่งครบ, `file_start` มี `from` จาก server + ชื่อ + ขนาด + จำนวนชิ้น, ผู้ส่งได้ echo พร้อม `ref`, **ผู้รับได้ไฟล์ตรงทุก byte เรียงชิ้น 0,1,2**, ผู้ส่งไม่ได้ชิ้นของตัวเองกลับ, ทั้งคู่ได้ `file_end`, **คนนอกไม่ได้รับอะไร (R7)** /
**ตรวจที่ server**: ผู้ใช้ออฟไลน์, ส่งหาตัวเอง, ใหญ่เกิน 5 MB, ไฟล์ว่าง / ไม่มีชื่อ, **ชิ้นข้ามลำดับ (`BAD_SEQ`)**, **คนอื่นแทรกชิ้น (`NO_TRANSFER`)**, ชิ้นใหญ่เกิน / ไม่ใช่ binary (`BAD_CHUNK`), จบก่อนครบ (`INCOMPLETE`), ผู้ส่งยกเลิก → ทั้งคู่ได้ `file_abort` /
**group**: คนนอกส่งไม่ได้ (`NOT_A_MEMBER`), กลุ่มไม่มี, สมาชิกได้ไฟล์ตรงทุก byte, **คนนอกไม่ได้รับอะไร (R11)** /
**หลุดกลางทาง**: ผู้ส่งหลุด → ผู้รับได้ `file_abort`, ผู้รับออฟไลน์ → ผู้ส่งได้ `file_abort`, หลังยกเลิกส่งชิ้นต่อไม่ได้

ทดสอบเพิ่ม (AI รันแล้ว): รันโค้ดส่ง/รับของ client จริง (`client/src/features/file/transfer.js`) เป็นผู้ส่งกับผู้รับคนละ process ต่อ server จริง
ส่งไฟล์ 300,000 byte (5 ชิ้น) → ผู้รับประกอบได้ 300,000 byte **sha256 ตรงกับต้นฉบับ** และ server log แสดง `<binary 65536 bytes>` ไม่พิมพ์ข้อมูลทั้งก้อน
