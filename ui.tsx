import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowLeft, Check, CircleAlert, Info, Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useApp } from "@/store";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#070b16]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size * 0.66} height={size * 0.66} fill="none">
        <defs>
          <linearGradient id="kg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M24 5 41 14.5v19L24 43 7 33.5v-19L24 5Z" fill="url(#kg1)" opacity="0.18" stroke="url(#kg1)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M7 14.5 24 24l17-9.5M24 24v19" stroke="url(#kg1)" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 5v19" stroke="url(#kg1)" strokeWidth="2.4" opacity="0.5" />
      </svg>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} size={18} />;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "cta" | "ghost" | "danger" | "green";
  loading?: boolean;
  block?: boolean;
}
export function Button({ variant = "primary", loading, block, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn("btn press", `btn-${variant}`, block && "w-full", className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function PageTitle({ children, back }: { children: ReactNode; back?: boolean }) {
  const { back: goBack } = useApp();
  return (
    <div className="mb-4 flex items-center gap-3">
      {back && (
        <button onClick={goBack} className="press inner flex h-10 w-10 items-center justify-center" aria-label="Назад">
          <ArrowLeft size={18} />
        </button>
      )}
      <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">{children}</h1>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card anim-pop w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="press inner flex h-9 w-9 items-center justify-center" aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
            t.kind === "success" && "border-emerald-400/30 bg-emerald-950/85 text-emerald-100",
            t.kind === "error" && "border-rose-400/30 bg-rose-950/85 text-rose-100",
            t.kind === "info" && "border-sky-400/30 bg-slate-900/90 text-sky-100"
          )}
        >
          {t.kind === "success" ? <Check size={18} className="mt-0.5 shrink-0" /> : t.kind === "error" ? <CircleAlert size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center text-slate-400">
      <div className="anim-float flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-300">{icon}</div>
      <div className="text-[0.95rem]">{children}</div>
    </div>
  );
}

export function SkeletonCard({ h = 180 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: "1.35rem" }} />;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
