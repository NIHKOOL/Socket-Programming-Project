// Feature: file — ส่ง / รับไฟล์ผ่าน socket แบบแบ่งชิ้น (ดู server/features/file.js)
//
// ส่ง: file_offer (ack: id) → file_chunk ทีละชิ้น 64 KB รอ ack ทุกชิ้น (stop-and-wait) → file_end
// รับ: file_start (สร้างข้อความในห้อง) → file_chunk (เก็บชิ้น + progress) → file_end (ประกอบเป็น Blob → แสดง / ดาวน์โหลด)
import { dmRoomId, groupRoomId } from "../../rooms.js";
import { canPreview } from "./format.js";

const outgoing = new Map(); // ref → ไฟล์ที่เรากำลังส่ง (ใช้จับคู่กับ file_start ที่ server echo กลับมา)
const transfers = new Map(); // id → { room, chunks, received, ... } ของทุกไฟล์ที่ยังไม่จบ
let ui = null;

const roomOf = (meta, me) => (meta.group ? groupRoomId(meta.group) : dmRoomId(meta.from === me ? meta.to : meta.from));

// ui = { add(room, msg), update(room, id, patch), me() } จาก App.jsx
export function setupFile(socket, handlers) {
  ui = handlers;

  socket.on("file_start", (meta) => {
    const me = ui.me();
    const out = meta.from === me ? outgoing.get(meta.ref) : null;
    const room = roomOf(meta, me);
    transfers.set(meta.id, { room, out, chunks: [], received: 0, size: meta.size, type: meta.type });
    ui.add(room, {
      from: meta.from,
      timestamp: meta.timestamp,
      file: {
        id: meta.id, name: meta.name, size: meta.size, type: meta.type,
        status: out ? "sending" : "receiving", done: 0, url: out?.url ?? null,
      },
    });
  });

  // ชิ้นไฟล์มาตามลำดับ (server ตรวจ seq แล้ว) เก็บต่อท้ายไว้ก่อน
  socket.on("file_chunk", ({ id, data }) => {
    const t = transfers.get(id);
    if (!t || t.out) return;
    t.chunks.push(data);
    t.received += data.byteLength;
    ui.update(t.room, id, { done: t.received });
  });

  socket.on("file_end", ({ id }) => {
    const t = transfers.get(id);
    if (!t) return;
    transfers.delete(id);
    if (t.out) {
      const sec = (performance.now() - t.out.startedAt) / 1000;
      return ui.update(t.room, id, { status: "done", done: t.size, seconds: sec });
    }
    // ประกอบทุกชิ้นเป็นไฟล์ / ชนิดไฟล์มาจากผู้ส่ง (เชื่อไม่ได้) จึงใช้ตามจริงเฉพาะรูปที่แสดงได้ปลอดภัย
    const blob = new Blob(t.chunks, { type: canPreview(t.type) ? t.type : "application/octet-stream" });
    ui.update(t.room, id, { status: "done", done: t.size, url: URL.createObjectURL(blob) });
  });

  socket.on("file_abort", ({ id, reason }) => {
    const t = transfers.get(id);
    if (!t) return;
    transfers.delete(id);
    if (t.out) t.out.cancelled = true;
    ui.update(t.room, id, { status: "failed", reason });
  });
}

// target = { to: "C2" } หรือ { group: "g1" } / print = แสดงข้อความ error เฉพาะจอเรา
export async function sendFile(socket, target, file, print) {
  const ref = Math.random().toString(36).slice(2);
  const out = { url: URL.createObjectURL(file), startedAt: performance.now(), cancelled: false };
  outgoing.set(ref, out);
  let id = null;
  try {
    const offer = await socket
      .timeout(5000)
      .emitWithAck("file_offer", { ...target, name: file.name || "file", size: file.size, type: file.type, ref });
    if (!offer.ok) return print(`error: ${offer.message ?? offer.code}`);
    id = offer.id;

    // ส่งทีละชิ้น: อ่านเฉพาะส่วนของไฟล์ (slice) → ArrayBuffer → emit แบบ binary → รอ ack ก่อนชิ้นถัดไป
    for (let seq = 0, pos = 0; pos < file.size; seq++, pos += offer.chunkSize) {
      if (out.cancelled) return; // server ยกเลิก (เช่น ผู้รับออฟไลน์)
      const data = await file.slice(pos, pos + offer.chunkSize).arrayBuffer();
      const r = await socket.timeout(10_000).emitWithAck("file_chunk", { id, seq, data });
      if (!r.ok) throw new Error(r.code);
      const t = transfers.get(id);
      if (t) ui.update(t.room, id, { done: r.received });
    }
    if (out.cancelled) return;
    const end = await socket.timeout(5000).emitWithAck("file_end", { id });
    if (!end.ok) throw new Error(end.code);
  } catch (err) {
    if (id && !out.cancelled) socket.emit("file_cancel", { id }); // บอก server + ผู้รับให้ทิ้งไฟล์นี้
    print(`error: could not send ${file.name} (${err.message === "operation has timed out" ? "timed out" : err.message})`);
  } finally {
    outgoing.delete(ref);
  }
}
