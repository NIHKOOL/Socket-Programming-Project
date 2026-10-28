// Feature: ping — ทะเบียน slash command
// คำสั่งทำงานที่ client และแสดงผลเฉพาะจอของคนสั่ง (ไม่ส่งเป็นข้อความแชทให้คนอื่น)
// เพิ่มคำสั่งใหม่: ใส่ใน COMMANDS ด้วย { usage, description, run(ctx, args) }
import { parseInput } from "./parse.js";
import { runPing } from "../ping/ping.js";
import { gameCommands } from "../game/index.js"; // Feature: game
import { guessCommands } from "../guess/commands.js"; // Feature: guess

const COMMANDS = {
  help: {
    usage: "/help",
    description: "show available commands",
    run: ({ print }) => {
      print("available commands:");
      for (const c of Object.values(COMMANDS)) print(`  ${c.usage.padEnd(26)} ${c.description}`);
      print(`  ${"//text".padEnd(26)} send a message that starts with /`);
    },
  },
  ping: {
    usage: "/ping [name] [1-10]",
    description: "measure round-trip time to the server, or to a user via the server",
    run: ({ socket, print }, args) => runPing(socket, print, args),
  },
  ...gameCommands, // Feature: game — /play /accept /decline /move /quit
  ...guessCommands, // Feature: guess — /guess start|hints|stop
};

// คืนข้อความที่ต้องส่งเป็นแชทจริง หรือ null ถ้าเป็นคำสั่ง (จัดการแล้ว)
// ctx = { socket, print(line), room (id ห้องที่พิมพ์คำสั่ง) }
export function handleInput(text, ctx) {
  const input = parseInput(text);
  if (input.type === "text") return input.text;

  const cmd = COMMANDS[input.name];
  ctx.print(`$ ${text}`);
  if (!cmd) {
    ctx.print(`unknown command: /${input.name} — type /help`);
    return null;
  }
  Promise.resolve(cmd.run(ctx, input.args)).catch((err) => ctx.print(`error: ${err.message}`));
  return null;
}
