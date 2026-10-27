// Chat server: Node.js + Socket.IO
// รูปแบบ event ทั้งหมดอยู่ใน docs/PROTOCOL.md

import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { Server } from "socket.io";
import { featureNames, handleHttp, initFeatures, onGroupMessage, setupSocket } from "./features/index.js";

const PORT = Number(process.env.PORT) || 3000;

// Socket.IO ทำงานบน HTTP server: ครั้งแรก client ส่ง HTTP request มาเพื่อ handshake
// แล้ว upgrade เป็น WebSocket (TCP connection ที่เปิดค้างไว้ส่งข้อมูลได้สองทาง)
// R2: request ที่ path /socket.io/ จะถูก Socket.IO ดักไปจัดการก่อน handler นี้จะทำงาน
// ส่วน HTTP request อื่นทั้งหมดตอบ 404 เพราะไม่มี REST API สำหรับส่งหรือดึงข้อความ
// (Feature เสริมรับ request บางอย่างได้ก่อน เช่น เสิร์ฟไฟล์หน้าเว็บ ดู server/features/index.js)
const httpServer = createServer((req, res) => {
  if (handleHttp(req, res)) return;
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("This server only accepts Socket.IO connections.\n");
});
const io = new Server(httpServer, {
  cors: { origin: "*" }, // client (React) รันคนละ origin/คนละเครื่อง
});

// ---- State ที่ server เก็บ ----
const clients = new Map(); // name -> socket
const groups = new Map(); // groupName -> Set(memberNames)

const MAX_NAME_LENGTH = 20;
const MAX_TEXT_LENGTH = 1000;
const MAX_GROUP_NAME_LENGTH = 30;
// socket ที่ register สำเร็จแล้วจะถูก join เข้า room นี้ broadcast จะส่งเฉพาะ room นี้
const REGISTERED = "registered";

const now = () => new Date().toISOString();

// จุดเชื่อม Feature เสริม (Part 3): ให้ feature เตรียมตัวครั้งเดียวตอน server เริ่ม (เช่น discord login)
initFeatures({ io, clients, groups, now });

// R3: เทียบชื่อแบบไม่สนตัวพิมพ์เล็ก/ใหญ่ ("Alice" กับ "alice" ถือเป็นชื่อเดียวกัน)
function isNameTaken(name) {
  const lower = name.toLowerCase();
  return [...clients.keys()].some((n) => n.toLowerCase() === lower);
}

function sendError(socket, code, message) {
  socket.emit("error_msg", { code, message });
}

// R8: ชื่อกลุ่มห้ามซ้ำแบบไม่สนตัวพิมพ์ เหมือนชื่อผู้ใช้ (R3)
function isGroupTaken(group) {
  const lower = group.toLowerCase();
  return [...groups.keys()].some((g) => g.toLowerCase() === lower);
}

// ข้อความแชท (R7, R11): ห้ามว่าง ห้ามยาวเกิน ตรวจที่ server เพราะ client ข้ามการตรวจฝั่งตัวเองได้
function cleanText(socket, text) {
  text = String(text ?? "").trim();
  if (!text || text.length > MAX_TEXT_LENGTH) {
    sendError(socket, "INVALID_TEXT", `Message must be 1–${MAX_TEXT_LENGTH} characters`);
    return null;
  }
  return text;
}

function broadcastUserList() {
  io.to(REGISTERED).emit("user_list", { users: [...clients.keys()] }); // R4
}

// R9: ส่งกลุ่ม "ทั้งหมด" ทุกกลุ่ม ไม่ว่าใครสร้าง หรือผู้รับจะเป็นสมาชิกหรือไม่ พร้อมรายชื่อสมาชิก
// เรียกทุกครั้งที่ข้อมูลกลุ่มเปลี่ยน: register (คนใหม่ได้รายการครบ), create_group, join_group, disconnect
function broadcastGroupList() {
  const list = [...groups].map(([name, members]) => ({ name, members: [...members] }));
  io.to(REGISTERED).emit("group_list", { groups: list });
}

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id} from ${socket.handshake.address}`);

  // R2: log ทุก event ที่รับเข้ามาผ่าน socket นี้ ใช้แสดงตอน demo ว่าข้อความทุกอย่างวิ่งผ่าน socket
  socket.onAny((event, payload) => {
    console.log(`[recv] ${socket.data.name ?? socket.id} -> ${event} ${JSON.stringify(payload)}`);
  });

  socket.on("register", ({ name } = {}) => {
    name = String(name ?? "").trim();
    if (!name || name.length > MAX_NAME_LENGTH) {
      return sendError(socket, "INVALID_NAME", `Name must be 1–${MAX_NAME_LENGTH} characters`);
    }
    if (socket.data.name) return sendError(socket, "ALREADY_REGISTERED", "Already registered");
    if (isNameTaken(name)) return sendError(socket, "NAME_TAKEN", `Name "${name}" is already taken`); // R3

    // R3: จองชื่อ → ผูกชื่อกับ socket นี้ → ชื่อนี้จะว่างอีกครั้งตอน disconnect
    socket.data.name = name;
    clients.set(name, socket);
    socket.join(REGISTERED);
    socket.emit("register_ok", { name });
    broadcastUserList();
    broadcastGroupList();
  });

  // ทุก event ด้านล่างต้อง register ก่อน
  function requireName() {
    if (!socket.data.name) {
      sendError(socket, "NOT_REGISTERED", "Please register first");
      return null;
    }
    return socket.data.name;
  }

  // จุดเชื่อม Feature เสริม (Part 3): ให้ feature เพิ่ม socket.on(...) ของตัวเองโดยใช้ helper เดียวกับ core
  const ctx = { io, clients, groups, requireName, sendError: (code, msg) => sendError(socket, code, msg), now };
  setupSocket(socket, ctx);

  socket.on("private_msg", ({ to, text } = {}) => {
    const from = requireName();
    if (!from) return;
    const target = clients.get(to);
    if (!target) return sendError(socket, "USER_NOT_FOUND", `User "${to}" is not online`);
    text = cleanText(socket, text);
    if (!text) return;

    // R7: ส่งให้ผู้รับและผู้ส่งเท่านั้น ใช้ socket.emit ตรงถึง 2 คนนี้ ไม่ใช่ io.emit (broadcast)
    // from และ timestamp กำหนดที่ server เสมอ client ปลอมเป็นคนอื่นไม่ได้
    const msg = { from, to, text, timestamp: now() };
    target.emit("private_msg", msg); // ถึงผู้รับ
    if (target !== socket) socket.emit("private_msg", msg); // echo กลับให้ผู้ส่ง แสดงในห้องของตัวเอง
  });

  socket.on("create_group", ({ group } = {}) => {
    const name = requireName();
    if (!name) return;
    group = String(group ?? "").trim();
    if (!group || group.length > MAX_GROUP_NAME_LENGTH) {
      return sendError(socket, "INVALID_GROUP", `Group name must be 1–${MAX_GROUP_NAME_LENGTH} characters`);
    }
    if (isGroupTaken(group)) return sendError(socket, "GROUP_EXISTS", `Group "${group}" already exists`);

    // R8: กลุ่มใหม่มีสมาชิกแค่ผู้สร้าง ไม่มีการเพิ่มคนอื่นให้อัตโนมัติ
    groups.set(group, new Set([name]));
    socket.join(`group:${group}`); // เข้า Socket.IO room ของกลุ่ม เพื่อรับ group_msg (R11)
    broadcastGroupList(); // R9: ทุกคนเห็นกลุ่มใหม่
    socket.emit("create_group_ok", { group }); // บอกผู้สร้าง ให้ client เปิดห้องกลุ่มได้ทันที
  });

  socket.on("join_group", ({ group } = {}) => {
    const name = requireName();
    if (!name) return;
    const members = groups.get(group);
    if (!members) return sendError(socket, "GROUP_NOT_FOUND", "Group not found");
    if (members.has(name)) return sendError(socket, "ALREADY_MEMBER", `You are already a member of "${group}"`);

    // R10: เข้ากลุ่มได้เฉพาะ "ตัวเอง" เท่านั้น
    // ใช้ชื่อที่ผูกกับ socket นี้ตอน register ไม่รับชื่อจาก payload จึงไม่มีทางเพิ่มคนอื่นเข้ากลุ่ม
    // และไม่มี event ให้ผู้สร้างกลุ่มดึงคนอื่นเข้ามา
    members.add(name);
    socket.join(`group:${group}`); // เข้า Socket.IO room ของกลุ่ม เริ่มรับ group_msg ตั้งแต่ตอนนี้ (R11)
    broadcastGroupList(); // R9: ทุกคนเห็นสมาชิกใหม่
    socket.emit("join_group_ok", { group }); // บอกผู้ join ให้ client เปิดห้องกลุ่มได้ทันที
  });

  socket.on("group_msg", ({ group, text } = {}) => {
    const from = requireName();
    if (!from) return;
    const members = groups.get(group);
    if (!members) return sendError(socket, "GROUP_NOT_FOUND", "Group not found");
    if (!members.has(from)) return sendError(socket, "NOT_A_MEMBER", "You are not a member of this group");
    text = cleanText(socket, text);
    if (!text) return;

    // R11: เห็นเฉพาะสมาชิก ตรวจ 2 ชั้น
    //   ชั้นที่ 1 (ใครส่งได้): members.has(from) ด้านบน คนที่ไม่ใช่สมาชิกได้ NOT_A_MEMBER
    //   ชั้นที่ 2 (ใครได้รับ): io.to(room) ส่งเฉพาะ socket ที่อยู่ใน room "group:<ชื่อ>"
    // members กับ room ตรงกันเสมอ: create/join → เพิ่มทั้งสองที่พร้อมกัน
    // disconnect → ลบออกจาก members และ Socket.IO ถอด socket ออกจากทุก room ให้เอง
    // ผู้ส่งอยู่ใน room ด้วย จึงได้รับข้อความของตัวเองกลับมา (echo) แสดงในห้องของตัวเอง
    const msg = { group, from, text, timestamp: now() };
    io.to(`group:${group}`).emit("group_msg", msg);
    onGroupMessage(msg); // จุดเชื่อม Feature เสริม: เช่น discord bridge ส่งต่อข้อความออกไป Discord
  });

  socket.on("disconnect", () => {
    const name = socket.data.name;
    console.log(`[disconnect] ${socket.id} (${name ?? "unregistered"})`);
    if (!name) return;
    clients.delete(name);
    // ชื่อนี้อาจถูกคนอื่นนำไปใช้ต่อ จึงเอาออกจากทุกกลุ่มด้วย
    // ตัวกลุ่มไม่ถูกลบ แม้สมาชิกจะออกหมดแล้วก็ตาม (ทีมตัดสินใจให้เก็บไว้ให้คนอื่นเข้ามาใหม่ได้)
    for (const members of groups.values()) members.delete(name);
    broadcastUserList();
    broadcastGroupList();
  });
});

// 0.0.0.0 = รับการเชื่อมต่อจากทุก network interface (เครื่องอื่นใน LAN ต่อเข้ามาได้)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server listening on port ${PORT}`);
  console.log(`Features: ${featureNames().join(", ") || "(none)"}`);
  console.log("Clients on other computers can connect to:");
  // แสดง IPv4 ของทุก network interface (ยกเว้น loopback) เพื่อให้รู้ว่า client ต้องใส่ URL อะไร
  for (const addrs of Object.values(networkInterfaces())) {
    for (const { family, internal, address } of addrs ?? []) {
      if (family === "IPv4" && !internal) console.log(`  http://${address}:${PORT}`);
    }
  }
});
