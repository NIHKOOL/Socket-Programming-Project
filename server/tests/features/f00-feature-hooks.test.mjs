// Feature hooks: จุดเชื่อม core ↔ Feature เสริม ต้องไม่เปลี่ยนพฤติกรรมของ core
import { io, URL, wait, check, done } from "../helpers.mjs";

// handleHttp: ไม่มี feature ไหนรับ path นี้ → core ต้องตอบ 404 เหมือนเดิม (R2)
const res = await fetch(`${URL}/messages`);
check("unknown HTTP path still 404 (R2)", res.status === 404);

// Socket.IO handshake ยังทำงาน (request /socket.io/ ไม่ถูก feature ดักไป)
const hs = await fetch(`${URL}/socket.io/?EIO=4&transport=polling`);
check("Socket.IO handshake still works", hs.status === 200 && (await hs.text()).startsWith("0{"));

// setupSocket: core event ยังทำงานตามปกติหลังเรียก feature hooks
const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
let ok = null;
s.on("register_ok", ({ name }) => (ok = name));
s.emit("register", { name: "hooks" });
await wait(200);
check("core register still works with feature hooks", ok === "hooks");

s.disconnect();
done();
