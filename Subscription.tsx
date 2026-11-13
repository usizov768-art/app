import { useState } from "react";
import { CalendarClock, Copy, Gift, Monitor, RefreshCw, Smartphone, Sparkles } from "lucide-react";
import { activateTrial, type Status } from "@/lib/api";
import { fmtBytes, fmtDate, fmtLeft, plural } from "@/lib/format";
import { useApp } from "@/store";
import { TRIAL } from "@/data/tariffs";
import { Button, copyText } from "./ui";
import { cn } from "@/utils/cn";

/** Активная подписка: срок, трафик, устройства, копирование sub_url. Показывается на главной и в «Подписка». */
export function ActiveSubscriptionCard({ status, onTariffs }: { status: Status; onTariffs?: () => void }) {
  const { toast } = useApp();
  const used = status.used_traffic ?? 0;
  const limit = status.data_limit ?? 0;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const devCount = status.devices?.length ?? 0;
  const devLimit = status.device_limit ?? 0;

  const copy = async () => {
    if (!status.sub_url) return;
    (await copyText(status.sub_url)) ? toast("Ссылка подписки скопирована", "success") : toast("Не удалось скопировать ссылку", "error");
  };

  return (
    <div className="card anim-glow relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label-mono flex items-center gap-2 text-sky-400">
              <span className="ping relative h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">Активна</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">Кубик VPN 🧊</div>
          </div>
          <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">до {fmtDate((status.expire ?? 0) * 1000)}</span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="label-mono text-slate-500">Трафик</span>
            <span className="font-mono text-xs text-slate-300">
              {fmtBytes(used)} / {limit > 0 ? fmtBytes(limit) : "∞"}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-[width] duration-1000"
              style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="inner flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Monitor size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Устройства</div>
              <div className="text-xs text-slate-400">
                {devCount} из {devLimit || "∞"}
              </div>
            </div>
          </div>
          <div className="inner flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <CalendarClock size={19} />
            </div>
            <div className="min-w-0">
              <div className="label-mono text-[0.6rem] text-slate-500">Осталось</div>
              <div className="truncate text-sm font-semibold text-emerald-300">{fmtLeft(status.expire)}</div>
            </div>
          </div>
        </div>

        {status.sub_url && (
          <div className="mt-4 flex gap-2">
            <div className="inner flex-1 truncate px-3 py-3 font-mono text-xs text-slate-400">{status.sub_url}</div>
            <button onClick={copy} className="press inner flex h-11 w-12 shrink-0 items-center justify-center text-slate-300 hover:!border-sky-400/40" aria-label="Копировать ссылку">
              <Copy size={17} />
            </button>
          </div>
        )}

        {onTariffs && (
          <Button variant="ghost" block className="mt-4" onClick={onTariffs}>
            <RefreshCw size={16} /> Продлить подписку
          </Button>
        )}
      </div>
    </div>
  );
}

/** Кнопка «Тестовая подписка»: показывается только пока active=false. */
export function TrialCard({ status, full }: { status: Status; full?: boolean }) {
  const { applySub, toast, toastError, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  if (status.active) return null;

  const run = async () => {
    setBusy(true);
    try {
      const r = await activateTrial();
      applySub(r);
      toast("Тестовая подписка активирована 🎉", "success");
    } catch (e) {
      toastError(e);
      void refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("card relative overflow-hidden p-5", full && "border-sky-400/30")}>
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="anim-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Gift size={23} />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{TRIAL.name} 🧊</div>
            <div className="text-sm text-slate-400">
              {TRIAL.days} {plural(TRIAL.days, "день", "дня", "дней")} бесплатно
            </div>
          </div>
        </div>
        {full && <p className="mt-3 text-sm leading-relaxed text-slate-400">{TRIAL.description}</p>}
        <Button variant="green" block className="mt-4" loading={busy} onClick={run}>
          <Sparkles size={17} /> Тестовая подписка
        </Button>
      </div>
    </div>
  );
}

export function DeviceRow({ d, i }: { d: { name?: string; model?: string; platform?: string }; i: number }) {
  return (
    <div className="inner flex items-center gap-3 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300">
        <Smartphone size={18} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{d.name || d.model || `Устройство ${i + 1}`}</div>
        {d.platform && <div className="text-xs text-slate-500">{d.platform}</div>}
      </div>
    </div>
  );
}
