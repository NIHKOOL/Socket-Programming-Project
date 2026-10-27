// Feature: cloud — server เสิร์ฟหน้าเว็บ client/dist + R2 ยังเป็นจริง + กัน path traversal
import { request } from "node:http";
import { existsSync, readdirSync } from "node:fs";
import { io, URL, wait, check, done } from "../helpers.mjs";
import { realClientIp } from "../../features/cloud.js";

const DIST = new globalThis.URL("../../../client/dist/", import.meta.url);

// ส่ง request แบบ raw (fetch จะ normalize "../" ให้ก่อน จึงทดสอบ path traversal ไม่ได้)
function raw(method, path) {
  return new Promise((resolve, reject) => {
    const req = request(`${URL}${path}`, { method, path }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"] ?? "", body }));
    });
    req.on("error", reject);
    req.end();
  });
}

// ---- R2 ยังเป็นจริง ----
check("GET /messages → 404 (no REST, R2)", (await raw("GET", "/messages")).status === 404);
check("POST / → 404 (only GET/HEAD for page files)", (await raw("POST", "/")).status === 404);

// ---- path traversal: ห้ามอ่านไฟล์นอก client/dist ----
for (const p of ["/../../server/index.js", "/..%2f..%2fserver%2findex.js", "/%2e%2e/%2e%2e/package.json", "/assets/../../../server/index.js"]) {
  const r = await raw("GET", p);
  check(`traversal ${p} → 404`, r.status === 404 && !r.body.includes("socket.io"));
}
check("malformed URL encoding → 404 (no crash)", (await raw("GET", "/%E0%A4%A")).status === 404);

// ---- เสิร์ฟหน้าเว็บ (ต้อง build client ก่อน) ----
if (existsSync(new globalThis.URL("index.html", DIST))) {
  const home = await raw("GET", "/");
  check("GET / → index.html", home.status === 200 && home.type.startsWith("text/html") && home.body.includes('id="root"'));
  const asset = readdirSync(new globalThis.URL("assets/", DIST)).find((f) => f.endsWith(".js"));
  const js = await raw("GET", `/assets/${asset}`);
  check("GET /assets/*.js → JavaScript", js.status === 200 && js.type.startsWith("text/javascript"));
  const head = await raw("HEAD", "/");
  check("HEAD / → 200 without body", head.status === 200 && head.body === "");
} else {
  console.log("SKIP page-serving checks: client/dist not built (run `npm run build` at project root)");
}

// ---- Socket.IO ยังทำงานเมื่อ cloud เปิดอยู่ ----
const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false, extraHeaders: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
let ok = null;
s.on("register_ok", ({ name }) => (ok = name));
s.emit("register", { name: "cloud-user" });
await wait(200);
check("Socket.IO register works alongside static serving", ok === "cloud-user");
s.disconnect();

// ---- IP จริงจาก X-Forwarded-For ----
const fake = (headers, address) => ({ handshake: { headers, address } });
check("realClientIp: first X-Forwarded-For entry", realClientIp(fake({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }, "10.0.0.1")) === "203.0.113.7");
check("realClientIp: no proxy → socket address", realClientIp(fake({}, "192.168.1.36")) === "192.168.1.36");

done();
