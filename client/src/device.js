// อุปกรณ์จอสัมผัส (มือถือ / แท็บเล็ต): ไม่ autofocus ช่องพิมพ์ เพราะคีย์บอร์ดจะเด้งขึ้นมาบังจอทันที
export const isTouchDevice = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches === true;
