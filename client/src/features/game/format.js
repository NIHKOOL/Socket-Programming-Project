// Feature: game — แปลง game_update จาก server เป็นบรรทัดข้อความ (มุมมองของผู้เล่นแต่ละคน)
// pure function: test ได้จาก server/tests

const EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" };
const show = (move) => `${EMOJI[move] ?? ""} ${move}`;
export const MOVE_HINT = "/move rock | paper | scissors";

export const opponentOf = (u, me) => u.players.find((p) => p !== me);

const scoreLine = (u) => {
  const [a, b] = u.players;
  return `score ${a} ${u.score[a]} – ${u.score[b]} ${b}`;
};

// เรียงตามผู้เล่น (คนท้าก่อน) ไม่ใช่ตามว่าใครเลือกก่อน ทุกรอบจะได้อยู่ตำแหน่งเดิม
const roundLine = (r, me, [a, b]) => {
  const outcome = r.winner === null ? "draw" : r.winner === me ? "you win the round" : `${r.winner} wins the round`;
  return `round ${r.round}: ${a} ${show(r.moves[a])} vs ${b} ${show(r.moves[b])} → ${outcome}`;
};

export function formatUpdate(u, me) {
  const opp = opponentOf(u, me);
  const meta = `${u.title} (best of ${u.bestOf})`;
  switch (u.event) {
    case "challenge":
      return u.players[0] === me
        ? [`[game] challenge sent to ${opp}: ${meta} · waiting for answer... (/quit to cancel)`]
        : [`[game] ${opp} challenged you to ${meta} · /accept or /decline`];
    case "accepted":
      return [`[game] game on! ${meta} vs ${opp}`, `[game] round 1 · choose: ${MOVE_HINT}`];
    case "moved":
      return u.by === me ? [`[game] waiting for ${opp}...`] : [`[game] ${opp} has chosen · your move: ${MOVE_HINT}`];
    case "round":
      return [`[game] ${roundLine(u.result, me, u.players)}`, `[game] ${scoreLine(u)} · round ${u.round}: ${MOVE_HINT}`];
    case "finished":
      return [
        `[game] ${roundLine(u.result, me, u.players)}`,
        `[game] 🏆 ${u.winner === me ? "you win" : `${u.winner} wins`} the game! ${scoreLine(u)}`,
      ];
    case "declined":
      return [u.by === me ? `[game] you declined ${opp}'s challenge` : `[game] ${opp} declined your challenge`];
    case "expired":
      return [`[game] challenge expired (no answer in time)`];
    case "quit":
      return [u.by === me ? `[game] you left the game` : `[game] ${opp} left the game — you win by forfeit`];
    case "abandoned":
      return [`[game] ${u.by} disconnected — game over`];
    default:
      return [];
  }
}

// event ที่ทำให้เกมจบ (ไม่มีเกมค้างอยู่แล้ว)
export const isGameOver = (event) => ["finished", "declined", "expired", "quit", "abandoned"].includes(event);
