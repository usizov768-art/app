import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getBalance, getStatus, isMock, type Status, type SubFields } from "@/lib/api";
import { errorText } from "@/lib/errors";
import { getTgUser, haptic } from "@/lib/tg";

export type Page =
  | "home"
  | "subscription"
  | "tariffs"
  | "balance"
  | "topup"
  | "referrals"
  | "support"
  | "wheel"
  | "gift"
  | "info"
  | "profile";

export type ToastKind = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface Ctx {
  page: Page;
  go: (p: Page) => void;
  back: () => void;
  status: Status | null;
  statusError: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Применить поля подписки, которые вернул сервер (activate / claim_bonus / gift / buy) */
  applySub: (fields: Partial<SubFields>) => void;
  balance: number | null;
  refreshBalance: () => Promise<void>;
  toasts: ToastItem[];
  toast: (text: string, kind?: ToastKind) => void;
  toastError: (e: unknown) => void;
  user: { name: string; username?: string };
  demo: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  promo: { code: string; label: string } | null;
  setPromo: (p: { code: string; label: string } | null) => void;
  topupMethod: "sbp" | "stars";
  setTopupMethod: (m: "sbp" | "stars") => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("AppProvider missing");
  return c;
}

const PARENT: Partial<Record<Page, Page>> = { tariffs: "subscription", topup: "balance" };

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("home");
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topupMethod, setTopupMethod] = useState<"sbp" | "stars">("sbp");
  const [promo, setPromo] = useState<{ code: string; label: string } | null>(null);
  const seq = useRef(0);

  const go = useCallback((p: Page) => {
    setPage(p);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => go(PARENT[page] ?? "home"), [go, page]);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    haptic(kind === "error" ? "error" : kind === "success" ? "success" : "light");
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const toastError = useCallback((e: unknown) => toast(errorText(e), "error"), [toast]);

  const refresh = useCallback(async () => {
    try {
      const s = await getStatus();
      setStatus(s);
      setStatusError(null);
    } catch (e) {
      setStatusError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const b = await getBalance();
      setBalance(b.balance_rub);
    } catch {
      setBalance(null); // эндпоинт может быть ещё не готов на сервере
    }
  }, []);

  const applySub = useCallback(
    (fields: Partial<SubFields>) => {
      // Показываем ответ сервера сразу, затем подтягиваем актуальный /status
      setStatus((s) => (s ? { ...s, ...fields, active: true } : s));
      void refresh();
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
    void refreshBalance();
  }, [refresh, refreshBalance]);

  const tgUser = getTgUser();
  const user = useMemo(
    () => ({
      name: [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") || (isMock() ? "Кубик Support" : "Пользователь"),
      username: tgUser?.username || (isMock() ? "kubik_support" : undefined),
    }),
    [tgUser?.first_name, tgUser?.last_name, tgUser?.username]
  );

  const value: Ctx = {
    page, go, back, status, statusError, loading, refresh, applySub, balance, refreshBalance,
    toasts, toast, toastError, user, demo: isMock(), menuOpen, setMenuOpen, promo, setPromo, topupMethod, setTopupMethod,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
