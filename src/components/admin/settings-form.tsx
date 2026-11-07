"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/actions/admin/people.actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, TextInput } from "./form";

type Values = {
  shippingFlatFee: number; freeShippingThreshold: number; returnWindowDays: number; unpaidOrderTtlMinutes: number;
  announcement: string; contactEmail: string; contactPhone: string; instagram: string;
};

export function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const set = (k: keyof Values, num = false) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((s) => ({ ...s, [k]: num ? Number(e.target.value) : e.target.value }));

  const section = "rounded-lg border border-line bg-paper/60 p-5 md:p-6";
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettingsAction(v);
          setMsg(res.ok ? { ok: true, message: "Settings saved. Checkout and the policy pages now use these values." } : { ok: false, message: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      <section className={section}>
        <h2 className="mb-5 font-sans text-[15px] font-semibold">Shipping &amp; orders</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Flat shipping fee (₹)" htmlFor="ship" hint="0 means free shipping on every order.">
            <TextInput id="ship" type="number" min={0} step="1" value={v.shippingFlatFee} onChange={set("shippingFlatFee", true)} />
          </Field>
          <Field label="Free shipping over (₹)" htmlFor="free" hint="0 turns the free-shipping threshold off.">
            <TextInput id="free" type="number" min={0} step="1" value={v.freeShippingThreshold} onChange={set("freeShippingThreshold", true)} />
          </Field>
          <Field label="Return window (days after delivery)" htmlFor="ret">
            <TextInput id="ret" type="number" min={0} max={90} value={v.returnWindowDays} onChange={set("returnWindowDays", true)} />
          </Field>
          <Field label="Hold unpaid checkouts for (minutes)" htmlFor="ttl" hint="Stock is released after this.">
            <TextInput id="ttl" type="number" min={5} max={1440} value={v.unpaidOrderTtlMinutes} onChange={set("unpaidOrderTtlMinutes", true)} />
          </Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="mb-5 font-sans text-[15px] font-semibold">Storefront</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Announcement bar" htmlFor="ann" hint="Shown above the header on every page. Leave empty to hide." className="sm:col-span-2">
            <TextInput id="ann" maxLength={160} value={v.announcement} onChange={set("announcement")} />
          </Field>
          <Field label="Contact email" htmlFor="em"><TextInput id="em" type="email" value={v.contactEmail} onChange={set("contactEmail")} /></Field>
          <Field label="Contact phone" htmlFor="ph"><TextInput id="ph" type="tel" value={v.contactPhone} onChange={set("contactPhone")} /></Field>
          <Field label="Instagram URL" htmlFor="ig" className="sm:col-span-2"><TextInput id="ig" type="url" placeholder="https://instagram.com/…" value={v.instagram} onChange={set("instagram")} /></Field>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        <FormMessage result={msg} />
      </div>
    </form>
  );
}
