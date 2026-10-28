// Feature: file — ส่งไฟล์ / รูปผ่าน socket แบบแบ่งชิ้น (server ส่งต่อทีละชิ้น ตรวจสิทธิ์แบบ R7 / R11)
import { randomBytes } from "node:crypto";
import { io, URL, wait, check, done } from "../helpers.mjs";
import { cleanFileName } from "../../features/file.js";
import { canPreview, formatSize, progressBar } from "../../../client/src/features/file/format.js";

const ack = (p, ev, data) => p.s.timeout(3000).emitWithAck(ev, data);
async function user(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const p = { s, start: [], chunks: [], end: [], abort: [] };
  s.on("file_start", (m) => p.start.push(m));
  s.on("file_chunk", (m) => p.chunks.push(m));
  s.on("file_end", (m) => p.end.push(m));
  s.on("file_abort", (m) => p.abort.push(m));
  s.emit("register", { name });
  await wait(150);
  return p;
}
// ส่งไฟล์ทั้งไฟล์แบบที่ client ทำ: offer → chunk ทีละชิ้นรอ ack → end
async function sendAll(p, target, buf, name = "photo.png") {
  const offer = await ack(p, "file_offer", { ...target, name, size: buf.length, type: "image/png", ref: "r1" });
  if (!offer.ok) return offer;
  for (let seq = 0, pos = 0; pos < buf.length; seq++, pos += offer.chunkSize) {
    const r = await ack(p, "file_chunk", { id: offer.id, seq, data: buf.subarray(pos, pos + offer.chunkSize) });
    if (!r.ok) return r;
  }
  return { ...(await ack(p, "file_end", { id: offer.id })), id: offer.id };
}
const assemble = (p, id) => Buffer.concat(p.chunks.filter((c) => c.id === id).map((c) => c.data));

// ---- pure ----
check("cleanFileName: strips path + control chars", cleanFileName("..\\..\\etc/pass\u0000wd.txt") === "passwd.txt" && cleanFileName("  ") === "");
check("formatSize / progressBar", formatSize(512) === "512 B" && formatSize(1536) === "1.5 KB" && formatSize(3 * 1024 * 1024) === "3.0 MB" && progressBar(0.5, 10) === "[#####-----]");
check("canPreview: raster images only (no SVG)", canPreview("image/png") && canPreview("image/jpeg") && !canPreview("image/svg+xml") && !canPreview("text/html"));

const A = await user("A"), B = await user("B"), C = await user("C");

// ---- private: ไปถึง B ครบทุก byte, C ไม่ได้อะไรเลย ----
const file1 = randomBytes(150_000); // 3 ชิ้น (64 KB + 64 KB + 20 KB)
const r1 = await sendAll(A, { to: "B" }, file1);
await wait(150);
check("private file: transfer completes", r1.ok === true);
const s1 = B.start.find((m) => m.id === r1.id);
check("file_start: from (server-set) / name / size / chunks", s1?.from === "A" && s1.name === "photo.png" && s1.size === 150_000 && s1.chunks === 3);
check("sender also gets file_start echo with its ref", A.start.some((m) => m.id === r1.id && m.ref === "r1"));
check("receiver gets the file byte-for-byte (3 chunks in order)", assemble(B, r1.id).equals(file1) && B.chunks.filter((c) => c.id === r1.id).map((c) => c.seq).join() === "0,1,2");
check("sender does not get its own chunks back", A.chunks.length === 0);
check("both get file_end", B.end.some((m) => m.id === r1.id) && A.end.some((m) => m.id === r1.id));
check("outsider C receives nothing (R7)", C.start.length === 0 && C.chunks.length === 0 && C.end.length === 0);

// ---- ตรวจที่ server ----
check("offline user → USER_NOT_FOUND", (await ack(A, "file_offer", { to: "Nobody", name: "a.txt", size: 10 })).code === "USER_NOT_FOUND");
check("to yourself → SELF", (await ack(A, "file_offer", { to: "A", name: "a.txt", size: 10 })).code === "SELF");
check("bigger than 5 MB → FILE_TOO_LARGE", (await ack(A, "file_offer", { to: "B", name: "big.zip", size: 6 * 1024 * 1024 })).code === "FILE_TOO_LARGE");
check("empty file / no name → BAD_FILE", (await ack(A, "file_offer", { to: "B", name: "a", size: 0 })).code === "BAD_FILE" && (await ack(A, "file_offer", { to: "B", name: "", size: 5 })).code === "BAD_FILE");

const o2 = await ack(A, "file_offer", { to: "B", name: "x.bin", size: 100_000 });
check("chunk out of order → BAD_SEQ", (await ack(A, "file_chunk", { id: o2.id, seq: 1, data: Buffer.alloc(10) })).code === "BAD_SEQ");
check("someone else cannot inject chunks → NO_TRANSFER", (await ack(C, "file_chunk", { id: o2.id, seq: 0, data: Buffer.alloc(10) })).code === "NO_TRANSFER");
check("chunk bigger than chunkSize → BAD_CHUNK", (await ack(A, "file_chunk", { id: o2.id, seq: 0, data: Buffer.alloc(64 * 1024 + 1) })).code === "BAD_CHUNK");
check("non-binary chunk → BAD_CHUNK", (await ack(A, "file_chunk", { id: o2.id, seq: 0, data: "hello" })).code === "BAD_CHUNK");
check("end before all bytes → INCOMPLETE", (await ack(A, "file_end", { id: o2.id })).code === "INCOMPLETE");
A.s.emit("file_cancel", { id: o2.id });
await wait(100);
check("sender cancels → both sides get file_abort", B.abort.some((m) => m.id === o2.id) && A.abort.some((m) => m.id === o2.id));

// ---- group: สมาชิกได้ / คนนอกไม่ได้ (R11) ----
A.s.emit("create_group", { group: "g1" });
await wait(100);
B.s.emit("join_group", { group: "g1" });
await wait(150);
check("non-member C cannot send to group → NOT_A_MEMBER", (await ack(C, "file_offer", { group: "g1", name: "a.txt", size: 5 })).code === "NOT_A_MEMBER");
check("unknown group → GROUP_NOT_FOUND", (await ack(A, "file_offer", { group: "zzz", name: "a.txt", size: 5 })).code === "GROUP_NOT_FOUND");
const file3 = randomBytes(70_000);
const r3 = await sendAll(B, { group: "g1" }, file3, "notes.pdf");
await wait(150);
check("group file: member A gets it byte-for-byte", r3.ok && A.start.some((m) => m.id === r3.id && m.group === "g1") && assemble(A, r3.id).equals(file3));
check("group file: outsider C still receives nothing (R11)", C.start.length === 0 && C.chunks.length === 0);

// ---- หลุดกลางทาง ----
const o4 = await ack(A, "file_offer", { to: "B", name: "half.bin", size: 100_000 });
await ack(A, "file_chunk", { id: o4.id, seq: 0, data: Buffer.alloc(64 * 1024) });
A.s.disconnect();
await wait(200);
check("sender disconnects mid-transfer → receiver gets file_abort", B.abort.some((m) => m.id === o4.id && /disconnected/.test(m.reason)));

const D = await user("D");
const o5 = await ack(D, "file_offer", { to: "C", name: "y.bin", size: 100_000 });
C.s.disconnect();
await wait(200);
check("receiver goes offline → sender gets file_abort", D.abort.some((m) => m.id === o5.id && /offline/.test(m.reason)));
check("transfer is gone after abort → NO_TRANSFER", (await ack(D, "file_chunk", { id: o5.id, seq: 0, data: Buffer.alloc(10) })).code === "NO_TRANSFER");

for (const p of [B, D]) p.s.disconnect();
done();
