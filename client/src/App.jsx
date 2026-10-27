import { useEffect, useRef, useState } from "react";
import { connect, DEFAULT_SERVER_URL } from "./socket.js";
import { dmRoomId, groupRoomId, parseRoomId, roomOfPrivateMsg } from "./rooms.js";
import ChatRoom from "./ChatRoom.jsx";
import "./App.css";

export default function App() {
  const socketRef = useRef(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [nameInput, setNameInput] = useState("");
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  // R5: ข้อความเก็บแยกตามห้อง { "dm:C2": [...], "group:g1": [...] }
  const [messages, setMessages] = useState({});
  const [unread, setUnread] = useState({});
  const [activeRoom, setActiveRoom] = useState(null);
  // handler ของ socket ถูกสร้างครั้งเดียวตอน login จึงอ่าน state ล่าสุดผ่าน ref แทน
  const activeRoomRef = useRef(null);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  function openRoom(roomId) {
    activeRoomRef.current = roomId;
    setActiveRoom(roomId);
    setUnread((prev) => ({ ...prev, [roomId]: 0 }));
  }

  function addMessage(roomId, msg) {
    setMessages((prev) => ({ ...prev, [roomId]: [...(prev[roomId] ?? []), msg] }));
    if (roomId !== activeRoomRef.current) {
      setUnread((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
    }
  }

  function resetSession() {
    setMe(null);
    setUsers([]);
    setGroups([]);
    setMessages({});
    setUnread({});
    setActiveRoom(null);
    activeRoomRef.current = null;
  }

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    socketRef.current?.disconnect();

    const socket = connect(serverUrl);
    socketRef.current = socket;
    // dev mode เท่านั้น: เปิดให้ทดสอบส่ง event จาก DevTools Console ได้ เช่น
    // socket.emit("private_msg", { to: "C2", text: "hi" })
    if (import.meta.env.DEV) window.socket = socket;

    let registered = false;
    let myName = null;
    socket.on("connect", () => socket.emit("register", { name: nameInput }));
    socket.on("connect_error", () => setError(`เชื่อมต่อ ${serverUrl} ไม่ได้`));
    socket.on("register_ok", ({ name }) => {
      registered = true;
      myName = name;
      setMe(name);
    });
    socket.on("error_msg", ({ message }) => {
      setError(message);
      // R3: register ไม่ผ่าน (เช่น ชื่อซ้ำ) → ตัดการเชื่อมต่อ ให้ผู้ใช้เปลี่ยนชื่อแล้วกดเข้าใหม่
      if (!registered) socket.disconnect();
    });
    socket.on("disconnect", () => {
      if (!registered) return;
      // R4: หลุดจาก server → ล้างข้อมูลที่ค้างอยู่ แล้วกลับไปหน้า login
      resetSession();
      setError("หลุดการเชื่อมต่อจาก server กรุณาเข้าสู่ระบบใหม่");
    });
    socket.on("user_list", ({ users }) => setUsers(users));
    socket.on("group_list", ({ groups }) => setGroups(groups));

    // R5: ข้อความที่เข้ามาถูกแยกลงห้องของตัวเอง
    socket.on("private_msg", (msg) => addMessage(roomOfPrivateMsg(msg, myName), msg));
    socket.on("group_msg", (msg) => addMessage(groupRoomId(msg.group), msg));
  }

  // R6: กดส่งในห้องไหน → emit event ตามประเภทห้อง
  // ไม่เพิ่มข้อความลงจอเอง รอ server ส่งกลับมา (echo) เพื่อให้ทุกเครื่องเห็นข้อมูลเดียวกับ server
  function sendToActiveRoom(text) {
    const { type, name } = parseRoomId(activeRoom);
    if (type === "dm") socketRef.current.emit("private_msg", { to: name, text });
    else socketRef.current.emit("group_msg", { group: name, text });
  }

  if (!me) {
    return (
      <form className="login" onSubmit={handleLogin}>
        <h2>Simple Chat</h2>
        <label>
          Server URL
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
        </label>
        <label>
          ชื่อของคุณ
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={20} required />
        </label>
        <button type="submit">เข้าสู่ระบบ</button>
        {error && <p className="error">{error}</p>}
      </form>
    );
  }

  const myGroups = groups.filter((g) => g.members.includes(me));
  const badge = (roomId) => (unread[roomId] > 0 ? <span className="badge">{unread[roomId]}</span> : null);

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          เข้าสู่ระบบเป็น <b>{me}</b>
        </div>

        <h3>ออนไลน์ ({users.length})</h3>
        <ul className="room-list">
          {/* R4: ชื่อตัวเองอยู่บนสุด ที่เหลือเรียงตามตัวอักษร / R5: คลิกชื่อคนอื่น → เปิดห้อง private */}
          {[...users]
            .sort((a, b) => (a === me ? -1 : b === me ? 1 : a.localeCompare(b)))
            .map((u) => (
              <li key={u}>
                <button
                  className={`room-item ${activeRoom === dmRoomId(u) ? "active" : ""}`}
                  onClick={() => openRoom(dmRoomId(u))}
                  disabled={u === me}
                >
                  <span>{u === me ? `${u} (คุณ)` : u}</span>
                  {badge(dmRoomId(u))}
                </button>
              </li>
            ))}
        </ul>

        <h3>กลุ่ม ({groups.length})</h3>
        <ul className="room-list">
          {/* R5: กลุ่มที่เป็นสมาชิก → คลิกเปิดห้อง group (ปุ่มสร้าง/เข้ากลุ่มจะทำใน R8, R10) */}
          {groups.map((g) => {
            const isMember = g.members.includes(me);
            const roomId = groupRoomId(g.name);
            return (
              <li key={g.name}>
                <button
                  className={`room-item ${activeRoom === roomId ? "active" : ""}`}
                  onClick={() => openRoom(roomId)}
                  disabled={!isMember}
                >
                  <span>
                    {g.name}
                    <small>
                      {g.members.join(", ")}
                      {!isMember && " · ยังไม่ได้เป็นสมาชิก"}
                    </small>
                  </span>
                  {badge(roomId)}
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p className="error">{error}</p>}
      </aside>

      <main className="main">{activeRoom ? renderRoom() : <p className="placeholder muted">เลือกผู้ใช้หรือกลุ่มเพื่อเริ่มแชท</p>}</main>
    </div>
  );

  function renderRoom() {
    const { type, name } = parseRoomId(activeRoom);
    const roomMessages = messages[activeRoom] ?? [];

    if (type === "dm") {
      const online = users.includes(name);
      return (
        <ChatRoom
          key={activeRoom}
          title={name}
          subtitle={online ? "Private chat · ออนไลน์" : "Private chat · ออฟไลน์"}
          messages={roomMessages}
          me={me}
          onSend={sendToActiveRoom}
          disabledReason={online ? null : `${name} ออฟไลน์อยู่`}
        />
      );
    }

    const group = myGroups.find((g) => g.name === name);
    return (
      <ChatRoom
        key={activeRoom}
        title={`# ${name}`}
        subtitle={group ? `Group chat · สมาชิก ${group.members.length} คน: ${group.members.join(", ")}` : "Group chat"}
        messages={roomMessages}
        me={me}
        onSend={sendToActiveRoom}
        disabledReason={group ? null : "คุณไม่ได้เป็นสมาชิกกลุ่มนี้แล้ว"}
      />
    );
  }
}
