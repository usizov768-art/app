// Витринные значения тарифов (то, что показываем, пока сервер не прислал свои цены).
import type { PlanId, PlanInfo, Status } from "@/lib/api";

export interface TariffView {
  id: PlanId;
  name: string;
  description: string;
  defaults: Required<PlanInfo>;
  accent: string;
}

export const TARIFFS: TariffView[] = [
  {
    id: "standard",
    name: "Кубик Стандарт",
    description:
      "Простой и выгодный тариф для личного использования. Быстрое и стабильное соединение, защита данных и доступ ко всем серверам сервиса на 2 устройствах.",
    defaults: { price_rub: 99, days: 30, traffic_gb: 150, devices: 2 },
    accent: "sky",
  },
  {
    id: "pro",
    name: "Кубик Про",
    description:
      "Максимум возможностей: больше трафика и 3 устройства одновременно. Отлично подходит для смартфона, ноутбука и планшета под одним аккаунтом.",
    defaults: { price_rub: 179, days: 30, traffic_gb: 300, devices: 3 },
    accent: "violet",
  },
];

export const TRIAL = {
  name: "Кубик Лайт",
  description:
    "Попробуйте Кубик VPN бесплатно перед покупкой. Тестовая подписка выдаётся за подписку на наш Telegram-канал и позволяет в течение 3 дней оценить скорость, стабильность и безопасность сервиса. После окончания тестового периода вы сможете выбрать подходящий тариф.",
  days: 3,
};

/** Объединяет значения по умолчанию с тем, что вернул сервер (если вернул). */
export function planInfo(status: Status | null, t: TariffView): Required<PlanInfo> {
  return { ...t.defaults, ...(status?.plans?.[t.id] ?? {}) };
}
