import { useState } from "react";
import { ArrowDown, CalendarDays, CircleAlert, CreditCard, Gift, Monitor, RotateCw, Tag, Wallet, Check } from "lucide-react";
import { buyPlan, checkPromo, createPayment, type PlanId } from "@/lib/api";
import { errorCode } from "@/lib/errors";
import { discountLabel, fmtMoney, plural } from "@/lib/format";
import { openLink } from "@/lib/tg";
import { useApp } from "@/store";
import { planInfo, TARIFFS, type TariffView } from "@/data/tariffs";
import { TrialCard } from "@/components/Subscription";
import { Button, Modal, PageTitle, SkeletonCard } from "@/components/ui";

export default function Tariffs() {
  const { status, balance, applySub, refreshBalance, toast, toastError, go, promo, setPromo } = useApp();
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [choice, setChoice] = useState<TariffView | null>(null);
  const [busy, setBusy] = useState<"balance" | "card" | null>(null);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    try {
      const r = await checkPromo(code);
      setPromo({ code, label: discountLabel(r.discount_type, r.discount_value) });
      toast("Промокод применён", "success");
    } catch (e) {
      setPromo(null);
      toastError(e);
    } finally {
      setPromoBusy(false);
    }
  };

  const pay = async (how: "balance" | "card") => {
    if (!choice) return;
    setBusy(how);
    const plan: PlanId = choice.id;
    try {
      if (how === "card") {
        const r = await createPayment(plan, promo?.code);
        toast(`Сумма к оплате: ${fmtMoney(r.final_amount)} ₽`, "info");
        openLink(r.pay_url);
        setChoice(null);
      } else {
        const r = await buyPlan(plan, "balance", promo?.code);
        applySub(r);
        void refreshBalance();
        toast(`Тариф «${choice.name}» оформлен`, "success");
        setChoice(null);
        go("subscription");
      }
    } catch (e) {
      toastError(e);
      if (errorCode(e) === "not_enough_balance") setChoice(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page space-y-4">
      <PageTitle back>Оформить подписку</PageTitle>
      {!status ? (
        <SkeletonCard h={240} />
      ) : (
        <div className="stagger space-y-4">
          {!status.active ? (
            <div className="card flex items-start gap-3 !border-rose-400/25 bg-rose-500/5 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <CircleAlert size={19} />
              </div>
              <div>
                <div className="font-semibold text-rose-400">Нет активной подписки</div>
                <div className="text-sm text-slate-400">Выберите тариф ниже, чтобы получить доступ к VPN.</div>
              </div>
            </div>
          ) : (
            <div className="card flex items-start gap-3 !border-emerald-400/25 bg-emerald-500/5 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Check size={19} />
              </div>
              <div>
                <div className="font-semibold text-emerald-400">Подписка активна</div>
                <div className="text-sm text-slate-400">Выберите тариф, чтобы продлить доступ.</div>
              </div>
            </div>
          )}

          <TrialCard status={status} full />

          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Tag size={16} className="text-sky-400" /> Промокод
            </div>
            <div className="mt-3 flex gap-2">
              <input className="input" placeholder="Введите промокод" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void applyPromo()} />
              <Button className="shrink-0" loading={promoBusy} onClick={applyPromo} disabled={!promoInput.trim()}>
                Применить
              </Button>
            </div>
            {promo && (
              <div className="anim-pop mt-3 flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                <span>
                  {promo.code.toUpperCase()}: скидка {promo.label}
                </span>
                <button className="press text-xs text-slate-400 underline" onClick={() => setPromo(null)}>
                  убрать
                </button>
              </div>
            )}
            {promo && <p className="mt-2 text-xs text-slate-500">Итоговая сумма будет рассчитана сервером при оплате.</p>}
          </div>

          {TARIFFS.map((t) => {
            const p = planInfo(status, t);
            return (
              <div key={t.id} className="card card-hover p-5">
                <h3 className="text-xl font-bold text-white">{t.name} 🧊</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ArrowDown size={15} className="text-sky-400" /> {p.traffic_gb} ГБ
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Monitor size={15} className="text-slate-400" /> {p.devices} {plural(p.devices, "устройство", "устройства", "устройств")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-slate-400" /> {p.days} {plural(p.days, "день", "дня", "дней")}
                  </span>
                  <span className="flex items-center gap-1.5 font-normal text-slate-400">
                    <RotateCw size={14} /> Сброс ежемесячно
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-4">
                  <div>
                    <div className="text-xs text-slate-500">стоимость</div>
                    <div className="text-xl font-bold text-sky-300">{fmtMoney(p.price_rub)} ₽</div>
                  </div>
                  <Button className="min-w-36" onClick={() => setChoice(t)}>
                    {status.active ? "Продлить" : "Купить"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!choice} onClose={() => !busy && setChoice(null)} title={choice ? `Оплата: ${choice.name}` : ""}>
        {choice && (
          <div className="space-y-3">
            <div className="inner flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-400">Тариф</span>
              <span className="font-semibold text-white">
                {choice.name} · {fmtMoney(planInfo(status, choice).price_rub)} ₽
              </span>
            </div>
            {promo && (
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <Gift size={15} /> Промокод {promo.code.toUpperCase()}: {promo.label}
              </div>
            )}
            <button onClick={() => pay("balance")} disabled={!!busy} className="card card-hover press flex w-full items-center gap-3 p-4 text-left disabled:opacity-60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
                <Wallet size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">С баланса</div>
                <div className="text-xs text-slate-400">Баланс: {balance === null ? "—" : `${fmtMoney(balance)} ₽`}</div>
              </div>
              {busy === "balance" && <span className="text-xs text-slate-400">Оплата…</span>}
            </button>
            <button onClick={() => pay("card")} disabled={!!busy} className="card card-hover press flex w-full items-center gap-3 p-4 text-left disabled:opacity-60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <CreditCard size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">Картой / СБП</div>
                <div className="text-xs text-slate-400">Откроется страница оплаты</div>
              </div>
              {busy === "card" && <span className="text-xs text-slate-400">Создаём платёж…</span>}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
