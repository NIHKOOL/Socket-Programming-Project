import { useEffect, useRef, useState } from "react";
import { connect, DEFAULT_SERVER_URL } from "./socket.js";

export default function App() {
  const socketRef = useRef(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [nameInput, setNameInput] = useState("");
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    socketRef.current?.disconnect();

    const socket = connect(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("register", { name: nameInput }));
    socket.on("connect_error", () => setError(`เชื่อมต่อ ${serverUrl} ไม่ได้`));
    socket.on("register_ok", ({ name }) => setMe(name));
    socket.on("error_msg", ({ message }) => setError(message));
    socket.on("user_list", ({ users }) => setUsers(users));
    socket.on("group_list", ({ groups }) => setGroups(groups));
    // TODO: private_msg / group_msg → เก็บข้อความแยกตามห้อง (R5–R7, R11)
  }

  if (!me) {
    return (
      <form onSubmit={handleLogin} style={{ maxWidth: 360, margin: "4rem auto", display: "grid", gap: 8 }}>
        <h2>Simple Chat</h2>
        <label>
          Server URL
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} style={{ width: "100%" }} />
        </label>
        <label>
          ชื่อของคุณ
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ width: "100%" }} required />
        </label>
        <button type="submit">เข้าสู่ระบบ</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
    );
  }

  return (
    <div style={{ display: "flex", gap: 24, padding: 16 }}>
      <aside style={{ minWidth: 200 }}>
        <p>
          เข้าสู่ระบบเป็น <b>{me}</b>
        </p>
        <h3>ออนไลน์ ({users.length})</h3>
        <ul>
          {users.map((u) => (
            <li key={u}>{u === me ? `${u} (คุณ)` : u}</li>
          ))}
        </ul>
        <h3>กลุ่ม ({groups.length})</h3>
        <ul>
          {groups.map((g) => (
            <li key={g.name}>
              {g.name} — {g.members.join(", ")}
            </li>
          ))}
        </ul>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </aside>
      <main style={{ flex: 1 }}>
        {/* TODO: ห้องแชท (R5, R6) — ช่องพิมพ์ + หน้าต่างแสดงข้อความ, ปุ่มสร้าง/เข้ากลุ่ม (R8, R10) */}
        <p>เลือกผู้ใช้หรือกลุ่มเพื่อเริ่มแชท</p>
      </main>
    </div>
  );
}
