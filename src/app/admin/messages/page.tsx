import Link from "next/link";
import { MessageActions } from "@/components/admin/message-actions";
import { EmptyState, PageHeader, Tabs, dateTime } from "@/components/admin/ui";
import { listContactMessages } from "@/services/contact.service";

export const metadata = { title: "Messages" };

/** Contact-form inbox. */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: raw } = await searchParams;
  const filter = raw === "unread" ? "unread" : "all";
  const { messages, unread } = await listContactMessages(filter);

  return (
    <>
      <PageHeader
        title="Messages"
        description={<>Messages from the <Link href="/contact" className="underline">contact form</Link>. Reply by email: each one has the sender&apos;s address.</>}
      />
      <Tabs
        current={filter}
        items={[
          { value: "all", label: "All", href: "/admin/messages" },
          { value: "unread", label: "Unread", href: "/admin/messages?filter=unread", count: unread },
        ]}
      />
      {messages.length === 0 ? (
        <EmptyState title={filter === "unread" ? "No unread messages" : "No messages yet"}>New contact-form messages will show up here.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-lg border p-5 ${m.read ? "border-line bg-paper/40" : "border-ink/30 bg-paper"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {!m.read && <span className="mr-2 inline-block size-2 rounded-full bg-accent align-middle" aria-label="Unread" />}
                    {m.subject}
                  </p>
                  <p className="text-sm text-muted">
                    {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="underline">{m.email}</a> · {dateTime(m.createdAt)}
                  </p>
                </div>
                <MessageActions id={m.id} read={m.read} />
              </div>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
