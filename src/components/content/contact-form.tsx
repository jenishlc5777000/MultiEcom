"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { sendContactMessageAction } from "@/actions/contact.actions";
import { Button } from "@/components/ui/button";

const input = "min-h-12 w-full rounded-md border border-line bg-paper px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none";

export function ContactForm({ subjects, showPhone }: { subjects: string[]; showPhone: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return (
      <div role="status" className="flex items-start gap-4 rounded-lg border border-line bg-paper p-6">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-ready" aria-hidden />
        <p className="text-lg">{done}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          setError(null);
          const res = await sendContactMessageAction(data);
          if (res.ok) setDone(res.data);
          else setError(res.error);
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Your name</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        {showPhone && (
          <label className="space-y-2">
            <span className="text-sm font-medium">Phone <span className="text-muted">(optional)</span></span>
            <input name="phone" type="tel" maxLength={20} autoComplete="tel" className={input} />
          </label>
        )}
        <label className={showPhone ? "space-y-2" : "space-y-2 sm:col-span-2"}>
          <span className="text-sm font-medium">Subject</span>
          <select name="subject" required className={input} defaultValue={subjects[0]}>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Message</span>
        <textarea name="message" required minLength={10} maxLength={4000} rows={6} className={`${input} py-3`} />
      </label>
      {/* Honeypot field, hidden from people */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] size-px opacity-0" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
