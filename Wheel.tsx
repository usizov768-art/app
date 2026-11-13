import { useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { claimBonus } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useApp } from "@/store";
import { Button, PageTitle } from "@/components/ui";

const SEGMENTS = ["📅", "💰", "📶", "🎁", "⭐", "🧊"];
const COLORS = ["#0e7490", "#1e3a8a", "#155e75", "#312e81", "#0c4a6e", "#3730a3"];

function WheelSvg() {
  const n = SEGMENTS.length;
  const r = 140;
  return (
    <svg viewBox="-150 -150 300 300" className="h-full w-full">
      {SEGMENTS.map((s, i) => {
        const a0 = ((i * 360) / n - 90) * (Math.PI / 180);
        const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
        const am = (a0 + a1) / 2;
        const d = `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
        return (
          <g key={i}>
            <path d={d} fill={COLORS[i]} stroke="#0a0f1e" strokeWidth="3" />
            <text x={95 * Math.cos(am)} y={95 * Math.sin(am)} fontSize="30" textAnchor="middle" dominantBaseline="central">
              {s}
            </text>
          </g>
        );
      })}
      <circle r="26" fill="#0a0f1e" stroke="#38bdf8" strokeWidth="3" />
      <text fontSize="22" textAnchor="middle" dominantBaseline="central">
        🎲
      </text>
    </svg>
  );
}

export default function Wheel() {
  const { status, applySub, toastError, toast, go } = useApp();
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);

  const available = !!status?.bonus_available;

  const spin = async () => {
    setPrize(null);
    setSpinning(true);
    try {
      const r = await claimBonus();
      setRot((v) => v + 360 * 5 + Math.floor(Math.random() * 360));
      setTimeout(() => {
        setPrize(r.bonus_label);
        applySub(r);
        setSpinning(false);
        toast(`Ваш приз: ${r.bonus_label}`, "success");
      }, 4300);
    } catch (e) {
      setSpinning(false);
      toastError(e);
    }
  };

  return (
    <div className="page space-y-4">
      <PageTitle>Колесо удачи</PageTitle>
      <div className="stagger space-y-4">
        <div className="card relative overflow-hidden p-5 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative mx-auto h-64 w-64">
            <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 text-3xl drop-shadow-lg" style={{ color: "#f43f5e" }}>
              ▼
            </div>
            <div className="wheel h-full w-full rounded-full border-4 border-sky-400/40 shadow-[0_0_40px_-6px_rgba(56,189,248,0.5)]" style={{ transform: `rotate(${rot}deg)` }}>
              <WheelSvg />
            </div>
          </div>

          <div className="relative mt-5 text-sm text-slate-400">
            Доступно вращений: <b className="text-white">{status?.spins ?? 0}</b>
          </div>

          {prize && (
            <div className="anim-pop relative mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <div className="text-xs text-amber-300">Ваш приз</div>
              <div className="text-xl font-bold text-white">{prize}</div>
            </div>
          )}

          <div className="relative mt-4">
            {available ? (
              <Button variant="cta" block className="!py-3.5 text-base" loading={spinning} onClick={spin}>
                <Sparkles size={18} /> Крутить колесо
              </Button>
            ) : (
              <div className="inner flex items-center justify-center gap-2 px-4 py-3.5 text-sm text-slate-400">
                <Clock size={16} />
                {status?.bonus_next_at ? `Следующий бонус: ${fmtDateTime(status.bonus_next_at)}` : "Бонус пока недоступен"}
              </div>
            )}
            {!status?.active && available && (
              <p className="mt-3 text-xs text-slate-500">Для получения бонуса нужна активная подписка.</p>
            )}
          </div>
        </div>

        {!status?.active && (
          <div className="grid grid-cols-1 gap-3">
            <Button variant="ghost" block onClick={() => go("subscription")}>
              Оформить подписку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
