import { useState } from "react";
import { Newspaper } from "lucide-react";
import { NEWS, NEWS_CATEGORIES } from "@/data/news";
import { cn } from "@/utils/cn";
import { Empty } from "@/components/ui";

export default function Info() {
  const [cat, setCat] = useState<string>("all");
  const list = NEWS.filter((n) => cat === "all" || n.category === cat);

  return (
    <div className="page">
      <div className="card p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-[#04131f]">
            <Newspaper size={18} />
          </div>
          <span className="label-mono text-slate-300">Новости и обновления</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {NEWS_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "press rounded-xl border px-4 py-2.5 text-sm font-semibold",
                cat === c.id ? "border-transparent bg-sky-400 text-[#04131f] shadow-[0_8px_20px_-8px_rgba(56,189,248,0.9)]" : "border-white/10 bg-white/[0.05] text-slate-300"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div key={cat} className="stagger mt-4 space-y-4">
          {list.map((n) => (
            <article key={n.id} className="card card-hover p-5">
              <div className="flex flex-wrap items-center gap-2">
                {n.tags.map((t, i) => (
                  <span
                    key={t}
                    className={cn(
                      "label-mono rounded-md border px-2 py-1 text-[0.62rem]",
                      i === 0 ? "border-transparent text-cyan-300" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                    )}
                  >
                    {i === 0 && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 text-xl font-bold leading-snug text-white">{n.title}</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-400">{n.text}</p>
              <div className="mt-4 flex justify-between border-t border-white/8 pt-3 font-mono text-xs text-slate-500">
                <span>{n.date}</span>
                <span>{n.read}</span>
              </div>
            </article>
          ))}
          {list.length === 0 && <Empty icon={<Newspaper size={26} />}>В этой категории пока нет новостей</Empty>}
        </div>
      </div>
    </div>
  );
}
