import { useState } from "react";
import { ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { resetDevices } from "@/lib/api";
import { useApp } from "@/store";
import { ActiveSubscriptionCard, DeviceRow, TrialCard } from "@/components/Subscription";
import { Button, Empty, Modal, PageTitle, SkeletonCard } from "@/components/ui";
import { Monitor } from "lucide-react";

export default function Subscription() {
  const { status, statusError, refresh, go, toast, toastError } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      await resetDevices();
      toast("Устройства сброшены", "success");
      setConfirm(false);
      await refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page space-y-4">
      <PageTitle>Подписка</PageTitle>

      {!status && !statusError && <SkeletonCard h={300} />}
      {!status && statusError && (
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-300">{statusError}</p>
          <Button variant="ghost" className="mt-3" onClick={() => void refresh()}>
            <RefreshCw size={16} /> Повторить
          </Button>
        </div>
      )}

      {status && (
        <div className="stagger space-y-4">
          {status.active ? <ActiveSubscriptionCard status={status} /> : <TrialCard status={status} full />}

          <button onClick={() => go("tariffs")} className="card card-hover press flex w-full items-center gap-4 !border-sky-400/30 bg-sky-400/5 p-4 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">{status.active ? "Выберите тариф для продления" : "Выберите тариф"}</div>
              <div className="text-sm text-slate-400">Больше трафика и устройств</div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </button>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Мои устройства</h3>
              {status.active && (status.devices?.length ?? 0) > 0 && (
                <button onClick={() => setConfirm(true)} className="press chip border-rose-400/30 bg-rose-400/10 text-rose-300">
                  <RefreshCw size={12} /> Сбросить
                </button>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {status.active && (status.devices?.length ?? 0) > 0 ? (
                status.devices!.map((d, i) => <DeviceRow key={d.id ?? i} d={d} i={i} />)
              ) : (
                <Empty icon={<Monitor size={26} />}>Нет подключенных устройств</Empty>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Сбросить устройства?">
        <p className="text-sm text-slate-400">Все подключённые устройства будут отвязаны. Вы сможете подключить их заново по ссылке подписки.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Отмена
          </Button>
          <Button variant="danger" loading={busy} onClick={reset}>
            Сбросить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
