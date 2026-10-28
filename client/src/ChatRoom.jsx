import { useEffect, useRef, useState } from "react";
import { isTouchDevice } from "./device.js";
import { DiscordTag, isFromDiscord } from "./features/discord/index.jsx"; // Feature: discord
import { SystemLine } from "./features/commands/SystemLine.jsx"; // Feature: ping
import { AiTag, isFromAi } from "./features/guess/AiTag.jsx"; // Feature: guess
import { FileMessage } from "./features/file/FileMessage.jsx"; // Feature: file

const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// R6: ห้องแชท 1 ห้อง = หน้าต่างแสดงข้อความ (chat window) + ช่องพิมพ์ (chat box)
// ใช้ component เดียวกันทั้งห้อง private และ group
// แสดงแบบ terminal log: [เวลา] ผู้ส่ง: ข้อความ / ช่องพิมพ์มี prompt "<me>@<ห้อง>:~$"
// onBack / backBadge: ปุ่ม [< back] สำหรับมือถือ (บนคอมถูกซ่อนด้วย CSS)
// onSendFile: Feature file — ส่งไฟล์ด้วยปุ่ม [+file] / ลากมาวาง / วางรูปจาก clipboard
export default function ChatRoom({ title, subtitle, messages, me, onSend, onSendFile, onBack, backBadge, disabledReason }) {
  const [text, setText] = useState("");
  const [dropping, setDropping] = useState(false); // Feature: file
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

  // Feature: file — ไฟล์จากปุ่ม / การลากวาง / clipboard ส่งทีละไฟล์
  function sendFiles(files) {
    if (disabledReason) return;
    for (const f of files) onSendFile(f);
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

      <div
        className={`chat-window ${dropping ? "drop-target" : ""}`}
        onDragOver={(e) => {
          e.preventDefault(); // Feature: file — อนุญาตให้วางไฟล์
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropping(false);
          sendFiles(e.dataTransfer.files);
        }}
      >
        {messages.length === 0 && <p className="muted">-- no messages yet --</p>}
        {messages.map((m, i) => {
          if (m.system) return <SystemLine key={i} text={m.text} />; // Feature: ping — ผลลัพธ์ของคำสั่ง
          // Feature: discord — ข้อความจาก Discord ไม่ใช่ของเรา แม้ชื่อจะตรงกับเรา
          const discord = isFromDiscord(m);
          const ai = isFromAi(m); // Feature: guess — ข้อความจาก AI ของเกมทายคำ
          const mine = m.from === me && !m.source; // ข้อความที่มี source (discord / ai) ไม่ใช่ของเราเสมอ
          return (
            <div key={i} className={`msg ${mine ? "mine" : ""} ${discord ? "from-discord" : ""} ${ai ? "from-ai" : ""}`}>
              <span className="msg-time">[{formatTime(m.timestamp)}]</span>
              <span className="msg-from">
                {m.from}
                {discord && <> <DiscordTag /></>}
                {ai && <> <AiTag /></>}:
              </span>
              <span className="msg-text">{m.file ? <FileMessage file={m.file} /> : m.text /* Feature: file */}</span>
            </div>
          );
        })}
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
          onPaste={(e) => e.clipboardData.files.length > 0 && (e.preventDefault(), sendFiles(e.clipboardData.files))} // Feature: file
          placeholder={disabledReason ?? "type a message, or /help for commands"}
          disabled={Boolean(disabledReason)}
          maxLength={1000}
          spellCheck={false}
          autoFocus={!isTouchDevice}
          enterKeyHint="send"
        />
        {/* Feature: file — ปุ่มเลือกไฟล์ (บนมือถือเปิดกล้อง / คลังรูปได้) */}
        <label className={`attach-btn ${disabledReason ? "disabled" : ""}`}>
          <button type="button" disabled={Boolean(disabledReason)} onClick={(e) => e.currentTarget.nextSibling.click()}>
            [+file]
          </button>
          <input
            type="file"
            multiple
            onChange={(e) => {
              sendFiles(e.target.files);
              e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้
            }}
          />
        </label>
        <button type="submit" disabled={Boolean(disabledReason) || !text.trim()}>
          [send ⏎]
        </button>
      </form>
    </section>
  );
}
