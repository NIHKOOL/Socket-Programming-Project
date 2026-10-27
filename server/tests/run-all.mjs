// รัน test ทุกไฟล์ใน tests/ (core R1–R11) และ tests/features/ (Feature เสริม Part 3)
// แต่ละไฟล์ได้ server ตัวใหม่ (state ไม่ค้างข้ามไฟล์)
//   npm test               → รันทุกไฟล์
//   npm test -- r07        → รันเฉพาะไฟล์ที่ path มี "r07"
//   npm test -- features/  → รันเฉพาะ test ของ Feature เสริม
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, "..", "index.js");
const BASE_PORT = 4100;
const TIMEOUT_MS = 30_000;

const filter = process.argv[2] ?? "";
const listTests = (dir, prefix) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).map((f) => prefix + f).sort() : [];
const files = [...listTests(here, ""), ...listTests(join(here, "features"), "features/")].filter((f) =>
  f.includes(filter)
);

// เปิด server ที่ port ที่กำหนด รอจนพิมพ์ "listening" แล้วค่อยเริ่ม test
function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [serverEntry], { env: { ...process.env, PORT: String(port) } });
    let log = "";
    proc.stdout.on("data", (d) => {
      log += d;
      if (log.includes("listening on port")) resolve(proc);
    });
    proc.stderr.on("data", (d) => (log += d));
    proc.on("exit", (code) => reject(new Error(`server exited (code ${code}) before ready:\n${log}`)));
  });
}

function runTest(file, port) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [join(here, file)], {
      env: { ...process.env, TEST_URL: `http://localhost:${port}` },
    });
    let out = "";
    proc.stdout.on("data", (d) => (out += d));
    proc.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(() => {
      out += `\nTIMEOUT after ${TIMEOUT_MS / 1000}s`;
      proc.kill();
    }, TIMEOUT_MS);
    proc.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, out: out.trim() });
    });
  });
}

let failedFiles = 0;
for (const [i, file] of files.entries()) {
  const port = BASE_PORT + i;
  const server = await startServer(port);
  const { code, out } = await runTest(file, port);
  server.kill();

  if (code === 0) {
    console.log(`ok    ${file}  (${out.split("\n").at(-1)})`);
  } else {
    failedFiles++;
    // แสดงเฉพาะบรรทัดที่ไม่ผ่าน + error
    const details = out.split("\n").filter((l) => !l.startsWith("PASS"));
    console.log(`FAIL  ${file}\n      ${details.join("\n      ")}`);
  }
}

console.log(`\n${files.length - failedFiles}/${files.length} test files passed`);
process.exit(failedFiles > 0 ? 1 : 0);
