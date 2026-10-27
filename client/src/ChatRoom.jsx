import { useEffect, useRef, useState } from "react";

const formatTime = (iso) => new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

// R6: ห้องแชท 1 ห้อง = หน้าต่างแสดงข้อความ (chat window) + ช่องพิมพ์ (chat box)
// ใช้ component เดียวกันทั้งห้อง private และ group
export default function ChatRoom({ title, subtitle, messages, me, onSend, disabledReason }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // มีข้อความใหม่ (ทั้งที่ส่งเองและที่เข้ามา) → scroll ลงล่างสุด
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <section className="room">
      <header className="room-header">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>

      <div className="chat-window">
        {messages.length === 0 && <p className="muted center">ยังไม่มีข้อความ</p>}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from === me ? "mine" : ""}`}>
            {m.from !== me && <div className="msg-from">{m.from}</div>}
            <div className="msg-bubble">{m.text}</div>
            <div className="msg-time">{formatTime(m.timestamp)}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-box" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabledReason ?? "พิมพ์ข้อความ..."}
          disabled={Boolean(disabledReason)}
          maxLength={1000}
          autoFocus
        />
        <button type="submit" disabled={Boolean(disabledReason) || !text.trim()}>
          ส่ง
        </button>
      </form>
    </section>
  );
}
