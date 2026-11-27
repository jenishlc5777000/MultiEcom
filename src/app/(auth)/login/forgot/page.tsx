import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { passwordResetAvailable } from "@/services/password.service";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  // Admin → Integrations → Customer login: off, or no email sending set up.
  if (!(await passwordResetAvailable())) redirect("/login");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl">Forgot password</h1>
        <p className="text-sm text-ink/80">Enter your email and we&apos;ll send you a link to choose a new password.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
