export type NewsCategory = "locations" | "payments";

export const NEWS_CATEGORIES: { id: "all" | NewsCategory; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "locations", label: "Новые локации" },
  { id: "payments", label: "Платежные системы" },
];

export interface NewsItem {
  id: number;
  category: NewsCategory;
  tags: string[];
  title: string;
  text: string;
  date: string;
  read: string;
}

export const NEWS: NewsItem[] = [
  {
    id: 1,
    category: "locations",
    tags: ["Новые локации", "Оптимизация маршрутов"],
    title: "Локация Россия уже доступна в Кубик VPN 🧊",
    text: "Новая локация Россия в Кубик VPN — ещё более быстрое и стабильное подключение. Доступ к Telegram и другим ресурсам, которые могут быть недоступны через обычного интернет-провайдера. Просто выберите «Россия» и подключитесь!",
    date: "29.08.2026",
    read: "1 мин чтения",
  },
  {
    id: 2,
    category: "payments",
    tags: ["Платежные системы", "Оплата по СБП"],
    title: "Оплаты по СБП снова доступны в Кубик VPN 🧊",
    text: "Оплата через СБП в Кубик VPN снова работает! Мы восстановили удобный способ продления подписки и уже готовим резервную платёжную систему для ещё большей стабильности и бесперебойной работы сервиса.",
    date: "14.08.2026",
    read: "1 мин чтения",
  },
];
