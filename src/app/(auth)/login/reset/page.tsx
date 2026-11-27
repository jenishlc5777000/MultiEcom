import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string; token?: string }> }) {
  const { email = "", token = "" } = await searchParams;
  const looksValid = /^[a-f0-9]{64}$/.test(token) && email.includes("@");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl">Choose a new password</h1>
      </div>
      {looksValid ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <p className="text-sm text-ink/80">
          This reset link is broken. <Link href="/login/forgot" className="underline underline-offset-4">Ask for a new one</Link>.
        </p>
      )}
    </div>
  );
}
