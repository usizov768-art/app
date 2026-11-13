import { useState } from "react";
import { CreditCard, Sparkles, Star } from "lucide-react";
import { topupBalance, type TopupMethod } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { openLink } from "@/lib/tg";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { Button, PageTitle } from "@/components/ui";

const MIN = 10;
const MAX = 1000;
const QUICK = [100, 300, 500, 1000];

export default function Topup() {
  const { topupMethod, toast, toastError } = useApp();
  const [sub, setSub] = useState<"sbp" | "crypto">("sbp");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const stars = topupMethod === "stars";
  const amount = Number(value);
  const valid = Number.isInteger(amount) && amount >= MIN && amount <= MAX;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const method: TopupMethod = stars ? "stars" : sub;
      const r = await topupBalance(amount, method);
      toast("Открываем страницу оплаты…", "info");
      openLink(r.pay_url);
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page space-y-5">
      <PageTitle back>Пополнение</PageTitle>
      <div className="stagger space-y-5">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", stars ? "bg-amber-500/15 text-amber-300" : "bg-sky-500/15 text-sky-300")}>
            {stars ? <Star size={24} /> : <CreditCard size={24} />}
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stars ? "Telegram Stars" : "СБП (QR)"}</div>
            <div className="text-sm text-slate-400">
              {MIN} - {MAX} ₽
            </div>
          </div>
        </div>

        {!stars && (
          <div>
            <div className="mb-2 text-sm text-slate-400">Способ оплаты</div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["sbp", "СБП"],
                  ["crypto", "Криптовалюта"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSub(id)}
                  className={cn(
                    "press relative rounded-2xl border px-4 py-4 text-sm font-semibold",
                    sub === id ? "border-sky-400/70 bg-sky-400/10 text-sky-300" : "border-white/10 bg-white/[0.04] text-slate-300"
                  )}
                >
                  {label}
                  {sub === id && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-sky-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm text-slate-400">Введите сумму</div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                className="input !py-3.5 !pr-9 text-lg"
                inputMode="numeric"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">₽</span>
            </div>
            <Button className="!px-5" loading={busy} disabled={!valid} onClick={submit}>
              <Sparkles size={16} /> Пополнить
            </Button>
          </div>
          {value && !valid && (
            <div className="anim-fade mt-2 text-xs text-rose-400">
              Сумма должна быть от {MIN} до {fmtMoney(MAX).replace(",00", "")} ₽
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setValue(String(q))}
              className={cn("card card-hover press py-4 text-center", value === String(q) && "!border-sky-400/60")}
            >
              <div className="font-bold text-white">{q}</div>
              <div className="text-xs text-slate-500">₽</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
