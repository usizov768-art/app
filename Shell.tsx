import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Dices,
  Gift,
  Home,
  Info,
  LogOut,
  MessageCircle,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useApp, type Page } from "@/store";
import { closeApp } from "@/lib/tg";
import { NEWS } from "@/data/news";
import { Logo } from "./ui";

/** Пункты бокового меню (три полоски справа вверху) */
const MENU: { page: Page; label: string; icon: typeof Home }[] = [
  { page: "home", label: "Главная", icon: Home },
  { page: "subscription", label: "Подписка", icon: Sparkles },
  { page: "balance", label: "Баланс", icon: Wallet },
  { page: "referrals", label: "Рефералы", icon: Users },
  { page: "support", label: "Поддержка", icon: MessageCircle },
  { page: "wheel", label: "Колесо удачи", icon: Dices },
  { page: "gift", label: "Подарить", icon: Gift },
  { page: "info", label: "Информация", icon: Info },
];

const TABS: { page: Page; label: string; icon: typeof Home }[] = [
  { page: "home", label: "Главная", icon: Home },
  { page: "subscription", label: "Подписка", icon: Sparkles },
  { page: "balance", label: "Баланс", icon: Wallet },
  { page: "wheel", label: "Колесо удачи", icon: Dices },
  { page: "support", label: "Поддержка", icon: MessageCircle },
];

/** Какая вкладка подсвечена для вложенных страниц */
const TAB_OF: Partial<Record<Page, Page>> = { tariffs: "subscription", topup: "balance" };

export function Header() {
  const { menuOpen, setMenuOpen, go, toast } = useApp();
  const [lang, setLang] = useState(false);
  const [bell, setBell] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0f1e]/85 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <button onClick={() => go("home")} className="press flex items-center gap-3">
          <Logo />
          <span className="text-[1.05rem] font-bold tracking-wide text-white">КУБИК VPN</span>
        </button>
        <div className="flex-1" />

        <div className="relative">
          <button
            onClick={() => {
              setBell(!bell);
              setLang(false);
              setMenuOpen(false);
            }}
            className="press inner relative flex h-11 w-11 items-center justify-center text-slate-300"
            aria-label="Уведомления"
          >
            <Bell size={19} className={bell ? "text-sky-300" : ""} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-sky-400" />
          </button>
          {bell && (
            <div className="card anim-slide-down absolute right-0 top-14 z-50 w-72 p-3">
              <div className="label-mono mb-2 px-1 text-slate-400">Уведомления</div>
              {NEWS.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setBell(false);
                    go("info");
                  }}
                  className="press mb-1.5 w-full rounded-xl bg-white/[0.04] p-3 text-left text-sm hover:bg-white/[0.08]"
                >
                  <div className="font-semibold text-white">{n.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{n.date}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setLang(!lang);
              setBell(false);
              setMenuOpen(false);
            }}
            className="press inner flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-slate-200"
          >
            <span className="flex h-3 w-4 flex-col overflow-hidden rounded-[2px]">
              <i className="block flex-1 bg-white" />
              <i className="block flex-1 bg-blue-600" />
              <i className="block flex-1 bg-red-600" />
            </span>
            RU
            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", lang && "rotate-180")} />
          </button>
          {lang && (
            <div className="card anim-slide-down absolute right-0 top-14 z-50 w-40 p-1.5">
              <button onClick={() => setLang(false)} className="press flex w-full items-center justify-between rounded-lg bg-sky-500/10 px-3 py-2.5 text-sm font-semibold text-sky-300">
                Русский <span>✓</span>
              </button>
              <button
                onClick={() => {
                  setLang(false);
                  toast("Английский язык скоро появится", "info");
                }}
                className="press w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5"
              >
                English
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setMenuOpen(!menuOpen);
            setLang(false);
            setBell(false);
          }}
          className={cn("press inner flex h-11 w-11 items-center justify-center text-slate-300", menuOpen && "!border-sky-400/30 !bg-sky-400/10 text-white")}
          aria-label="Меню"
        >
          <span className={cn("burger flex flex-col gap-[5px]", menuOpen && "open")}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </header>
  );
}

export function MenuPanel() {
  const { menuOpen, setMenuOpen, page, go, user } = useApp();
  if (!menuOpen) return null;
  return (
    <div className="anim-fade fixed inset-x-0 bottom-0 top-[73px] z-40 bg-[#0a0f1e]/92 backdrop-blur-2xl" onClick={() => setMenuOpen(false)}>
      <nav className="anim-slide-down stagger mx-auto flex h-full max-w-xl flex-col overflow-y-auto px-4 pb-8 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 border-b border-white/10 px-2 pb-3">
          <div className="font-bold text-white">{user.name}</div>
          {user.username && <div className="text-sm text-slate-400">@{user.username}</div>}
        </div>
        {MENU.map((m) => {
          const active = (TAB_OF[page] ?? page) === m.page;
          return (
            <button
              key={m.page}
              onClick={() => go(m.page)}
              className={cn(
                "press group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left text-[1.02rem]",
                active ? "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20" : "text-slate-300 hover:bg-white/5"
              )}
            >
              <m.icon size={20} className="transition-transform group-hover:scale-110" />
              {m.label}
            </button>
          );
        })}
        <div className="my-2 border-t border-white/10" />
        <button onClick={() => go("profile")} className={cn("press group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left text-[1.02rem]", page === "profile" ? "bg-sky-400/10 text-sky-300" : "text-slate-300 hover:bg-white/5")}>
          <User size={20} className="transition-transform group-hover:scale-110" />
          Профиль
        </button>
        <button onClick={closeApp} className="press group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left text-[1.02rem] text-rose-400 hover:bg-rose-500/10">
          <LogOut size={20} className="transition-transform group-hover:translate-x-0.5" />
          Выйти
        </button>
      </nav>
    </div>
  );
}

export function BottomNav() {
  const { page, go } = useApp();
  const current = TAB_OF[page] ?? page;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="card pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-1 !rounded-[1.4rem] bg-[#0d1426]/95 p-1.5 backdrop-blur-xl">
        {TABS.map((t) => {
          const active = current === t.page;
          return (
            <button
              key={t.page}
              onClick={() => go(t.page)}
              className={cn(
                "press flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.68rem] font-medium",
                active ? "bg-sky-400/12 text-sky-300 ring-1 ring-sky-400/25" : "text-slate-400 hover:text-white"
              )}
            >
              <t.icon size={20} className={cn("transition-transform", active && "scale-110")} />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
