import { ChevronRight, Clock, Dices, RefreshCw, Star, Users, Wallet } from "lucide-react";
import { useApp } from "@/store";
import { fmtMoney } from "@/lib/format";
import { ActiveSubscriptionCard, TrialCard } from "@/components/Subscription";
import { Button, SkeletonCard } from "@/components/ui";

export default function Home() {
  const { status, statusError, loading, refresh, go, user, balance } = useApp();

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">Добро пожаловать, {user.name}!</h1>
        <div className="mt-1.5 flex items-center gap-2 text-slate-400">
          Ваша подписка
          <span className="chip border-sky-400/25 bg-sky-400/10 text-sky-300">
            <Star size={12} className="fill-current" />
            {status?.active ? "Активна" : "Не активна"}
          </span>
        </div>
      </div>

      {loading && !status && <SkeletonCard h={260} />}

      {statusError && !status && (
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-300">{statusError}</p>
          <Button variant="ghost" className="mt-3" onClick={() => void refresh()}>
            <RefreshCw size={16} /> Повторить
          </Button>
        </div>
      )}

      {status && (
        <div className="stagger space-y-4">
          {status.active ? (
            <ActiveSubscriptionCard status={status} onTariffs={() => go("tariffs")} />
          ) : (
            <>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                    <Clock size={22} />
                  </div>
                  <div className="text-lg font-bold text-white">Нет активной подписки</div>
                </div>
                <div className="inner mt-4 flex items-center justify-between px-4 py-3.5 text-sm text-slate-400">
                  Оформите тариф или попробуйте бесплатно
                </div>
                <Button variant="cta" block className="mt-3 !py-3.5 text-base" onClick={() => go("tariffs")}>
                  Тарифы
                </Button>
              </div>
              <TrialCard status={status} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => go("balance")} className="card card-hover press p-4 text-left">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Баланс <ChevronRight size={16} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Wallet size={20} />
            </div>
            <div className="text-lg font-bold text-sky-300">{balance === null ? "—" : `${fmtMoney(balance)} ₽`}</div>
          </div>
        </button>
        <button onClick={() => go("referrals")} className="card card-hover press p-4 text-left">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Рефералы <ChevronRight size={16} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-300">
              <Users size={20} />
            </div>
            <div>
              <div className="text-lg font-bold leading-none text-white">{status?.ref_count ?? 0}</div>
              <div className="mt-1 text-xs text-slate-500">+1 за друга</div>
            </div>
          </div>
        </button>
      </div>

      <button onClick={() => go("wheel")} className="card card-hover press flex w-full items-center gap-4 p-4 text-left">
        <div className="anim-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Dices size={28} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-white">Испытай удачу!</div>
          <div className="mt-0.5 text-sm leading-snug text-slate-400">Крути колесо и выигрывай призы: дни подписки, баланс, трафик и многое другое!</div>
        </div>
        <ChevronRight size={18} className="text-slate-500" />
      </button>
    </div>
  );
}
