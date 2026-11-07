import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { requireOwner } from "@/lib/auth/guards";
import { getPendingCounts } from "@/services/admin/approvals.service";
import { getSiteConfig } from "@/services/site-config.service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard" }, robots: { index: false } };

/** Owner dashboard shell. Every admin page and action also checks owner access itself. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const [pending, site] = await Promise.all([getPendingCounts(), getSiteConfig()]);

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-surface/80 px-4 pb-3 pt-3 backdrop-blur lg:flex lg:h-dvh lg:flex-col lg:gap-6 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="mb-2 flex items-center justify-between lg:mb-0">
          <Logo brand={site.logo} />
          <span className="rounded-pill bg-ink px-2.5 py-0.5 text-xs text-canvas">Admin</span>
        </div>
        <AdminNav pending={pending.total} ownerName={owner.name ?? owner.email ?? "Owner"} />
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 md:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
