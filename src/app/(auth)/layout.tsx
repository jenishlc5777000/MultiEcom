import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-lg bg-surface p-6">{children}</div>
    </main>
  );
}
