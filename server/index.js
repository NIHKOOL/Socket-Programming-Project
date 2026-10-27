// Chat server: Node.js + Socket.IO
// รูปแบบ event ทั้งหมดอยู่ใน docs/PROTOCOL.md

import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT) || 3000;

// Socket.IO ทำงานบน HTTP server: ครั้งแรก client ส่ง HTTP request มาเพื่อ handshake
// แล้ว upgrade เป็น WebSocket (TCP connection ที่เปิดค้างไว้ส่งข้อมูลได้สองทาง)
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }, // client (React) รันคนละ origin/คนละเครื่อง
});

// ---- State ที่ server เก็บ ----
const clients = new Map(); // name -> socket
const groups = new Map(); // groupName -> Set(memberNames)

const now = () => new Date().toISOString();

function sendError(socket, code, message) {
  socket.emit("error_msg", { code, message });
}

function broadcastUserList() {
  io.emit("user_list", { users: [...clients.keys()] }); // R4
}

function broadcastGroupList() {
  const list = [...groups].map(([name, members]) => ({ name, members: [...members] }));
  io.emit("group_list", { groups: list }); // R9
}

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id} from ${socket.handshake.address}`);

  socket.on("register", ({ name } = {}) => {
    name = String(name ?? "").trim();
    if (!name) return sendError(socket, "INVALID_NAME", "กรุณาใส่ชื่อ");
    if (socket.data.name) return sendError(socket, "ALREADY_REGISTERED", "ลงทะเบียนไปแล้ว");
    if (clients.has(name)) return sendError(socket, "NAME_TAKEN", "ชื่อนี้ถูกใช้แล้ว"); // R3

    socket.data.name = name;
    clients.set(name, socket);
    socket.emit("register_ok", { name });
    broadcastUserList();
    broadcastGroupList();
  });

  // ทุก event ด้านล่างต้อง register ก่อน
  function requireName() {
    if (!socket.data.name) {
      sendError(socket, "NOT_REGISTERED", "ต้อง register ก่อน");
      return null;
    }
    return socket.data.name;
  }

  socket.on("private_msg", ({ to, text } = {}) => {
    const from = requireName();
    if (!from) return;
    const target = clients.get(to);
    if (!target) return sendError(socket, "USER_NOT_FOUND", `ไม่พบผู้ใช้ ${to}`);

    // R7: ส่งให้ผู้รับและผู้ส่งเท่านั้น (server กำหนด from/timestamp เอง)
    const msg = { from, to, text: String(text ?? ""), timestamp: now() };
    target.emit("private_msg", msg);
    if (target !== socket) socket.emit("private_msg", msg);
  });

  socket.on("create_group", ({ group } = {}) => {
    const name = requireName();
    if (!name) return;
    group = String(group ?? "").trim();
    if (!group) return sendError(socket, "INVALID_GROUP", "กรุณาใส่ชื่อกลุ่ม");
    if (groups.has(group)) return sendError(socket, "GROUP_EXISTS", "มีกลุ่มชื่อนี้แล้ว");

    groups.set(group, new Set([name])); // R8: เริ่มต้นมีแค่ผู้สร้าง
    socket.join(`group:${group}`);
    broadcastGroupList();
  });

  socket.on("join_group", ({ group } = {}) => {
    const name = requireName();
    if (!name) return;
    const members = groups.get(group);
    if (!members) return sendError(socket, "GROUP_NOT_FOUND", "ไม่พบกลุ่ม");

    // R10: เข้ากลุ่มได้เฉพาะตัวเองเท่านั้น (ใช้ชื่อจาก socket ไม่รับชื่อจาก client)
    members.add(name);
    socket.join(`group:${group}`);
    broadcastGroupList();
  });

  socket.on("group_msg", ({ group, text } = {}) => {
    const from = requireName();
    if (!from) return;
    const members = groups.get(group);
    if (!members) return sendError(socket, "GROUP_NOT_FOUND", "ไม่พบกลุ่ม");
    if (!members.has(from)) return sendError(socket, "NOT_A_MEMBER", "ยังไม่ได้เข้ากลุ่มนี้");

    // R11: ส่งเฉพาะสมาชิกกลุ่ม (Socket.IO room)
    io.to(`group:${group}`).emit("group_msg", { group, from, text: String(text ?? ""), timestamp: now() });
  });

  socket.on("disconnect", () => {
    const name = socket.data.name;
    console.log(`[disconnect] ${socket.id} (${name ?? "unregistered"})`);
    if (!name) return;
    clients.delete(name);
    // ชื่อนี้อาจถูกคนอื่นนำไปใช้ต่อ จึงเอาออกจากทุกกลุ่มด้วย
    for (const members of groups.values()) members.delete(name);
    broadcastUserList();
    broadcastGroupList();
  });
});

// 0.0.0.0 = รับการเชื่อมต่อจากทุก network interface (เครื่องอื่นใน LAN ต่อเข้ามาได้)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server listening on port ${PORT}`);
  console.log("Clients on other computers can connect to:");
  // แสดง IPv4 ของทุก network interface (ยกเว้น loopback) เพื่อให้รู้ว่า client ต้องใส่ URL อะไร
  for (const addrs of Object.values(networkInterfaces())) {
    for (const { family, internal, address } of addrs ?? []) {
      if (family === "IPv4" && !internal) console.log(`  http://${address}:${PORT}`);
    }
  }
});
