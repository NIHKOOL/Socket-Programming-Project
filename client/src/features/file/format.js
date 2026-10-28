// Feature: file — แสดงขนาดไฟล์ / progress bar แบบ terminal (pure function test ได้จาก server/tests)

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// fraction 0–1 → "[########------------]"
export function progressBar(fraction, width = 20) {
  const filled = Math.round(Math.min(Math.max(fraction, 0), 1) * width);
  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}]`;
}

// รูปที่แสดงตัวอย่างในแชทได้ (ไม่รวม SVG: เปิดแล้วรัน script ได้)
const PREVIEW_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp"];
export const canPreview = (type) => PREVIEW_TYPES.includes(type);
