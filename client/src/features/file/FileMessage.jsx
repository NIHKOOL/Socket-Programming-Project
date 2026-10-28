// Feature: file — ข้อความไฟล์ในห้องแชท: progress ระหว่างส่ง/รับ → รูปตัวอย่าง + ลิงก์ดาวน์โหลดเมื่อครบ
import { canPreview, formatSize, progressBar } from "./format.js";
import "./file.css";

export function FileMessage({ file }) {
  const fraction = file.size ? file.done / file.size : 0;
  const busy = file.status === "sending" || file.status === "receiving";
  const done = file.status === "done";
  return (
    <span className="file-msg">
      <span className="file-name">
        📎 {file.name} <span className="muted">({formatSize(file.size)})</span>
      </span>
      {busy && (
        <span className="file-progress">
          {progressBar(fraction)} {Math.round(fraction * 100)}% {file.status}...
        </span>
      )}
      {file.status === "failed" && <span className="file-failed">✗ transfer failed: {file.reason}</span>}
      {done && file.url && canPreview(file.type) && <img className="file-preview" src={file.url} alt={file.name} />}
      {done && file.url && (
        <span>
          <a className="file-download" href={file.url} download={file.name}>
            [download]
          </a>
          {file.seconds !== undefined && (
            <span className="muted">
              {" "}
              sent in {file.seconds.toFixed(1)}s ({formatSize(Math.round(file.size / Math.max(file.seconds, 0.001)))}/s)
            </span>
          )}
        </span>
      )}
    </span>
  );
}
