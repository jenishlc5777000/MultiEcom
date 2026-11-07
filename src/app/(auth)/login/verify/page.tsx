import Link from "next/link";
import { redirect } from "next/navigation";
import { OtpVerifyForm } from "@/components/auth/otp-forms";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { otpRequestSchema } from "@/lib/validations";

export const metadata = { title: "Enter code" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; callbackUrl?: string }> }) {
  const params = await searchParams;
  const email = otpRequestSchema.safeParse({ email: params.email });
  if (!email.success) redirect("/login");
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl">Check your email</h1>
        <p className="text-sm text-ink/80">
          We sent a code to <strong className="text-ink">{email.data.email}</strong>. It expires in 10 minutes.
        </p>
      </div>
      <OtpVerifyForm email={email.data.email} callbackUrl={callbackUrl} />
      <p className="text-center text-sm">
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="inline-flex min-h-touch items-center font-medium text-accent underline">
          Use a different email or resend
        </Link>
      </p>
    </div>
  );
}
