// Feature: discord — UI ฝั่ง client ของ Discord bridge
// server ส่ง bridge_info บอกว่ากลุ่มไหน bridge กับ Discord และข้อความจาก Discord มี source: "discord"
import "./discord.css";

// ข้อความนี้มาจาก Discord ไม่ใช่จากผู้ใช้ในแอป (ชื่อซ้ำกับคนในแอปได้ จึงต้องดู source ด้วย)
export const isFromDiscord = (msg) => msg.source === "discord";

// ป้ายกำกับหลังชื่อผู้ส่งที่มาจาก Discord
export function DiscordTag() {
  return <span className="discord-tag">[discord]</span>;
}

// ป้ายหลังชื่อกลุ่มใน sidebar
export function BridgeMark() {
  return <span className="discord-tag"> ⇄ discord</span>;
}

// ข้อความต่อท้าย subtitle ของห้อง เช่น " · bridged to Discord #general"
export const bridgeSubtitle = (info) => (info ? ` · bridged to Discord${info.channel ? ` ${info.channel}` : ""}` : "");
