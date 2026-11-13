import { useState } from "react";
import { Check, Copy, Gift as GiftIcon, KeyRound } from "lucide-react";
import { createGift, redeemGift, type PlanId } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { useApp } from "@/store";
import { planInfo, TARIFFS } from "@/data/tariffs";
import { cn } from "@/utils/cn";
import { Button, PageTitle, copyText } from "@/components/ui";

export default function Gift() {
  const { status, toast, toastError, applySub, go } = useApp();
  const [plan, setPlan] = useState<PlanId>("standard");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const r = await createGift(plan);
      setCode(r.code);
      toast("Подарочный код создан", "success");
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const redeem = async () => {
    if (!input.trim()) return;
    setRedeeming(true);
    try {
      const r = await redeemGift(input.trim());
      applySub(r);
      setInput("");
      toast("Подарок активирован! Приятного пользования 🧊", "success");
      go("subscription");
    } catch (e) {
      toastError(e);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="page space-y-4">
      <PageTitle>Подарить</PageTitle>
      <div className="stagger space-y-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="anim-float flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
              <GiftIcon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white">Подарить подписку</h3>
              <p className="text-sm text-slate-400">Выберите тариф — получите код для друга</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {TARIFFS.map((t) => {
              const p = planInfo(status, t);
              const sel = plan === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setPlan(t.id);
                    setCode(null);
                  }}
                  className={cn("press flex w-full items-center justify-between rounded-2xl border p-4 text-left", sel ? "border-sky-400/60 bg-sky-400/10" : "border-white/10 bg-white/[0.03]")}
                >
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">
                      {p.traffic_gb} ГБ · {p.devices} устр. · {p.days} дн.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-sky-300">
                    {fmtMoney(p.price_rub)} ₽{sel && <Check size={16} />}
                  </div>
                </button>
              );
            })}
          </div>
          <Button block className="mt-4" loading={busy} onClick={create}>
            Создать подарок
          </Button>
          {code && (
            <div className="anim-pop mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <div className="text-xs text-emerald-300">Код подарка</div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="font-mono text-lg font-bold tracking-wider text-white">{code}</div>
                <button
                  onClick={async () => ((await copyText(code)) ? toast("Код скопирован", "success") : toast("Не удалось скопировать", "error"))}
                  className="press inner flex h-10 w-10 items-center justify-center"
                  aria-label="Копировать"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <KeyRound size={18} className="text-sky-400" /> Есть подарочный код?
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input font-mono uppercase" placeholder="KUBIK-XXXXXX" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void redeem()} />
            <Button className="shrink-0" loading={redeeming} disabled={!input.trim()} onClick={redeem}>
              Активировать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
