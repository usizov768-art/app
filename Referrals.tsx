import { useEffect, useState } from "react";
import { Copy, Send, UserPlus, Users } from "lucide-react";
import { getReferrals, type ReferralsResponse } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { openTgLink } from "@/lib/tg";
import { useApp } from "@/store";
import { Button, Empty, PageTitle, copyText } from "@/components/ui";

export default function Referrals() {
  const { status, toast } = useApp();
  const [data, setData] = useState<ReferralsResponse | null>(null);

  useEffect(() => {
    getReferrals()
      .then(setData)
      .catch(() => setData(null)); // эндпоинт может быть ещё не готов — используем данные /status
  }, []);

  const count = data?.ref_count ?? status?.ref_count ?? 0;
  const link = data?.ref_link ?? status?.ref_link ?? "";
  const items = data?.items ?? [];
  const reward = data?.reward_text || "За каждого приглашённого друга +1";

  const copy = async () => {
    if (!link) return;
    (await copyText(link)) ? toast("Реферальная ссылка скопирована", "success") : toast("Не удалось скопировать ссылку", "error");
  };
  const share = () => {
    if (!link) return;
    openTgLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Присоединяйся к Кубик VPN 🧊")}`);
  };

  return (
    <div className="page space-y-4">
      <PageTitle>Рефералы</PageTitle>
      <div className="stagger space-y-4">
        <div className="card relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="anim-float flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
              <Users size={30} />
            </div>
            <div>
              <div className="text-sm text-slate-400">Приглашено друзей</div>
              <div key={count} className="anim-pop text-5xl font-extrabold leading-none text-white">
                {count}
              </div>
            </div>
          </div>
          <div className="relative mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <b>За каждого друга +1.</b> {reward !== "За каждого приглашённого друга +1" ? reward : "Приглашайте друзей по своей ссылке — счётчик растёт с каждым новым участником."}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white">Ваша ссылка</h3>
          <div className="mt-3 flex gap-2">
            <div className="inner flex-1 truncate px-3 py-3 font-mono text-xs text-slate-400">{link || "—"}</div>
            <button onClick={copy} className="press inner flex h-11 w-12 shrink-0 items-center justify-center text-slate-300 hover:!border-sky-400/40" aria-label="Копировать">
              <Copy size={17} />
            </button>
          </div>
          <Button block className="mt-3" onClick={share} disabled={!link}>
            <Send size={16} /> Поделиться в Telegram
          </Button>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white">Ваши рефералы</h3>
          <div className="mt-3 space-y-2">
            {items.length === 0 ? (
              <Empty icon={<UserPlus size={26} />}>Пока никого нет. Отправьте ссылку другу — и вы получите +1.</Empty>
            ) : (
              items.map((r, i) => (
                <div key={i} className="inner anim-pop flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/10 text-sm font-bold text-sky-300">{(r.name || "?").slice(0, 1).toUpperCase()}</div>
                    <span className="text-sm font-semibold text-white">{r.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{fmtDate(r.joined_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
