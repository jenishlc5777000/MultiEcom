import { Logo } from "@/components/layout/logo";
import { getSiteConfig } from "@/services/site-config.service";

/** Sign-in pages (customer code, owner password, verify): the store's own logo from Studio → Header & logo. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteConfig();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <Logo brand={site.logo} className="mb-8 [&_img]:max-h-24 [&_img]:max-w-[240px]" />
      <div className="w-full max-w-sm rounded-lg bg-surface p-6">{children}</div>
    </main>
  );
}
