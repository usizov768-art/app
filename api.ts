// ЕДИНСТВЕННЫЙ файл, где есть сетевые запросы (fetch).
// Фронтенд ничего не считает сам: деньги, скидки, рефералы и сроки приходят с сервера.

import { ApiError } from "./errors";
import { getInitData, getTgUser } from "./tg";

const env = import.meta.env as Record<string, string | undefined>;

/** Базовый адрес. Vite отдаёт в браузер только переменные с префиксом VITE_ (см. CHECK.md). */
export const API_BASE: string = (env.VITE_API_BASE || "https://panel.kybic.online/api/bot").replace(/\/+$/, "");

const FORCE_MOCK = env.VITE_MOCK === "1";

/** Тестовые данные: при VITE_MOCK=1 или когда приложение открыто не из Telegram (предпросмотр). */
export function isMock(): boolean {
  return FORCE_MOCK || !getInitData();
}

/* ------------------------------------------------------------------ */
/* Типы ответов                                                        */
/* ------------------------------------------------------------------ */

export type PlanId = "standard" | "pro";

export interface Device {
  id?: string;
  name?: string;
  model?: string;
  platform?: string;
  last_seen?: number | string;
}

export interface SubFields {
  sub_url: string;
  used_traffic: number; // байты
  data_limit: number; // байты (0 = без лимита)
  expire: number; // unix-секунды
  device_limit: number;
  devices: Device[];
}

export interface PlanInfo {
  price_rub?: number;
  days?: number;
  traffic_gb?: number;
  devices?: number;
}

export interface StatusBase {
  active: boolean;
  ref_count: number;
  spins: number;
  ref_link: string;
  bonus_available: boolean;
  bonus_next_at: number | null;
  /** Необязательно: если сервер пришлёт цены, они будут показаны вместо значений по умолчанию */
  plans?: Partial<Record<PlanId, PlanInfo>>;
}

export type Status = StatusBase & Partial<SubFields>;

export interface ActivateResponse extends Partial<SubFields> {
  success: true;
}
export interface ClaimBonusResponse extends Partial<SubFields> {
  success: true;
  bonus_label: string;
}
export interface PromoResponse {
  success: true;
  discount_type: "percent" | "fixed";
  discount_value: number;
}
export interface PaymentResponse {
  success: true;
  pay_url: string;
  final_amount: number;
}

export interface Ticket {
  id: number;
  title: string;
  status: string; // "open" | "closed" | "answered" ...
  created_at: number | string;
}
export interface TicketsResponse {
  tickets: Ticket[];
  is_admin: boolean;
}
export interface TicketMessage {
  id?: number;
  sender_name: string;
  message: string;
  is_admin?: boolean;
  created_at: number | string;
}

export interface BalanceResponse {
  balance_rub: number;
}
export type HistoryType = "deposit" | "purchase" | "referral_reward" | "gift";
export interface HistoryItem {
  id: number | string;
  type: HistoryType;
  amount_rub: number;
  description: string;
  created_at: number | string;
}
export interface HistoryResponse {
  items: HistoryItem[];
  pages: number;
}
export interface TopupResponse {
  success: true;
  pay_url: string;
}
export interface BuyResponse extends Partial<SubFields> {
  success: true;
  pay_url?: string;
}
export interface ReferralsResponse {
  ref_count: number;
  ref_link: string;
  reward_text?: string;
  items: { name: string; joined_at: number | string }[];
}
export interface GiftCreateResponse {
  success: true;
  code: string;
}
export interface GiftRedeemResponse extends Partial<SubFields> {
  success: true;
}

/* ------------------------------------------------------------------ */
/* Низкоуровневый запрос                                               */
/* ------------------------------------------------------------------ */

type Query = Record<string, string | number | undefined>;

interface Opts {
  query?: Query;
  body?: Record<string, unknown>;
}

function userId(): number {
  const id = getTgUser()?.id;
  if (id) return id;
  if (isMock()) return 100000001;
  throw new ApiError("unauthorized");
}

function firstName(): string {
  return getTgUser()?.first_name || (isMock() ? "Кубик Support" : "User");
}

async function request<T>(method: "GET" | "POST", path: string, opts: Opts = {}): Promise<T> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 320));
    return mockServer(method, path, opts) as T;
  }

  const qs = opts.query
    ? "?" +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";

  let res: Response;
  try {
    res = await fetch(API_BASE + path + qs, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": window.Telegram?.WebApp?.initData ?? "",
      },
      body: method === "POST" ? JSON.stringify(opts.body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError("network");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  const d = data as { success?: boolean; error?: string } | null;

  if (d && d.success === false) throw new ApiError(d.error || "server_error");
  if (!res.ok) throw new ApiError(d?.error || `http_${res.status}`);
  if (data === null || typeof data !== "object") throw new ApiError("bad_response");
  return data as T;
}

/* ------------------------------------------------------------------ */
/* Запросы, которые уже есть на сервере                                */
/* ------------------------------------------------------------------ */

export const getStatus = () => request<Status>("GET", "/status", { query: { user_id: userId() } });

export const activateTrial = () =>
  request<ActivateResponse>("POST", "/activate", { body: { user_id: userId(), first_name: firstName() } });

export const resetDevices = () =>
  request<{ success: true }>("POST", "/reset_devices", { body: { user_id: userId() } });

export const claimBonus = () => request<ClaimBonusResponse>("POST", "/claim_bonus", { body: { user_id: userId() } });

export const checkPromo = (code: string) =>
  request<PromoResponse>("POST", "/check_promo", { body: { user_id: userId(), code } });

export const createPayment = (plan: PlanId, promo_code?: string) =>
  request<PaymentResponse>("POST", "/create_payment", {
    body: { user_id: userId(), plan, ...(promo_code ? { promo_code } : {}) },
  });

export const getTickets = () => request<TicketsResponse>("GET", "/get_tickets", { query: { user_id: userId() } });

export const getMessages = (ticket_id: number) =>
  request<{ messages: TicketMessage[] }>("GET", "/get_messages", { query: { ticket_id } });

export const createTicket = (title: string, message: string) =>
  request<{ success: true }>("POST", "/create_ticket", {
    body: { user_id: userId(), first_name: firstName(), title, message },
  });

export const replyTicket = (ticket_id: number, message: string) =>
  request<{ success: true }>("POST", "/reply_ticket", {
    body: { ticket_id, user_id: userId(), sender_name: firstName(), message },
  });

/* ------------------------------------------------------------------ */
/* Запросы, которые будут добавлены на сервере позже                   */
/* ------------------------------------------------------------------ */

export const getBalance = () => request<BalanceResponse>("GET", "/balance", { query: { user_id: userId() } });

export const getBalanceHistory = (page = 1) =>
  request<HistoryResponse>("GET", "/balance/history", { query: { user_id: userId(), page } });

export type TopupMethod = "sbp" | "crypto" | "stars";
export const topupBalance = (amount_rub: number, method?: TopupMethod) =>
  request<TopupResponse>("POST", "/balance/topup", {
    body: { user_id: userId(), amount_rub, ...(method ? { method } : {}) },
  });

export const buyPlan = (plan: PlanId, pay_with: "balance" | "card", promo_code?: string) =>
  request<BuyResponse>("POST", "/plans/buy", {
    body: { user_id: userId(), plan, pay_with, ...(promo_code ? { promo_code } : {}) },
  });

export const getReferrals = () =>
  request<ReferralsResponse>("GET", "/referrals", { query: { user_id: userId() } });

export const createGift = (plan: PlanId) =>
  request<GiftCreateResponse>("POST", "/gift/create", { body: { user_id: userId(), plan } });

export const redeemGift = (code: string) =>
  request<GiftRedeemResponse>("POST", "/gift/redeem", { body: { user_id: userId(), code } });

/* ------------------------------------------------------------------ */
/* MOCK: имитация сервера (только в памяти, ничего не сохраняется)     */
/* ------------------------------------------------------------------ */

const nowSec = () => Math.floor(Date.now() / 1000);
const GB = 1024 ** 3;
const DAY = 86400;

const mock = {
  sub: null as null | SubFields,
  balance: 0,
  bonusNextAt: null as number | null,
  usedGifts: new Set<string>(),
  gifts: new Set<string>(),
  tickets: [
    { id: 1, title: "ВПН", status: "closed", created_at: nowSec() - 3 * DAY },
  ] as Ticket[],
  messages: {
    1: [
      { id: 1, sender_name: "Кубик Support", message: "Здравствуйте! Не подключается VPN на телефоне.", created_at: nowSec() - 3 * DAY },
      { id: 2, sender_name: "Поддержка", message: "Попробуйте сбросить устройства в разделе «Подписка».", is_admin: true, created_at: nowSec() - 3 * DAY + 600 },
    ],
  } as Record<number, TicketMessage[]>,
  nextTicket: 2,
  refLink: "https://t.me/kubik_vpn_bot?start=ref_100000001",
};

function mockPlanFields(plan: "trial" | PlanId): SubFields {
  const spec = {
    trial: { days: 3, gb: 10, dev: 1 },
    standard: { days: 30, gb: 150, dev: 2 },
    pro: { days: 30, gb: 300, dev: 3 },
  }[plan];
  const base = mock.sub && mock.sub.expire > nowSec() ? mock.sub.expire : nowSec();
  return {
    sub_url: "https://sub.kybic.online/sub/demo-7f3a9c21b0",
    used_traffic: 0,
    data_limit: spec.gb * GB,
    expire: base + spec.days * DAY,
    device_limit: spec.dev,
    devices: [],
  };
}

function mockServer(method: string, path: string, { query = {}, body = {} }: Opts): unknown {
  const key = `${method} ${path}`;
  const fail = (code: string): never => {
    throw new ApiError(code);
  };
  const b = body as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  switch (key) {
    case "GET /status": {
      const active = !!mock.sub && mock.sub.expire > nowSec();
      return {
        active,
        ref_count: 0,
        spins: 0,
        ref_link: mock.refLink,
        bonus_available: !mock.bonusNextAt || mock.bonusNextAt < nowSec(),
        bonus_next_at: mock.bonusNextAt,
        ...(active ? mock.sub : {}),
      } satisfies Status;
    }
    case "POST /activate": {
      if (mock.sub) fail("already_active");
      mock.sub = mockPlanFields("trial");
      return { success: true, ...mock.sub };
    }
    case "POST /reset_devices": {
      if (mock.sub) mock.sub.devices = [];
      return { success: true };
    }
    case "POST /claim_bonus": {
      if (!mock.sub) fail("no_subscription");
      if (mock.bonusNextAt && mock.bonusNextAt > nowSec()) fail("not_available");
      mock.sub!.expire += DAY;
      mock.bonusNextAt = nowSec() + DAY;
      return { success: true, bonus_label: "+1 день подписки", ...mock.sub };
    }
    case "POST /check_promo": {
      const code = String(b.code || "").trim().toUpperCase();
      if (code === "KUBIK10") return { success: true, discount_type: "percent", discount_value: 10 };
      if (code === "KUBIK50") return { success: true, discount_type: "fixed", discount_value: 50 };
      return fail("invalid_promo");
    }
    case "POST /create_payment": {
      const price = b.plan === "pro" ? 179 : 99;
      const code = String(b.promo_code || "").toUpperCase();
      const final = code === "KUBIK10" ? Math.round(price * 0.9) : code === "KUBIK50" ? price - 50 : price;
      return { success: true, pay_url: "https://t.me/kubik_vpn_bot", final_amount: final };
    }
    case "GET /get_tickets":
      return { tickets: [...mock.tickets], is_admin: false };
    case "GET /get_messages":
      return { messages: [...(mock.messages[Number(query.ticket_id)] || [])] };
    case "POST /create_ticket": {
      const id = mock.nextTicket++;
      mock.tickets.unshift({ id, title: b.title, status: "open", created_at: nowSec() });
      mock.messages[id] = [{ id: 1, sender_name: b.first_name, message: b.message, created_at: nowSec() }];
      return { success: true };
    }
    case "POST /reply_ticket": {
      const list = (mock.messages[b.ticket_id] ||= []);
      list.push({ id: list.length + 1, sender_name: b.sender_name, message: b.message, created_at: nowSec() });
      return { success: true };
    }
    case "GET /balance":
      return { balance_rub: mock.balance };
    case "GET /balance/history":
      return { items: [], pages: 1 };
    case "POST /balance/topup":
      return { success: true, pay_url: "https://t.me/kubik_vpn_bot" };
    case "POST /plans/buy": {
      if (b.pay_with === "card") return { success: true, pay_url: "https://t.me/kubik_vpn_bot" };
      return fail("not_enough_balance");
    }
    case "GET /referrals":
      return { ref_count: 0, ref_link: mock.refLink, reward_text: "За каждого приглашённого друга +1", items: [] };
    case "POST /gift/create": {
      const code = "KUBIK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      mock.gifts.add(code);
      return { success: true, code };
    }
    case "POST /gift/redeem": {
      const code = String(b.code || "").trim().toUpperCase();
      if (mock.usedGifts.has(code)) return fail("already_used");
      if (!mock.gifts.has(code)) return fail("not_found");
      mock.usedGifts.add(code);
      mock.sub = mockPlanFields("standard");
      return { success: true, ...mock.sub };
    }
  }
  return fail("http_404");
}
