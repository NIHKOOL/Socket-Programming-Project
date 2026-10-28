// Feature: file — ส่งไฟล์ / รูปผ่าน socket แบบแบ่งชิ้น (chunk) server ส่งต่อทีละชิ้น ไม่เก็บไฟล์ไว้
//
//   C1 ──file_offer {to | group, name, size, type, ref} (ack)──> server ตรวจสิทธิ์ (R7 / R11) + ขนาด → ack { id, chunkSize }
//   server ──file_start {id, from, name, size, chunks, ref}──> ผู้รับ + ผู้ส่ง (echo)
//   C1 ──file_chunk {id, seq, data: <binary>} (ack)──> server ตรวจเจ้าของ + ลำดับ seq ──file_chunk──> ผู้รับ
//      ผู้ส่งรอ ack ของชิ้นนี้ก่อนส่งชิ้นถัดไป (stop-and-wait: flow control ระดับ application)
//   C1 ──file_end {id} (ack)──> server ตรวจว่าครบทุก byte ──file_end──> ผู้รับประกอบชิ้นเป็นไฟล์
//
// framing: แต่ละชิ้นเป็น 1 event ของ Socket.IO ที่มี binary attachment (ไม่ต้องแปลงเป็น base64)
// ความลับ (R7 / R11): ชิ้นไฟล์ส่งเฉพาะผู้รับ private หรือสมาชิกกลุ่ม คนนอกไม่ได้รับแม้แต่ byte เดียว

const CHUNK_SIZE = 64 * 1024; // 64 KB ต่อชิ้น (ต่ำกว่า maxHttpBufferSize 1 MB ของ Socket.IO มาก)
const MAX_FILE_SIZE = Number(process.env.FILE_MAX_BYTES) || 5 * 1024 * 1024; // 5 MB
const IDLE_TIMEOUT_MS = Number(process.env.FILE_IDLE_TIMEOUT_MS) || 30_000; // ผู้ส่งเงียบนานเกิน → ยกเลิก
const MAX_ACTIVE_PER_USER = 3;
const MAX_NAME_LENGTH = 100;

const transfers = new Map(); // id → การส่งที่กำลังทำอยู่
let nextId = 0;
let io = null;

// ชื่อไฟล์: เอาเฉพาะชื่อ (ตัด path) และตัดตัวอักษรควบคุม
export function cleanFileName(name) {
  return String(name ?? "")
    .split(/[\\/]/)
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

// ส่งถึง "ผู้รับ" (ไม่รวมผู้ส่ง): private = อีกฝ่าย 1 คน / group = สมาชิกทุกคนใน room ยกเว้นผู้ส่ง
function toReceivers(t, event, data) {
  if (t.group) t.socket.to(`group:${t.group}`).emit(event, data);
  else t.target.emit(event, data);
}
// ส่งถึงทุกคนที่เกี่ยวข้อง (ผู้รับ + ผู้ส่ง)
function toAll(t, event, data) {
  if (t.group) io.to(`group:${t.group}`).emit(event, data);
  else {
    t.target.emit(event, data);
    t.socket.emit(event, data);
  }
}

function finish(t) {
  clearTimeout(t.timer);
  transfers.delete(t.id);
}

function abort(t, reason) {
  finish(t);
  toAll(t, "file_abort", { id: t.id, reason });
}

// ผู้ส่งต้องส่งชิ้นถัดไปภายในเวลาที่กำหนด ไม่งั้นยกเลิก (กันการส่งค้างที่กินหน่วยความจำฝั่งผู้รับ)
function touch(t) {
  clearTimeout(t.timer);
  t.timer = setTimeout(() => abort(t, "timed out"), IDLE_TIMEOUT_MS);
  t.timer.unref?.();
}

export default {
  name: "file",

  init(app) {
    io = app.io;
  },

  setupSocket(socket, { requireName, clients, groups, now }) {
    const reply = (ack, data) => typeof ack === "function" && ack(data);
    // การส่งที่เป็นของ socket นี้เท่านั้น (คนอื่นส่งชิ้นแทรกเข้ามาไม่ได้)
    const own = (id) => {
      const t = transfers.get(String(id));
      return t && t.socket === socket ? t : null;
    };

    socket.on("file_offer", ({ to, group, name, size, type, ref } = {}, ack) => {
      const me = requireName();
      if (!me) return;
      name = cleanFileName(name);
      if (!name) return reply(ack, { ok: false, code: "BAD_FILE", message: "File name is missing" });
      if (!Number.isInteger(size) || size <= 0) return reply(ack, { ok: false, code: "BAD_FILE", message: "File is empty" });
      if (size > MAX_FILE_SIZE) {
        return reply(ack, { ok: false, code: "FILE_TOO_LARGE", message: `File is larger than ${MAX_FILE_SIZE / 1024 / 1024} MB` });
      }
      const active = [...transfers.values()].filter((t) => t.socket === socket).length;
      if (active >= MAX_ACTIVE_PER_USER) return reply(ack, { ok: false, code: "TOO_MANY_TRANSFERS", message: "Wait for your other files to finish" });

      // ตรวจผู้รับด้วยกฎเดียวกับข้อความแชท: private (R7) ต้องออนไลน์ / group (R11) ต้องเป็นสมาชิก
      const t = { socket, from: me, name, size, type: String(type || "application/octet-stream").slice(0, 100) };
      if (group !== undefined) {
        const members = groups.get(group);
        if (!members) return reply(ack, { ok: false, code: "GROUP_NOT_FOUND", message: "Group not found" });
        if (!members.has(me)) return reply(ack, { ok: false, code: "NOT_A_MEMBER", message: `You are not a member of "${group}"` });
        t.group = group;
      } else {
        const target = clients.get(to);
        if (!target) return reply(ack, { ok: false, code: "USER_NOT_FOUND", message: `User "${to}" is not online` });
        if (target === socket) return reply(ack, { ok: false, code: "SELF", message: "Cannot send a file to yourself" });
        t.to = to;
        t.target = target;
      }

      t.id = String(++nextId);
      t.chunks = Math.ceil(size / CHUNK_SIZE);
      t.nextSeq = 0;
      t.received = 0;
      transfers.set(t.id, t);
      touch(t);
      reply(ack, { ok: true, id: t.id, chunkSize: CHUNK_SIZE });
      // ref = เลขที่ผู้ส่งสุ่มเอง ใช้จับคู่ file_start กับไฟล์ในเครื่องผู้ส่ง (from มาจาก server เสมอ)
      toAll(t, "file_start", {
        id: t.id, from: me, to: t.to, group: t.group, name, size, type: t.type,
        chunks: t.chunks, timestamp: now(), ref: String(ref ?? ""),
      });
    });

    socket.on("file_chunk", ({ id, seq, data } = {}, ack) => {
      if (!requireName()) return;
      const t = own(id);
      if (!t) return reply(ack, { ok: false, code: "NO_TRANSFER" });
      // ชิ้นต้องมาตามลำดับ 0, 1, 2, ... (ผู้รับเอาไปต่อกันตามลำดับที่ได้รับ)
      if (seq !== t.nextSeq) return reply(ack, { ok: false, code: "BAD_SEQ", expected: t.nextSeq });
      if (!Buffer.isBuffer(data) || data.length === 0 || data.length > CHUNK_SIZE || t.received + data.length > t.size) {
        return reply(ack, { ok: false, code: "BAD_CHUNK" });
      }
      t.nextSeq++;
      t.received += data.length;
      touch(t);
      toReceivers(t, "file_chunk", { id: t.id, seq, data });
      reply(ack, { ok: true, received: t.received });
    });

    socket.on("file_end", ({ id } = {}, ack) => {
      if (!requireName()) return;
      const t = own(id);
      if (!t) return reply(ack, { ok: false, code: "NO_TRANSFER" });
      if (t.received !== t.size) return reply(ack, { ok: false, code: "INCOMPLETE", received: t.received, size: t.size });
      finish(t);
      toAll(t, "file_end", { id: t.id });
      reply(ack, { ok: true });
    });

    socket.on("file_cancel", ({ id } = {}) => {
      const t = own(id);
      if (t) abort(t, `${t.from} cancelled the transfer`);
    });

    // หลุดกลางทาง: ผู้ส่งหลุด → ยกเลิกไฟล์ที่กำลังส่ง / ผู้รับ private หลุด → แจ้งผู้ส่งให้หยุด
    socket.on("disconnect", () => {
      for (const t of [...transfers.values()]) {
        if (t.socket === socket) abort(t, `${t.from} disconnected`);
        else if (t.target === socket) {
          finish(t);
          t.socket.emit("file_abort", { id: t.id, reason: `${t.to} went offline` });
        }
      }
    });
  },
};
