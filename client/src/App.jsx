import { useEffect, useRef, useState } from "react";
import { connect, DEFAULT_SERVER_URL } from "./socket.js";
import { dmRoomId, groupRoomId, parseRoomId, roomOfPrivateMsg } from "./rooms.js";
import ChatRoom from "./ChatRoom.jsx";
import { isTouchDevice } from "./device.js";
import { BridgeMark, bridgeSubtitle } from "./features/discord/index.jsx"; // Feature: discord
import "./App.css";

export default function App() {
  const socketRef = useRef(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [nameInput, setNameInput] = useState("");
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [bridges, setBridges] = useState({}); // Feature: discord — { groupName: { platform, channel } }

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

  // มือถือ: ปุ่ม [< back] ปิดห้อง → กลับไปหน้ารายชื่อ (ข้อความที่เข้ามาหลังจากนี้จะนับ unread)
  function closeRoom() {
    activeRoomRef.current = null;
    setActiveRoom(null);
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
    setBridges({}); // Feature: discord
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
    socket.on("connect_error", () => setError(`Cannot connect to ${serverUrl}`));
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
      setError("Disconnected from server. Please log in again.");
    });
    socket.on("user_list", ({ users }) => setUsers(users));
    socket.on("group_list", ({ groups }) => setGroups(groups));
    // R8: สร้างกลุ่มสำเร็จ → เปิดห้องกลุ่มให้ทันที
    socket.on("create_group_ok", ({ group }) => openRoom(groupRoomId(group)));
    // R10: เข้ากลุ่มสำเร็จ → เปิดห้องกลุ่มให้ทันที
    socket.on("join_group_ok", ({ group }) => openRoom(groupRoomId(group)));
    // Feature: discord — server บอกว่ากลุ่มไหน bridge กับ Discord
    socket.on("bridge_info", (info) => setBridges((prev) => ({ ...prev, [info.group]: info })));

    // R5: ข้อความที่เข้ามาถูกแยกลงห้องของตัวเอง
    socket.on("private_msg", (msg) => addMessage(roomOfPrivateMsg(msg, myName), msg));
    socket.on("group_msg", (msg) => addMessage(groupRoomId(msg.group), msg));
  }

  // R6: กดส่งในห้องไหน → emit event ตามประเภทห้อง
  // ไม่เพิ่มข้อความลงจอเอง รอ server ส่งกลับมา (echo) เพื่อให้ทุกเครื่องเห็นข้อมูลเดียวกับ server
  function sendToActiveRoom(text) {
    const { type, name } = parseRoomId(activeRoom);
    setError(""); // ล้าง error เก่า ถ้าส่งไม่ผ่าน server จะส่ง error_msg ใหม่มา
    if (type === "dm") socketRef.current.emit("private_msg", { to: name, text });
    else socketRef.current.emit("group_msg", { group: name, text });
  }

  // R8: สร้างกลุ่ม → server เพิ่มเราเป็นสมาชิกคนแรก แล้วส่ง group_list ใหม่ให้ทุกคน
  function handleCreateGroup(e) {
    e.preventDefault();
    const group = groupInput.trim();
    if (!group) return;
    setError("");
    socketRef.current.emit("create_group", { group });
    setGroupInput("");
  }

  // R10: ผู้ใช้กดเข้ากลุ่มเอง ส่งแค่ชื่อกลุ่ม server ใช้ชื่อของเราจาก socket
  function handleJoinGroup(group) {
    setError("");
    socketRef.current.emit("join_group", { group });
  }

  if (!me) {
    return (
      <div className="login-screen">
        <form className="terminal" onSubmit={handleLogin}>
          <div className="terminal-bar">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="terminal-title">simple-chat — login</span>
          </div>
          <div className="terminal-body">
            <p className="term-muted"># Simple Chat · Socket.IO client</p>
            <p>
              <span className="term-prompt">$</span> ./simple-chat --connect
            </p>
            <label className="term-line">
              <span className="term-prompt">server&gt;</span>
              <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} spellCheck={false} />
            </label>
            <label className="term-line">
              <span className="term-prompt">name&gt;</span>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                placeholder="your name (1–20 chars)"
                spellCheck={false}
                autoFocus={!isTouchDevice}
                required
              />
            </label>
            <button type="submit" className="term-button">
              &gt; login<span className="term-cursor">_</span>
            </button>
            {error && <p className="term-error">error: {error}</p>}
          </div>
        </form>
      </div>
    );
  }

  const myGroups = groups.filter((g) => g.members.includes(me));
  const memberCount = (n) => `${n} ${n === 1 ? "member" : "members"}`;
  const withYou = (name) => (name === me ? `${name} (you)` : name);
  const badge = (roomId) => (unread[roomId] > 0 ? <span className="badge">[{unread[roomId]}]</span> : null);
  // unread รวมของห้องอื่น แสดงที่ปุ่ม [< back] บนมือถือ
  const otherUnread = Object.entries(unread).reduce((sum, [id, n]) => (id === activeRoom ? sum : sum + n), 0);
  let serverHost = serverUrl;
  try {
    serverHost = new URL(serverUrl).host;
  } catch {
    // URL ไม่ถูกรูปแบบ แสดงตามที่ผู้ใช้กรอก
  }

  return (
    <div className="app-screen">
      <div className="terminal app-window">
        <div className="terminal-bar">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
          <span className="terminal-title">
            simple-chat — {me}@{serverHost}
          </span>
        </div>

        {/* room-open: มือถือแสดงทีละหน้า มีห้องเปิดอยู่ → ซ่อนรายชื่อ แสดงห้องเต็มจอ (ดู App.css) */}
        <div className={`app ${activeRoom ? "room-open" : ""}`}>
          <aside className="sidebar">
            <p>
              <span className="term-prompt">$</span> whoami
            </p>
            <p className="whoami">{me}</p>

            <h3># online ({users.length})</h3>
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
                      <span>@{withYou(u)}</span>
                      {badge(dmRoomId(u))}
                    </button>
                  </li>
                ))}
            </ul>

            <h3># groups ({groups.length})</h3>
            <form className="create-group" onSubmit={handleCreateGroup}>
              <span className="term-prompt">new&gt;</span>
              <input
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                placeholder="group name"
                maxLength={30}
                spellCheck={false}
              />
              <button type="submit" disabled={!groupInput.trim()}>
                [+ create]
              </button>
            </form>
            <ul className="room-list">
              {/* R9: แสดงทุกกลุ่มพร้อมสมาชิก / R5: กลุ่มที่เป็นสมาชิก → คลิกเปิดห้อง / R10: ยังไม่เป็นสมาชิก → ปุ่ม [join] */}
              {groups.map((g) => {
                const isMember = g.members.includes(me);
                const roomId = groupRoomId(g.name);
                return (
                  <li key={g.name} className="group-row">
                    <button
                      className={`room-item ${activeRoom === roomId ? "active" : ""}`}
                      onClick={() => openRoom(roomId)}
                      disabled={!isMember}
                    >
                      <span>
                        #{g.name}
                        {bridges[g.name] && <BridgeMark /> /* Feature: discord */}
                        <small>
                          {g.members.length > 0
                            ? `${memberCount(g.members.length)}: ${g.members.map(withYou).join(", ")}`
                            : "No members"}
                          {!isMember && " · not a member"}
                        </small>
                      </span>
                      {badge(roomId)}
                    </button>
                    {!isMember && (
                      <button className="join-btn" onClick={() => handleJoinGroup(g.name)}>
                        [join]
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {error && <p className="error">error: {error}</p>}
          </aside>

          <main className="main">
            {activeRoom ? (
              renderRoom()
            ) : (
              <p className="placeholder muted">
                -- select a user or group to start chatting --<span className="term-cursor">_</span>
              </p>
            )}
          </main>
        </div>
      </div>
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
          title={`@${name}`}
          subtitle={online ? "private · online" : "private · offline"}
          messages={roomMessages}
          me={me}
          onSend={sendToActiveRoom}
          onBack={closeRoom}
          backBadge={otherUnread}
          disabledReason={online ? null : `${name} is offline`}
        />
      );
    }

    const group = myGroups.find((g) => g.name === name);
    return (
      <ChatRoom
        key={activeRoom}
        title={`#${name}`}
        subtitle={
          (group ? `group · ${memberCount(group.members.length)}: ${group.members.join(", ")}` : "group") +
          bridgeSubtitle(bridges[name]) // Feature: discord
        }
        messages={roomMessages}
        me={me}
        onSend={sendToActiveRoom}
        onBack={closeRoom}
        backBadge={otherUnread}
        disabledReason={group ? null : "You are no longer a member of this group"}
      />
    );
  }
}
