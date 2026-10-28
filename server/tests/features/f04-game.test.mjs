// Feature: game — เป่ายิ้งฉุบ: server ตัดสิน, ซ่อนคำตอบจนครบ 2 คน, ส่งเฉพาะผู้เล่น 2 คน
import { io, URL, wait, check, done } from "../helpers.mjs";
import { normalizeMove, rpsWinner } from "../../features/game.js";
import { formatUpdate } from "../../../client/src/features/game/format.js";

const ack = (c, ev, data) => c.s.timeout(3000).emitWithAck(ev, data);
async function player(name) {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false });
  const p = { s, updates: [], raw: [] };
  s.on("game_update", (u) => {
    p.updates.push(u);
    p.raw.push(JSON.stringify(u));
  });
  s.emit("register", { name });
  await wait(150);
  return p;
}
const last = (p) => p.updates.at(-1);

// ---- กติกา (pure) ----
check("rpsWinner: rock beats scissors / paper beats rock / scissors beats paper", rpsWinner("rock", "scissors") === 1 && rpsWinner("rock", "paper") === 2 && rpsWinner("scissors", "paper") === 1);
check("rpsWinner: same move = draw", rpsWinner("paper", "paper") === 0);
check("normalizeMove: aliases + case", normalizeMove("R") === "rock" && normalizeMove(" Paper ") === "paper" && normalizeMove("s") === "scissors" && normalizeMove("lizard") === null);

const A = await player("A"), B = await player("B"), C = await player("C");

// ---- error ก่อนเริ่ม ----
check("challenge yourself → SELF", (await ack(A, "game_challenge", { to: "A" })).code === "SELF");
check("challenge offline user → USER_NOT_FOUND", (await ack(A, "game_challenge", { to: "Nobody" })).code === "USER_NOT_FOUND");
check("unknown game → UNKNOWN_GAME", (await ack(A, "game_challenge", { to: "B", game: "chess" })).code === "UNKNOWN_GAME");

// ---- ท้า + ตอบรับ ----
const ch = await ack(A, "game_challenge", { to: "B", bestOf: 3 });
await wait(150);
const id = ch.id;
check("challenge ok → both players get 'challenge'", ch.ok && last(A).event === "challenge" && last(B).event === "challenge" && last(B).players.join() === "A,B");
check("A busy → cannot start another game", (await ack(A, "game_challenge", { to: "C" })).code === "YOU_ARE_BUSY");
check("C cannot challenge busy B", (await ack(C, "game_challenge", { to: "B" })).code === "OPPONENT_BUSY");
check("move before accept → NOT_PLAYING", (await ack(A, "game_move", { id, move: "r" })).code === "NOT_PLAYING");
check("challenger cannot accept for opponent → ONLY_INVITED", (await ack(A, "game_respond", { id, accept: true })).code === "ONLY_INVITED");
check("outsider C cannot touch the game → NO_GAME", (await ack(C, "game_respond", { id, accept: true })).code === "NO_GAME");

await ack(B, "game_respond", { id, accept: true });
await wait(150);
check("accept → status playing for both", last(A).event === "accepted" && last(B).status === "playing");

// ---- รอบ 1: ซ่อนคำตอบ ----
const mv = await ack(A, "game_move", { id, move: "rock" });
await wait(150);
check("move ack tells only the mover what they chose", mv.ok && mv.move === "rock");
check("B learns only that A has chosen (moved=[A])", last(B).event === "moved" && last(B).by === "A" && last(B).moved.join() === "A");
check("A's move is HIDDEN from B (no 'rock' anywhere in B's updates)", !B.raw.some((r) => r.includes("rock")));
check("A cannot move twice in a round → ALREADY_MOVED", (await ack(A, "game_move", { id, move: "paper" })).code === "ALREADY_MOVED");
check("bad move → BAD_MOVE", (await ack(B, "game_move", { id, move: "lizard" })).code === "BAD_MOVE");

await ack(B, "game_move", { id, move: "s" }); // rock vs scissors → A ชนะ
await wait(150);
const r1 = last(A);
check("round revealed to both: moves + winner A + score 1–0", r1.event === "round" && r1.result.moves.A === "rock" && r1.result.moves.B === "scissors" && r1.result.winner === "A" && r1.score.A === 1 && r1.score.B === 0 && last(B).event === "round");

// ---- รอบ 2: เสมอไม่นับ / รอบ 3: A ชนะ → จบ (best of 3 = ชนะ 2) ----
await ack(A, "game_move", { id, move: "paper" });
await ack(B, "game_move", { id, move: "paper" });
await wait(150);
check("draw: no point, round continues", last(A).event === "round" && last(A).result.winner === null && last(A).score.A === 1 && last(A).round === 3);
await ack(B, "game_move", { id, move: "rock" });
await ack(A, "game_move", { id, move: "paper" });
await wait(150);
check("best of 3: A reaches 2 wins → finished, winner A", last(A).event === "finished" && last(A).winner === "A" && last(B).winner === "A" && last(A).score.A === 2);
check("after finish: no game → NO_GAME", (await ack(A, "game_move", { id, move: "r" })).code === "NO_GAME");

// ---- ความเป็นส่วนตัว ----
check("outsider C received NO game updates at all", C.updates.length === 0);

// ---- decline / quit / disconnect / expire ----
const g2 = await ack(B, "game_challenge", { to: "A", bestOf: 1 });
await wait(100);
await ack(A, "game_respond", { id: g2.id, accept: false });
await wait(150);
check("decline → both get 'declined' by A, players free again", last(B).event === "declined" && last(B).by === "A" && (await ack(A, "game_challenge", { to: "C" })).ok);
await wait(100);
const g3 = last(C).id;
await ack(C, "game_quit", { id: g3 });
await wait(150);
check("quit (even while pending) → 'quit' by C", last(A).event === "quit" && last(A).by === "C");

const g4 = await ack(A, "game_challenge", { to: "B" });
await wait(100);
await ack(B, "game_respond", { id: g4.id, accept: true });
await wait(100);
B.s.disconnect();
await wait(250);
check("opponent disconnects mid-game → 'abandoned' by B", last(A).event === "abandoned" && last(A).by === "B");

await ack(A, "game_challenge", { to: "C" });
await wait(1900); // GAME_INVITE_TIMEOUT_MS = 1500 (ตั้งใน run-all.mjs)
check("unanswered challenge → 'expired'", last(A).event === "expired" && last(C).event === "expired");

// ---- client: ข้อความที่แต่ละคนเห็น ----
const u = { title: "Rock-Paper-Scissors", bestOf: 3, players: ["A", "B"], score: { A: 1, B: 0 }, round: 2 };
check("format challenge: B sees /accept hint", formatUpdate({ ...u, event: "challenge" }, "B")[0].includes("A challenged you") && formatUpdate({ ...u, event: "challenge" }, "B")[0].includes("/accept"));
check("format moved: opponent prompted, mover waits", formatUpdate({ ...u, event: "moved", by: "A" }, "B")[0].includes("A has chosen") && formatUpdate({ ...u, event: "moved", by: "A" }, "A")[0].includes("waiting for B"));
const roundU = { ...u, event: "round", result: { round: 1, moves: { B: "scissors", A: "rock" }, winner: "A" } };
check("format round: players in fixed order (A first) even if B moved first", formatUpdate(roundU, "B")[0].includes("A ✊ rock vs B ✌️ scissors → A wins the round"));
check("format finished: winner sees 'you win'", formatUpdate({ ...roundU, event: "finished", winner: "A" }, "A")[1].includes("you win the game"));

for (const p of [A, C]) p.s.disconnect();
done();
