"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SiteConfig } from "@/lib/site-config";
import { Field, TextArea, TextInput } from "../form";
import { Panel, SaveBar, SwitchRow, useSection } from "./shared";

const TIP = 'Use "/" for a line break and *asterisks* to highlight a word.';

/** All storefront text: hero, section titles, story, process, closing call to action, contact page. */
export function ContentTab({ initial }: { initial: SiteConfig["content"] }) {
  const s = useSection("content", initial);
  const c = s.v;
  const sub = <K extends keyof typeof c>(k: K) => (patch: Partial<(typeof c)[K]>) => s.set(k, { ...c[k], ...patch });
  const hero = sub("hero");
  const sec = sub("sections");
  const story = sub("story");
  const proc = sub("process");
  const closing = sub("closing");
  const contact = sub("contact");
  const input = (id: string, value: string, onChange: (v: string) => void, max = 120) => (
    <TextInput id={id} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} />
  );

  return (
    <div className="space-y-6">
      <Panel id="content-hero" title="Hero">
        <SwitchRow label="Use the homepage banner when one is active" hint="On: an active banner's title, text and photo replace the text below. Off: always use this text." checked={c.hero.useBanner} onChange={(x) => hero({ useBanner: x })} />
        <SwitchRow label="Show the numbers under the hero" hint="Ready to ship · glazes · categories" checked={c.hero.showStats} onChange={(x) => hero({ showStats: x })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Small line above the title" htmlFor="he">{input("he", c.hero.eyebrow, (x) => hero({ eyebrow: x }), 80)}</Field>
          <Field label="Title" htmlFor="ht" hint={TIP}>{input("ht", c.hero.title, (x) => hero({ title: x }), 160)}</Field>
          <Field label="Text under the title" htmlFor="hs" className="sm:col-span-2">
            <TextArea id="hs" rows={2} maxLength={300} value={c.hero.subtitle} onChange={(e) => hero({ subtitle: e.target.value })} />
          </Field>
          <Field label="Main button" htmlFor="hc">{input("hc", c.hero.ctaLabel, (x) => hero({ ctaLabel: x }), 40)}</Field>
          <Field label="Main button link" htmlFor="hcl" hint="e.g. /category or /category/mugs">{input("hcl", c.hero.ctaHref, (x) => hero({ ctaHref: x }), 300)}</Field>
          <Field label="Second button" htmlFor="h2" hint="Leave empty to hide">{input("h2", c.hero.secondaryLabel, (x) => hero({ secondaryLabel: x }), 40)}</Field>
          <Field label="Second button link" htmlFor="h2l">{input("h2l", c.hero.secondaryHref, (x) => hero({ secondaryHref: x }), 300)}</Field>
        </div>
      </Panel>

      <Panel id="content-sections" title="Section titles" description={TIP}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categories: small line" htmlFor="s1">{input("s1", c.sections.categoriesEyebrow, (x) => sec({ categoriesEyebrow: x }), 60)}</Field>
          <Field label="Categories: title" htmlFor="s2">{input("s2", c.sections.categoriesTitle, (x) => sec({ categoriesTitle: x }), 80)}</Field>
          <Field label="Ready to ship: small line" htmlFor="s3">{input("s3", c.sections.readyEyebrow, (x) => sec({ readyEyebrow: x }), 60)}</Field>
          <Field label="Ready to ship: title" htmlFor="s4">{input("s4", c.sections.readyTitle, (x) => sec({ readyTitle: x }), 80)}</Field>
          <Field label="New arrivals: small line" htmlFor="s5">{input("s5", c.sections.newEyebrow, (x) => sec({ newEyebrow: x }), 60)}</Field>
          <Field label="New arrivals: title" htmlFor="s6">{input("s6", c.sections.newTitle, (x) => sec({ newTitle: x }), 80)}</Field>
        </div>
      </Panel>

      <Panel id="content-story" title="Our story">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Small line" htmlFor="st1">{input("st1", c.story.eyebrow, (x) => story({ eyebrow: x }), 60)}</Field>
          <Field label="Title" htmlFor="st2" hint={TIP}>{input("st2", c.story.title, (x) => story({ title: x }))}</Field>
          <Field label="Story text" htmlFor="st3" hint="Leave a blank line between paragraphs" className="sm:col-span-2">
            <TextArea id="st3" rows={5} maxLength={1200} value={c.story.body} onChange={(e) => story({ body: e.target.value })} />
          </Field>
          <Field label="Button" htmlFor="st4">{input("st4", c.story.ctaLabel, (x) => story({ ctaLabel: x }), 40)}</Field>
        </div>
      </Panel>

      <Panel id="content-process" title="The process">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Small line" htmlFor="p1">{input("p1", c.process.eyebrow, (x) => proc({ eyebrow: x }), 60)}</Field>
          <Field label="Title" htmlFor="p2" hint={TIP}>{input("p2", c.process.title, (x) => proc({ title: x }), 80)}</Field>
        </div>
        <ol className="space-y-3">
          {c.process.steps.map((step, i) => (
            <li key={i} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[180px_1fr_auto] sm:items-start">
              <TextInput aria-label={`Step ${i + 1} title`} maxLength={40} value={step.title} placeholder={`Step ${i + 1}`} onChange={(e) => proc({ steps: c.process.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <TextArea aria-label={`Step ${i + 1} text`} rows={2} maxLength={240} className="min-h-11" value={step.body} onChange={(e) => proc({ steps: c.process.steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
              <button type="button" aria-label={`Remove step ${i + 1}`} className="inline-flex size-touch items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger" onClick={() => proc({ steps: c.process.steps.filter((_, j) => j !== i) })}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ol>
        {c.process.steps.length < 6 && (
          <button type="button" className="inline-flex items-center gap-2 text-sm font-medium" onClick={() => proc({ steps: [...c.process.steps, { title: "", body: "" }] })}>
            <Plus className="size-4" /> Add a step
          </button>
        )}
      </Panel>

      <Panel id="content-closing" title="Closing call to action">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="c1" hint={TIP}>{input("c1", c.closing.title, (x) => closing({ title: x }))}</Field>
          <Field label="Text" htmlFor="c2">{input("c2", c.closing.body, (x) => closing({ body: x }), 240)}</Field>
          <Field label="Button" htmlFor="c3">{input("c3", c.closing.ctaLabel, (x) => closing({ ctaLabel: x }), 40)}</Field>
          <Field label="Button link" htmlFor="c4">{input("c4", c.closing.ctaHref, (x) => closing({ ctaHref: x }), 300)}</Field>
        </div>
      </Panel>

      <Panel id="content-contact" title="Contact page">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="ct1" hint={TIP}>{input("ct1", c.contact.title, (x) => contact({ title: x }), 80)}</Field>
          <Field label="Intro text" htmlFor="ct2" className="sm:col-span-2">
            <TextArea id="ct2" rows={2} maxLength={400} value={c.contact.intro} onChange={(e) => contact({ intro: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <SaveBar {...s} label="Save content" />
    </div>
  );
}

/** Contact form behaviour, subjects and email templates. */
export function ContactTab({ initial }: { initial: SiteConfig["contactForm"] }) {
  const s = useSection("contactForm", initial);
  const f = s.v;
  const vars = "{{name}} {{email}} {{phone}} {{subject}} {{message}} {{store}}";

  return (
    <div className="space-y-6">
      <Panel id="contact-form" title="Contact form" description="The form on /contact. Messages are saved in Messages and emailed to you.">
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow label="Contact page is on" hint="Adds /contact and a footer link" checked={f.enabled} onChange={(x) => s.set("enabled", x)} />
          <SwitchRow label="Ask for a phone number" checked={f.showPhone} onChange={(x) => s.set("showPhone", x)} />
        </div>
        <Field label="Subjects visitors can pick" htmlFor="cs" hint="One per line, up to 10">
          <TextArea
            id="cs"
            rows={4}
            value={f.subjects.join("\n")}
            onChange={(e) => s.set("subjects", e.target.value.split("\n").map((x) => x.trimStart()).filter((x, i, all) => x || i === all.length - 1).slice(0, 10))}
          />
        </Field>
        <Field label="Message shown after sending" htmlFor="sm">
          <TextInput id="sm" maxLength={300} value={f.successMessage} onChange={(e) => s.set("successMessage", e.target.value)} />
        </Field>
      </Panel>

      <Panel id="contact-email" title="Email to you" description={`Placeholders: ${vars}`}>
        <Field label="Send to" htmlFor="ne" hint="Empty = the contact email in Settings">
          <TextInput id="ne" type="email" value={f.notifyEmail} onChange={(e) => s.set("notifyEmail", e.target.value)} />
        </Field>
        <Field label="Subject" htmlFor="ns"><TextInput id="ns" maxLength={160} value={f.notifySubject} onChange={(e) => s.set("notifySubject", e.target.value)} /></Field>
        <Field label="Body" htmlFor="nb"><TextArea id="nb" rows={5} maxLength={3000} value={f.notifyBody} onChange={(e) => s.set("notifyBody", e.target.value)} /></Field>
      </Panel>

      <Panel id="contact-reply" title="Automatic reply to the visitor" description={`Placeholders: ${vars}`}>
        <SwitchRow label="Send an automatic reply" checked={f.autoReply} onChange={(x) => s.set("autoReply", x)} />
        {f.autoReply && (
          <>
            <Field label="Subject" htmlFor="as"><TextInput id="as" maxLength={160} value={f.autoReplySubject} onChange={(e) => s.set("autoReplySubject", e.target.value)} /></Field>
            <Field label="Body" htmlFor="ab"><TextArea id="ab" rows={7} maxLength={3000} value={f.autoReplyBody} onChange={(e) => s.set("autoReplyBody", e.target.value)} /></Field>
          </>
        )}
        <p className="text-xs text-muted">Emails go out through the email service in Integrations.</p>
      </Panel>

      <SaveBar {...s} label="Save contact form" />
    </div>
  );
}
