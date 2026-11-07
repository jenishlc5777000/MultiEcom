"use client";

import { MailCheck, MailOpen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMessageAction, setMessageReadAction } from "@/actions/admin/site.actions";

const btn = "inline-flex size-touch items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-40";

export function MessageActions({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} disabled={pending} aria-label={read ? "Mark as unread" : "Mark as read"} title={read ? "Mark as unread" : "Mark as read"} onClick={() => run(() => setMessageReadAction(id, !read))}>
        {read ? <MailOpen className="size-4" /> : <MailCheck className="size-4" />}
      </button>
      <button type="button" className={`${btn} hover:text-danger`} disabled={pending} aria-label="Delete message" onClick={() => confirm("Delete this message?") && run(() => deleteMessageAction(id))}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
