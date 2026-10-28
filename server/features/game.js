// Feature: game — เกมผลัดกันเล่นผ่าน socket (เริ่มที่ เป่ายิ้งฉุบ: Rock-Paper-Scissors)
//
//   C1 ──game_challenge──> server ──game_update (challenge)──> C1, C2
//   C2 ──game_respond────> server ──game_update (accepted)───> C1, C2
//   C1 ──game_move rock──> server  (เก็บไว้เป็นความลับ)  ──game_update (moved: แค่บอกว่า C1 เลือกแล้ว)──> C1, C2
//   C2 ──game_move paper─> server  ตัดสิน ──game_update (round/finished: เปิดคำตอบทั้งคู่ + คะแนน)──> C1, C2
//
// Server เป็นคนตัดสินทั้งหมด (server-authoritative): client แค่ส่ง "การกระทำ" server ตรวจว่าถูกกติกาไหม
// และคำตอบของคนที่เลือกก่อน**ไม่ถูกส่งให้ใคร**จนกว่าจะครบ 2 คน ถ้าส่งตรงหากัน อีกฝ่ายจะเห็นก่อนแล้วโกงได้
// update ทุกอันส่งให้ผู้เล่น 2 คนเท่านั้น (หลักเดียวกับ R7)

export const MOVES = ["rock", "paper", "scissors"];
const ALIASES = { r: "rock", p: "paper", s: "scissors" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const GAMES = { rps: "Rock-Paper-Scissors" };
const BEST_OF = [1, 3, 5];
const INVITE_TIMEOUT_MS = Number(process.env.GAME_INVITE_TIMEOUT_MS) || 60_000; // คำท้าหมดอายุ

// 0 = เสมอ, 1 = คนแรกชนะ, 2 = คนที่สองชนะ
export function rpsWinner(a, b) {
  if (a === b) return 0;
  return BEATS[a] === b ? 1 : 2;
}

export const normalizeMove = (move) => {
  const m = String(move ?? "").trim().toLowerCase();
  return MOVES.includes(m) ? m : ALIASES[m] ?? null;
};

const games = new Map(); // id → game
const playing = new Map(); // ชื่อผู้เล่น → id ของเกมที่เล่นอยู่ (1 คนเล่นได้ทีละเกม)
let nextId = 1;
let clients = null; // Map<name, socket> ของ core (ได้ตอน init)

// สถานะที่ส่งให้ผู้เล่น: **ไม่มี** คำตอบที่ยังไม่เปิด มีแค่ชื่อคนที่เลือกแล้ว
function publicState(g) {
  return {
    id: g.id,
    game: g.game,
    title: GAMES[g.game],
    players: g.players,
    bestOf: g.bestOf,
    status: g.status,
    round: g.round,
    score: { ...g.score },
    moved: g.players.filter((p) => p in g.moves),
  };
}

function send(g, event, extra = {}) {
  const update = { ...publicState(g), event, ...extra };
  for (const p of g.players) clients.get(p)?.emit("game_update", update);
}

function end(g) {
  clearTimeout(g.timer);
  for (const p of g.players) if (playing.get(p) === g.id) playing.delete(p);
  games.delete(g.id);
}

export default {
  name: "game",

  init(app) {
    clients = app.clients;
  },

  setupSocket(socket, { requireName }) {
    const reply = (ack, data) => typeof ack === "function" && ack(data);

    // หาเกมที่ผู้เล่นคนนี้อยู่ ตรวจว่าเป็นผู้เล่นจริง
    const myGame = (id, me) => {
      const g = games.get(String(id));
      return g && g.players.includes(me) ? g : null;
    };

    socket.on("game_challenge", ({ to, game = "rps", bestOf = 3 } = {}, ack) => {
      const me = requireName();
      if (!me) return;
      if (!GAMES[game]) return reply(ack, { ok: false, code: "UNKNOWN_GAME" });
      if (to === me) return reply(ack, { ok: false, code: "SELF" });
      if (!clients.has(to)) return reply(ack, { ok: false, code: "USER_NOT_FOUND" });
      if (playing.has(me)) return reply(ack, { ok: false, code: "YOU_ARE_BUSY" });
      if (playing.has(to)) return reply(ack, { ok: false, code: "OPPONENT_BUSY" });

      const g = {
        id: String(nextId++),
        game,
        players: [me, to], // players[0] = คนท้า, players[1] = คนถูกท้า
        bestOf: BEST_OF.includes(Number(bestOf)) ? Number(bestOf) : 3,
        status: "pending",
        round: 1,
        score: { [me]: 0, [to]: 0 },
        moves: {}, // ความลับ: { ชื่อ: move } ของรอบปัจจุบัน
      };
      games.set(g.id, g);
      playing.set(me, g.id);
      playing.set(to, g.id);
      g.timer = setTimeout(() => {
        if (g.status !== "pending") return;
        send(g, "expired");
        end(g);
      }, INVITE_TIMEOUT_MS);
      g.timer.unref?.();

      send(g, "challenge");
      reply(ack, { ok: true, id: g.id });
    });

    socket.on("game_respond", ({ id, accept } = {}, ack) => {
      const me = requireName();
      if (!me) return;
      const g = myGame(id, me);
      if (!g) return reply(ack, { ok: false, code: "NO_GAME" });
      if (g.status !== "pending") return reply(ack, { ok: false, code: "NOT_PENDING" });
      if (me !== g.players[1]) return reply(ack, { ok: false, code: "ONLY_INVITED" }); // คนท้ายอมรับแทนอีกฝ่ายไม่ได้

      clearTimeout(g.timer);
      if (!accept) {
        send(g, "declined", { by: me });
        end(g);
      } else {
        g.status = "playing";
        send(g, "accepted");
      }
      reply(ack, { ok: true });
    });

    socket.on("game_move", ({ id, move } = {}, ack) => {
      const me = requireName();
      if (!me) return;
      const g = myGame(id, me);
      if (!g) return reply(ack, { ok: false, code: "NO_GAME" });
      if (g.status !== "playing") return reply(ack, { ok: false, code: "NOT_PLAYING" });
      const m = normalizeMove(move);
      if (!m) return reply(ack, { ok: false, code: "BAD_MOVE" });
      if (me in g.moves) return reply(ack, { ok: false, code: "ALREADY_MOVED" });

      g.moves[me] = m;
      reply(ack, { ok: true, move: m }); // บอกคนเลือกคนเดียวว่าเลือกอะไร

      if (Object.keys(g.moves).length < 2) return send(g, "moved", { by: me }); // อีกฝ่ายรู้แค่ว่า "เลือกแล้ว"

      // ครบ 2 คน → เปิดคำตอบพร้อมกัน + ตัดสิน
      const [a, b] = g.players;
      const w = rpsWinner(g.moves[a], g.moves[b]);
      const result = { round: g.round, moves: { ...g.moves }, winner: w === 0 ? null : g.players[w - 1] };
      if (result.winner) g.score[result.winner]++;
      g.moves = {};
      g.round++;

      const need = Math.ceil(g.bestOf / 2);
      const champion = g.players.find((p) => g.score[p] >= need);
      if (champion) {
        g.status = "finished";
        send(g, "finished", { result, winner: champion });
        end(g);
      } else {
        send(g, "round", { result });
      }
    });

    socket.on("game_quit", ({ id } = {}, ack) => {
      const me = requireName();
      if (!me) return;
      const g = myGame(id, me);
      if (!g) return reply(ack, { ok: false, code: "NO_GAME" });
      g.status = "ended";
      send(g, "quit", { by: me });
      end(g);
      reply(ack, { ok: true });
    });

    // ผู้เล่นหลุดการเชื่อมต่อ → จบเกม แจ้งอีกฝ่าย (core ลบชื่อออกจาก clients ไปก่อนแล้ว จึงส่งถึงคนที่เหลือคนเดียว)
    socket.on("disconnect", () => {
      const name = socket.data.name;
      const g = name && games.get(playing.get(name));
      if (!g) return;
      g.status = "ended";
      send(g, "abandoned", { by: name });
      end(g);
    });
  },
};
