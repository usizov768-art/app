import { useEffect, useState } from "react";
import { ChevronDown, CreditCard, Gift, Receipt, ShoppingBag, Users } from "lucide-react";
import { checkPromo, getBalanceHistory, type HistoryItem, type HistoryType } from "@/lib/api";
import { discountLabel, fmtDateTime, fmtMoney } from "@/lib/format";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { Button, Empty, PageTitle, Spinner } from "@/components/ui";

const HIST_META: Record<HistoryType, { label: string; icon: typeof Gift; color: string }> = {
  deposit: { label: "Пополнение", icon: CreditCard, color: "text-sky-300 bg-sky-400/10" },
  purchase: { label: "Покупка", icon: ShoppingBag, color: "text-rose-300 bg-rose-400/10" },
  referral_reward: { label: "Награда за реферала", icon: Users, color: "text-emerald-300 bg-emerald-400/10" },
  gift: { label: "Подарок", icon: Gift, color: "text-amber-300 bg-amber-400/10" },
};

export default function Balance() {
  const { balance, refreshBalance, go, setTopupMethod, toast, toastError, promo, setPromo } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [hLoading, setHLoading] = useState(false);
  const [hError, setHError] = useState(false);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const loadHistory = async (p: number) => {
    setHLoading(true);
    setHError(false);
    try {
      const r = await getBalanceHistory(p);
      setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items]));
      setPage(p);
      setPages(r.pages);
    } catch (e) {
      setHError(true);
      toastError(e);
    } finally {
      setHLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !open;
    setOpen(next);
    if (next && items.length === 0) void loadHistory(1);
  };

  const activate = async () => {
    const c = code.trim();
    if (!c) return;
    setBusy(true);
    try {
      const r = await checkPromo(c);
      const label = discountLabel(r.discount_type, r.discount_value);
      setPromo({ code: c, label });
      setCode("");
      toast(`Промокод принят: скидка ${label}. Он применится при оплате тарифа.`, "success");
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const startTopup = (m: "sbp" | "stars") => {
    setTopupMethod(m);
    go("topup");
  };

  return (
    <div className="page space-y-4">
      <PageTitle>Баланс</PageTitle>
      <div className="stagger space-y-4">
        <div className="card p-5">
          <div className="text-sm text-slate-400">Текущий баланс</div>
          <div className="mt-1 flex items-baseline gap-2 text-4xl font-extrabold text-white">
            {balance === null ? "—" : fmtMoney(balance)} <span className="text-2xl text-slate-500">₽</span>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white">Промокод</h3>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Введите промокод" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void activate()} />
            <Button className="shrink-0 !px-4" loading={busy} disabled={!code.trim()} onClick={activate}>
              Активировать
            </Button>
          </div>
          {promo && (
            <div className="anim-pop mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
              Активен промокод {promo.code.toUpperCase()}: скидка {promo.label}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white">Пополнение баланса</h3>
          <div className="mt-4 space-y-3">
            <button onClick={() => startTopup("sbp")} className="card card-hover press w-full p-4 text-left">
              <div className="font-bold text-white">СБП (QR)</div>
              <div className="mt-1 text-sm text-slate-400">СБП (с помощью вашего банка) либо Криптовалютой</div>
              <div className="mt-3 text-xs text-slate-500">10 до 1000 ₽</div>
            </button>
            <button onClick={() => startTopup("stars")} className="card card-hover press w-full p-4 text-left">
              <div className="font-bold text-white">Telegram Stars</div>
              <div className="mt-1 text-sm text-slate-400">Оплата через Telegram Stars</div>
              <div className="mt-3 text-xs text-slate-500">10 до 1000 ₽</div>
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <button onClick={toggleHistory} className="press flex w-full items-center justify-between p-5 text-left">
            <h3 className="text-lg font-bold text-white">История операций</h3>
            <ChevronDown className={cn("text-slate-400 transition-transform duration-300", open && "rotate-180")} />
          </button>
          {open && (
            <div className="anim-slide-down space-y-2 px-5 pb-5">
              {items.map((it) => {
                const m = HIST_META[it.type] ?? HIST_META.deposit;
                return (
                  <div key={it.id} className="inner flex items-center gap-3 p-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", m.color)}>
                      <m.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{it.description || m.label}</div>
                      <div className="text-xs text-slate-500">
                        {m.label} · {fmtDateTime(it.created_at)}
                      </div>
                    </div>
                    <div className={cn("whitespace-nowrap text-sm font-bold", it.amount_rub >= 0 ? "text-emerald-300" : "text-rose-300")}>
                      {it.amount_rub > 0 ? "+" : ""}
                      {fmtMoney(it.amount_rub)} ₽
                    </div>
                  </div>
                );
              })}
              {hLoading && (
                <div className="flex justify-center py-4 text-slate-400">
                  <Spinner />
                </div>
              )}
              {!hLoading && items.length === 0 && (
                <Empty icon={<Receipt size={26} />}>{hError ? "Не удалось загрузить историю" : "Операций пока нет"}</Empty>
              )}
              {!hLoading && page < pages && (
                <Button variant="ghost" block onClick={() => void loadHistory(page + 1)}>
                  Показать ещё
                </Button>
              )}
              {hError && (
                <Button variant="ghost" block onClick={() => void loadHistory(1)}>
                  Повторить
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

