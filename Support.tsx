import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, MessagesSquare, Plus, Send } from "lucide-react";
import { createTicket, getMessages, getTickets, replyTicket, type Ticket, type TicketMessage } from "@/lib/api";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { openTgLink } from "@/lib/tg";
import { useApp } from "@/store";
import { cn } from "@/utils/cn";
import { Button, Empty, Modal, PageTitle, Spinner } from "@/components/ui";

const SUPPORT_USERNAME = "kubik_support";

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Открыт", cls: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  answered: { label: "Есть ответ", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  closed: { label: "Закрыт", cls: "border-white/15 bg-white/5 text-slate-300" },
};

export default function Support() {
  const { toast, toastError } = useApp();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sel, setSel] = useState<Ticket | null>(null);
  const [msgs, setMsgs] = useState<TicketMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    try {
      const r = await getTickets();
      setTickets(r.tickets);
      setIsAdmin(r.is_admin);
    } catch (e) {
      setTickets([]);
      toastError(e);
    }
  }, [toastError]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const loadMessages = async (t: Ticket) => {
    setMsgLoading(true);
    try {
      const r = await getMessages(t.id);
      setMsgs(r.messages);
    } catch (e) {
      toastError(e);
    } finally {
      setMsgLoading(false);
    }
  };

  const open = (t: Ticket) => {
    setSel(t);
    setMsgs([]);
    void loadMessages(t);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs]);

  const send = async () => {
    if (!sel || !reply.trim()) return;
    setSending(true);
    try {
      await replyTicket(sel.id, reply.trim());
      setReply("");
      await loadMessages(sel);
    } catch (e) {
      toastError(e);
    } finally {
      setSending(false);
    }
  };

  const create = async () => {
    if (!title.trim() || !text.trim()) return;
    setCreating(true);
    try {
      await createTicket(title.trim(), text.trim());
      toast("Обращение создано", "success");
      setNewOpen(false);
      setTitle("");
      setText("");
      await loadTickets();
    } catch (e) {
      toastError(e);
    } finally {
      setCreating(false);
    }
  };

  const closed = sel?.status === "closed";

  return (
    <div className="page space-y-4">
      <PageTitle>Поддержка</PageTitle>
      <div className="stagger space-y-4">
        <Button block className="!py-3.5" onClick={() => setNewOpen(true)}>
          <Plus size={18} /> Новый тикет
        </Button>

        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300">
            <MessageCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white">Связаться с поддержкой</div>
            <div className="text-sm text-slate-400">@{SUPPORT_USERNAME}</div>
          </div>
          <Button variant="ghost" onClick={() => openTgLink(`https://t.me/${SUPPORT_USERNAME}`)}>
            Написать
          </Button>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white">{isAdmin ? "Все обращения" : "Ваши обращения"}</h3>
          <div className="mt-3 space-y-2">
            {tickets === null && <div className="skeleton h-16" />}
            {tickets?.length === 0 && <div className="py-4 text-center text-sm text-slate-500">Обращений пока нет</div>}
            {tickets?.map((t) => {
              const st = STATUS[t.status] ?? { label: t.status, cls: STATUS.closed.cls };
              return (
                <button
                  key={t.id}
                  onClick={() => open(t)}
                  className={cn("card card-hover press w-full p-4 text-left", sel?.id === t.id && "!border-sky-400/60")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-white">{t.title}</span>
                    <span className={cn("chip", st.cls)}>{st.label}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{fmtDate(t.created_at)}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card min-h-52 p-4">
          {!sel ? (
            <Empty icon={<MessagesSquare size={28} />}>Выберите обращение или создайте новое</Empty>
          ) : (
            <div className="anim-fade">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-white">{sel.title}</h3>
                <span className={cn("chip", (STATUS[sel.status] ?? STATUS.closed).cls)}>{(STATUS[sel.status] ?? { label: sel.status }).label}</span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {msgLoading && (
                  <div className="flex justify-center py-6 text-slate-400">
                    <Spinner />
                  </div>
                )}
                {msgs.map((m, i) => {
                  const mine = !m.is_admin;
                  return (
                    <div key={m.id ?? i} className={cn("anim-pop flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", mine ? "rounded-br-md bg-sky-500/20 text-sky-50" : "rounded-bl-md bg-white/8 text-slate-100")}>
                        <div className="mb-0.5 text-[0.68rem] font-semibold text-slate-400">{m.sender_name}</div>
                        <div className="whitespace-pre-wrap break-words">{m.message}</div>
                        <div className="mt-1 text-right text-[0.65rem] text-slate-500">{fmtDateTime(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {closed ? (
                <div className="mt-3 rounded-xl bg-white/5 p-3 text-center text-sm text-slate-400">Обращение закрыто. Создайте новое, если вопрос остался.</div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input className="input" placeholder="Ваше сообщение…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} />
                  <Button className="shrink-0 !px-4" loading={sending} disabled={!reply.trim()} onClick={send} aria-label="Отправить">
                    <Send size={17} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Новое обращение">
        <div className="space-y-3">
          <input className="input" placeholder="Тема" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input min-h-28 resize-none" placeholder="Опишите проблему" value={text} onChange={(e) => setText(e.target.value)} />
          <Button block loading={creating} disabled={!title.trim() || !text.trim()} onClick={create}>
            Отправить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
