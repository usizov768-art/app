import { Gift, Sparkles, User, Users, Wallet } from "lucide-react";
import { getTgUser } from "@/lib/tg";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useApp } from "@/store";
import { PageTitle } from "@/components/ui";

export default function Profile() {
  const { user, status, balance, demo, go } = useApp();
  const id = getTgUser()?.id;

  const rows = [
    { icon: Sparkles, label: "Подписка", value: status?.active ? `Активна до ${fmtDate((status.expire ?? 0) * 1000)}` : "Не активна", go: "subscription" as const },
    { icon: Wallet, label: "Баланс", value: balance === null ? "—" : `${fmtMoney(balance)} ₽`, go: "balance" as const },
    { icon: Users, label: "Рефералы", value: `${status?.ref_count ?? 0} (+1 за каждого друга)`, go: "referrals" as const },
    { icon: Gift, label: "Подарки", value: "Подарить или активировать код", go: "gift" as const },
  ];

  return (
    <div className="page space-y-4">
      <PageTitle>Профиль</PageTitle>
      <div className="stagger space-y-4">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-[#04131f]">
            <User size={30} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-white">{user.name}</div>
            {user.username && <div className="text-sm text-slate-400">@{user.username}</div>}
            {id && <div className="font-mono text-xs text-slate-500">ID {id}</div>}
          </div>
        </div>
        <div className="space-y-3">
          {rows.map((r) => (
            <button key={r.label} onClick={() => go(r.go)} className="card card-hover press flex w-full items-center gap-3 p-4 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                <r.icon size={20} />
              </div>
              <div>
                <div className="text-sm text-slate-400">{r.label}</div>
                <div className="font-semibold text-white">{r.value}</div>
              </div>
            </button>
          ))}
        </div>
        {demo && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">
            Демо-режим: приложение открыто вне Telegram (или включён VITE_MOCK=1), поэтому показаны тестовые данные.
          </div>
        )}
      </div>
    </div>
  );
}
