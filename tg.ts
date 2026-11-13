// Тонкая обёртка над window.Telegram.WebApp. Здесь нет сетевых запросов.

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  openLink?: (url: string, options?: Record<string, unknown>) => void;
  openTelegramLink?: (url: string) => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: {
    impactOccurred?: (s: "light" | "medium" | "heavy") => void;
    notificationOccurred?: (s: "error" | "success" | "warning") => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function getTg(): TgWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function getInitData(): string {
  return getTg()?.initData ?? "";
}

export function getTgUser(): TgUser | undefined {
  return getTg()?.initDataUnsafe?.user;
}

export function initTelegram() {
  const tg = getTg();
  if (!tg) return;
  try {
    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.("#0a0f1e");
    tg.setBackgroundColor?.("#0a0f1e");
  } catch {
    /* старые версии клиента */
  }
}

export function openLink(url: string) {
  const tg = getTg();
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, "_blank", "noopener");
}

export function openTgLink(url: string) {
  const tg = getTg();
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, "_blank", "noopener");
}

export function closeApp() {
  const tg = getTg();
  if (tg?.close) tg.close();
}

export function haptic(kind: "light" | "medium" | "success" | "error" = "light") {
  const h = getTg()?.HapticFeedback;
  try {
    if (kind === "success" || kind === "error") h?.notificationOccurred?.(kind);
    else h?.impactOccurred?.(kind);
  } catch {
    /* ignore */
  }
}
