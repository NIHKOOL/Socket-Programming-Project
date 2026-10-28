// Feature: game — ฝั่ง client: รับ game_update มาแสดงในห้อง private กับคู่แข่ง + คำสั่ง /play /accept /decline /move /quit
// client ไม่ได้ตัดสินอะไรเลย แค่ส่ง "การกระทำ" ไปให้ server แล้วแสดงผลที่ server ส่งกลับมา
import { dmRoomId } from "../../rooms.js";
import { MOVE_HINT, formatUpdate, isGameOver, opponentOf } from "./format.js";

let current = null; // update ล่าสุดของเกมที่เราอยู่ (null = ไม่มีเกม)

// notify(opponent, line) = แสดงบรรทัดสีเทาในห้อง private กับคู่แข่ง
export function setupGame(socket, notify, getMe) {
  current = null; // login ใหม่ = เริ่มใหม่
  socket.on("game_update", (u) => {
    const me = getMe();
    current = isGameOver(u.event) ? null : u;
    for (const line of formatUpdate(u, me)) notify(opponentOf(u, me), line);
  });
}

const ERRORS = {
  UNKNOWN_GAME: () => "unknown game — available: rps",
  SELF: () => "you cannot challenge yourself",
  USER_NOT_FOUND: (x) => `${x} is not online`,
  YOU_ARE_BUSY: () => "you are already in a game (/quit first)",
  OPPONENT_BUSY: (x) => `${x} is already in a game`,
  NO_GAME: () => "you are not in a game",
  NOT_PENDING: () => "this challenge was already answered",
  ONLY_INVITED: () => "only the challenged player can answer",
  NOT_PLAYING: () => "the game has not started yet",
  BAD_MOVE: () => `invalid move — ${MOVE_HINT} (or r / p / s)`,
  ALREADY_MOVED: () => "you already chose this round — wait for your opponent",
};

// ส่ง action แบบมี ack แล้วพิมพ์ error ถ้าไม่ผ่าน (คืน reply ถ้าผ่าน)
async function act(ctx, event, data, subject) {
  const reply = await ctx.socket.timeout(3000).emitWithAck(event, data);
  if (!reply.ok) ctx.print(`error: ${ERRORS[reply.code]?.(subject) ?? reply.code}`);
  return reply.ok ? reply : null;
}

// ถ้าไม่ได้พิมพ์คำสั่งในห้อง private กับคู่แข่ง บอกว่าข้อความเกมไปอยู่ห้องไหน
const pointToRoom = (ctx, opp) => {
  if (ctx.room !== dmRoomId(opp)) ctx.print(`game messages appear in @${opp}`);
};

const requireGame = (ctx) => {
  if (!current) ctx.print(`error: ${ERRORS.NO_GAME()}`);
  return current;
};

export const gameCommands = {
  play: {
    usage: "/play rps <name> [1|3|5]",
    description: "challenge a user to rock-paper-scissors (best of 1/3/5)",
    run: async (ctx, [game, rawTo, bestOf]) => {
      if (!game || !rawTo) return ctx.print("usage: /play rps <name> [1|3|5]");
      const to = rawTo.replace(/^@/, "");
      if (await act(ctx, "game_challenge", { game: game.toLowerCase(), to, bestOf: Number(bestOf) || 3 }, to)) pointToRoom(ctx, to);
    },
  },
  accept: {
    usage: "/accept",
    description: "accept a game challenge",
    run: async (ctx) => {
      const g = requireGame(ctx);
      if (g && (await act(ctx, "game_respond", { id: g.id, accept: true }))) pointToRoom(ctx, g.players[0]);
    },
  },
  decline: {
    usage: "/decline",
    description: "decline a game challenge",
    run: async (ctx) => {
      const g = requireGame(ctx);
      if (g) await act(ctx, "game_respond", { id: g.id, accept: false });
    },
  },
  move: {
    usage: "/move <r|p|s>",
    description: "choose rock / paper / scissors (hidden until both chose)",
    run: async (ctx, [move]) => {
      const g = requireGame(ctx);
      if (!g) return;
      const reply = await act(ctx, "game_move", { id: g.id, move });
      if (reply) ctx.print(`[game] you chose ${reply.move} (hidden from your opponent until they choose)`);
    },
  },
  quit: {
    usage: "/quit",
    description: "leave / cancel the current game",
    run: async (ctx) => {
      const g = requireGame(ctx);
      if (g) await act(ctx, "game_quit", { id: g.id });
    },
  },
};
