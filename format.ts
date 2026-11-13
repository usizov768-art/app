// Только форматирование того, что пришло с сервера. Никаких расчётов денег/скидок/сроков.

export function fmtBytes(bytes?: number): string {
  const b = bytes ?? 0;
  if (b <= 0) return "0 МБ";
  const MB = 1024 ** 2;
  if (b < 1024 ** 3) return `${Math.max(1, Math.round(b / MB))} МБ`;
  if (b < 1024 ** 4) return `${(b / 1024 ** 3).toFixed(1)} ГБ`;
  return `${(b / 1024 ** 4).toFixed(2)} ТБ`;
}

export function fmtMoney(v?: number | null): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toDate(v: number | string): Date {
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  const n = Number(v);
  if (!Number.isNaN(n) && /^\d+$/.test(v)) return new Date(n < 1e12 ? n * 1000 : n);
  return new Date(v.includes("T") || v.includes("Z") ? v : v.replace(" ", "T"));
}

export function fmtDate(v?: number | string | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const d = toDate(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(v?: number | string | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const d = toDate(v);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Подпись «сколько осталось» по полю expire (unix-секунды) */
export function fmtLeft(expire?: number): string {
  if (!expire) return "—";
  const diff = expire - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Истекла";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d} ${plural(d, "день", "дня", "дней")} ${h} ч`;
  if (h > 0) return `${h} ч ${m} мин`;
  return `${Math.max(m, 1)} мин`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export function discountLabel(type: "percent" | "fixed", value: number): string {
  return type === "percent" ? `−${value}%` : `−${value} ₽`;
}
