import { Mail, MapPin, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/content/contact-form";
import { RichTitle } from "@/components/content/rich-title";
import { getSiteConfig } from "@/services/site-config.service";
import { getStoreInfo } from "@/services/store.service";

export const metadata = { title: "Contact" };

/** Contact page. Text, subjects and email templates come from Admin → Studio → Contact form. */
export default async function ContactPage() {
  const [site, store] = await Promise.all([getSiteConfig(), getStoreInfo()]);
  if (!site.contactForm.enabled || !site.visibility.pages.contact) notFound();
  const c = site.content.contact;

  return (
    <div data-studio="contact-page" className="container grid gap-14 py-12 md:py-20 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-8 lg:col-span-5">
        <div className="space-y-5">
          <p className="eyebrow">Contact</p>
          <h1 className="text-h1"><RichTitle text={c.title} /></h1>
          <p className="max-w-md text-lg leading-relaxed text-muted">{c.intro}</p>
        </div>
        <ul className="space-y-3">
          {store.contactEmail && (
            <li><a href={`mailto:${store.contactEmail}`} className="inline-flex items-center gap-3"><Mail className="size-5 text-accent" aria-hidden /><span className="link-underline">{store.contactEmail}</span></a></li>
          )}
          {store.contactPhone && (
            <li><a href={`tel:${store.contactPhone}`} className="inline-flex items-center gap-3"><Phone className="size-5 text-accent" aria-hidden /><span className="link-underline">{store.contactPhone}</span></a></li>
          )}
          {store.instagram && (
            <li><a href={store.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3"><MapPin className="size-5 text-accent" aria-hidden /><span className="link-underline">Instagram</span></a></li>
          )}
        </ul>
      </div>
      <div className="lg:col-span-7">
        <ContactForm subjects={site.contactForm.subjects} showPhone={site.contactForm.showPhone} />
      </div>
    </div>
  );
}
