import { useEffect, useRef, useState } from "react";
import { isTouchDevice } from "./device.js";

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// R6: ห้องแชท 1 ห้อง = หน้าต่างแสดงข้อความ (chat window) + ช่องพิมพ์ (chat box)
// ใช้ component เดียวกันทั้งห้อง private และ group
// แสดงแบบ terminal log: [เวลา] ผู้ส่ง: ข้อความ / ช่องพิมพ์มี prompt "<me>@<ห้อง>:~$"
// onBack / backBadge: ปุ่ม [< back] สำหรับมือถือ (บนคอมถูกซ่อนด้วย CSS)
export default function ChatRoom({ title, subtitle, messages, me, onSend, onBack, backBadge, disabledReason }) {
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
        <button type="button" className="back-btn" onClick={onBack}>
          [&lt; back{backBadge > 0 ? ` (${backBadge})` : ""}]
        </button>
        <span className="room-heading">
          <span className="room-title">{title}</span>
          {subtitle && <span className="muted room-subtitle"> — {subtitle}</span>}
        </span>
      </header>

      <div className="chat-window">
        {messages.length === 0 && <p className="muted">-- no messages yet --</p>}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from === me ? "mine" : ""}`}>
            <span className="msg-time">[{formatTime(m.timestamp)}]</span>
            <span className="msg-from">{m.from}:</span>
            <span className="msg-text">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-box" onSubmit={handleSubmit}>
        <span className="term-prompt">
          <span className="prompt-long">
            {me}@{title}:~
          </span>
          $
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabledReason ?? "type a message and press Enter"}
          disabled={Boolean(disabledReason)}
          maxLength={1000}
          spellCheck={false}
          autoFocus={!isTouchDevice}
          enterKeyHint="send"
        />
        <button type="submit" disabled={Boolean(disabledReason) || !text.trim()}>
          [send ⏎]
        </button>
      </form>
    </section>
  );
}
