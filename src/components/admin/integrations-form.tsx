"use client";

import { CheckCircle2, CircleDashed, Copy, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveIntegrationsAction, testEmailAction, testRazorpayAction, testSmsAction, testStorageAction } from "@/actions/admin/site.actions";
import { Button } from "@/components/ui/button";
import type { IntegrationsAdminView, LoginMethod, SecretField, SmsProvider, StorageProvider } from "@/services/integrations.service";
import type { ActionResult } from "@/types/dto";
import { Field, FormMessage, Select, TextInput, Toggle } from "./form";

type Secret = IntegrationsAdminView["razorpay"]["keySecret"];

const SMS_HELP: Record<SmsProvider, { key: string; sender: string; template: string; sid?: string; note: string }> = {
  none: { key: "", sender: "", template: "", note: "SMS is off." },
  msg91: { key: "Auth key", sender: "Sender ID (optional)", template: "Flow / template ID", note: 'MSG91 Flow API. Your flow template needs one variable named "message".' },
  twilio: { key: "Auth token", sender: "From number (+1…)", template: "", sid: "Account SID", note: "Twilio Messaging. Indian numbers need a DLT-registered sender." },
  fast2sms: { key: "API key", sender: "Sender ID (DLT route)", template: "DLT template ID (optional)", note: "With a DLT template ID the DLT route is used, otherwise the quick route." },
};

/** Ready-made settings for S3-compatible services (endpoint pattern and region). */
const S3_PRESETS: { name: string; endpoint: string; region: string; note: string }[] = [
  { name: "Amazon S3", endpoint: "", region: "ap-south-1", note: "Leave the endpoint empty. Region e.g. ap-south-1 (Mumbai). Allow public read on the bucket (bucket policy) or put CloudFront in front and use it as the public URL." },
  { name: "Cloudflare R2", endpoint: "https://<ACCOUNT_ID>.r2.cloudflarestorage.com", region: "auto", note: "Region auto. Turn on the r2.dev public URL or a custom domain for the bucket, and paste it as the public URL." },
  { name: "DigitalOcean Spaces", endpoint: "https://blr1.digitaloceanspaces.com", region: "blr1", note: "Use your Space's region (blr1 = Bangalore). Set the Space's file listing to public or use its CDN URL." },
  { name: "Wasabi", endpoint: "https://s3.ap-southeast-1.wasabisys.com", region: "ap-southeast-1", note: "Match the endpoint to the bucket's region." },
  { name: "Backblaze B2", endpoint: "https://s3.us-west-004.backblazeb2.com", region: "us-west-004", note: "Use the bucket's S3 endpoint from the B2 dashboard and an application key." },
];

/** Write-only secret input: shows whether a value is saved, never the value. */
function SecretInput({ id, label, state, value, onChange, cleared, onClear }: { id: string; label: string; state: Secret; value: string; onChange: (v: string) => void; cleared: boolean; onClear: (v: boolean) => void }) {
  const status = cleared
    ? "Will be removed when you save"
    : state.saved
      ? `Saved ${state.hint}${state.source === "env" ? " (from .env)" : ""}. Leave empty to keep it.`
      : "Not set";
  return (
    <Field label={label} htmlFor={id} hint={status}>
      <div className="flex items-center gap-2">
        <span className="relative w-full">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <TextInput id={id} type="password" autoComplete="new-password" className="pl-9" placeholder={state.saved ? "••••••••  (unchanged)" : "Paste the value"} value={value} onChange={(e) => onChange(e.target.value)} />
        </span>
        {state.saved && state.source === "dashboard" && (
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={cleared} onChange={(e) => onClear(e.target.checked)} /> Remove
          </label>
        )}
      </div>
    </Field>
  );
}

const STORAGE_NAMES: Record<Exclude<StorageProvider, "auto">, string> = { cloudinary: "Cloudinary", s3: "S3 bucket", vercel_blob: "Vercel Blob" };

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-ready" : "text-muted"}`}>
      {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <CircleDashed className="size-4" aria-hidden />} {label}
    </span>
  );
}

export function IntegrationsForm({ initial }: { initial: IntegrationsAdminView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [testMsg, setTestMsg] = useState<Record<string, { ok: boolean; message: string } | null>>({});

  const [rp, setRp] = useState({ keyId: initial.razorpay.keyId, keySecret: "", webhookSecret: "" });
  const [email, setEmail] = useState({ from: initial.email.from, apiKey: "" });
  const [sms, setSms] = useState({ ...initial.sms, apiKey: "" });
  const [google, setGoogle] = useState({ clientId: initial.google.clientId, clientSecret: "" });
  const [loginMethods, setLoginMethods] = useState<LoginMethod>(initial.login.methods);
  const [storage, setStorage] = useState({ ...initial.storage, cloudSecret: "", s3Secret: "", blobToken: "" });
  const [clear, setClear] = useState<SecretField[]>([]);
  const [testTo, setTestTo] = useState({ email: "", phone: "" });
  const toggleClear = (f: SecretField) => (on: boolean) => setClear((c) => (on ? [...c, f] : c.filter((x) => x !== f)));
  const help = SMS_HELP[sms.provider];
  const [s3Note, setS3Note] = useState("");
  // Which service uploads will use, from what is saved.
  const savedHas = {
    cloudinary: Boolean((initial.storage.cloudName || initial.storage.cloudFromEnv) && initial.storage.cloudKey !== undefined && initial.storage.cloudSecret.saved),
    s3: Boolean(initial.storage.s3Bucket && initial.storage.s3KeyId && initial.storage.s3Secret.saved),
    vercel_blob: initial.storage.blobToken.saved,
  };
  const usedStorage: Exclude<StorageProvider, "auto"> | undefined =
    initial.storage.provider === "auto" ? (["cloudinary", "s3", "vercel_blob"] as const).find((p) => savedHas[p]) : savedHas[initial.storage.provider] ? initial.storage.provider : undefined;
  const storageReady = Boolean(usedStorage);

  const runTest = (key: string, fn: () => Promise<ActionResult<string>>) =>
    start(async () => {
      setTestMsg((m) => ({ ...m, [key]: null }));
      const r = await fn();
      setTestMsg((m) => ({ ...m, [key]: r.ok ? { ok: true, message: r.data } : { ok: false, message: r.error } }));
    });

  const section = "rounded-lg border border-line bg-paper/60 p-5 md:p-6 space-y-5";
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const st = storage;
          const r = await saveIntegrationsAction({
            razorpay: rp, email, sms, google, login: { methods: loginMethods }, clear,
            storage: {
              provider: st.provider, cloudName: st.cloudName, cloudKey: st.cloudKey, cloudSecret: st.cloudSecret,
              s3Endpoint: st.s3Endpoint, s3Region: st.s3Region, s3Bucket: st.s3Bucket, s3KeyId: st.s3KeyId, s3Secret: st.s3Secret, s3PublicUrl: st.s3PublicUrl,
              blobToken: st.blobToken,
            },
          });
          setMsg(r.ok ? { ok: true, message: "Saved. New credentials are used within 30 seconds." } : { ok: false, message: r.error });
          if (r.ok) {
            setRp((s) => ({ ...s, keySecret: "", webhookSecret: "" }));
            setEmail((s) => ({ ...s, apiKey: "" }));
            setSms((s) => ({ ...s, apiKey: "" }));
            setGoogle((s) => ({ ...s, clientSecret: "" }));
            setStorage((s) => ({ ...s, cloudSecret: "", s3Secret: "", blobToken: "" }));
            setClear([]);
            router.refresh();
          }
        });
      }}
    >
      <p className="flex items-start gap-2 rounded-md bg-surface p-3 text-sm text-muted">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        Secret keys are encrypted before they are stored and are never shown again after saving. Values you leave empty here fall back to the .env file.
      </p>

      {/* Customer login */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-[15px] font-semibold">Customer login</h2>
          <StatusDot ok={Boolean((google.clientId || initial.google.clientIdFromEnv) && initial.google.clientSecret.saved)} label={initial.google.clientSecret.saved ? "Google connected" : "Google not connected"} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How customers sign in</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Login method">
            {([
              ["both", "Email code + Google", "Customers choose either"],
              ["email", "Email code only", "6-digit code sent by email"],
              ["google", "Google only", "Needs the Google keys below"],
            ] as const).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={loginMethods === value}
                onClick={() => setLoginMethods(value)}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${loginMethods === value ? "border-ink ring-1 ring-ink" : "border-line hover:border-muted"}`}
              >
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {loginMethods === "google" && !initial.google.clientSecret.saved && (
          <p className="text-sm text-mto">Until Google is connected, the email code stays on so customers aren&apos;t locked out.</p>
        )}
        <p className="text-xs text-muted">The store owner can always sign in with the owner code or password, whatever you choose here.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Google client ID" htmlFor="gid" hint={initial.google.clientIdFromEnv && !google.clientId ? "Currently using the client ID from .env" : "Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application)"}>
            <TextInput id="gid" value={google.clientId} placeholder="1234-abc.apps.googleusercontent.com" onChange={(e) => setGoogle((s) => ({ ...s, clientId: e.target.value.trim() }))} />
          </Field>
          <SecretInput id="gsec" label="Google client secret" state={initial.google.clientSecret} value={google.clientSecret} onChange={(v) => setGoogle((s) => ({ ...s, clientSecret: v }))} cleared={clear.includes("google.clientSecret")} onClear={toggleClear("google.clientSecret")} />
          <Field label="Authorised redirect URI (add this in Google Cloud)" htmlFor="gru" className="sm:col-span-2">
            <div className="flex gap-2">
              <TextInput id="gru" readOnly value={initial.google.redirectUrl} />
              <Button type="button" variant="secondary" size="icon" aria-label="Copy redirect URI" onClick={() => navigator.clipboard?.writeText(initial.google.redirectUrl)}><Copy /></Button>
            </div>
          </Field>
        </div>
      </section>

      {/* Image storage */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-[15px] font-semibold">Image storage</h2>
          <StatusDot ok={storageReady} label={storageReady ? `Using ${STORAGE_NAMES[usedStorage!]}` : "Not connected (images save to this computer in development)"} />
        </div>
        <p className="text-sm text-muted">Where product, category, banner, logo, review and return photos are stored.</p>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Storage service</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Storage service">
            {([
              ["auto", "Automatic", "The first one below that has keys"],
              ["cloudinary", "Cloudinary", "Resizing & CDN built in"],
              ["s3", "S3 bucket", "AWS S3, Cloudflare R2, DO Spaces, Wasabi, Backblaze"],
              ["vercel_blob", "Vercel Blob", "Storage tab in your Vercel project"],
            ] as const).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={storage.provider === value}
                onClick={() => setStorage((s) => ({ ...s, provider: value as StorageProvider }))}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${storage.provider === value ? "border-ink ring-1 ring-ink" : "border-line hover:border-muted"}`}
              >
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {(storage.provider === "auto" || storage.provider === "cloudinary") && (
          <div className="space-y-3 rounded-md border border-line p-4">
            <p className="text-sm font-medium">Cloudinary <span className="font-normal text-muted">· cloudinary.com → Settings → API Keys</span></p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cloud name" htmlFor="cn" hint={initial.storage.cloudFromEnv && !storage.cloudName ? "Currently using the cloud name from .env" : undefined}>
                <TextInput id="cn" value={storage.cloudName} placeholder="my-store" onChange={(e) => setStorage((s) => ({ ...s, cloudName: e.target.value.trim() }))} />
              </Field>
              <Field label="API key" htmlFor="ck"><TextInput id="ck" value={storage.cloudKey} placeholder="123456789012345" onChange={(e) => setStorage((s) => ({ ...s, cloudKey: e.target.value.trim() }))} /></Field>
              <SecretInput id="cs" label="API secret" state={initial.storage.cloudSecret} value={storage.cloudSecret} onChange={(v) => setStorage((s) => ({ ...s, cloudSecret: v }))} cleared={clear.includes("storage.cloudSecret")} onClear={toggleClear("storage.cloudSecret")} />
            </div>
          </div>
        )}

        {(storage.provider === "auto" || storage.provider === "s3") && (
          <div className="space-y-3 rounded-md border border-line p-4">
            <p className="text-sm font-medium">S3 bucket</p>
            <div className="flex flex-wrap gap-2">
              {S3_PRESETS.map((p) => (
                <button key={p.name} type="button" className="rounded-pill border border-line px-3 py-1 text-xs hover:bg-surface" onClick={() => { setS3Note(p.note); setStorage((s) => ({ ...s, s3Endpoint: p.endpoint, s3Region: p.region })); }}>
                  {p.name}
                </button>
              ))}
            </div>
            {s3Note && <p className="text-xs text-muted">{s3Note}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bucket name" htmlFor="sb"><TextInput id="sb" value={storage.s3Bucket} placeholder="my-store-images" onChange={(e) => setStorage((s) => ({ ...s, s3Bucket: e.target.value.trim() }))} /></Field>
              <Field label="Region" htmlFor="sr" hint="e.g. ap-south-1, or auto for R2"><TextInput id="sr" value={storage.s3Region} placeholder="ap-south-1" onChange={(e) => setStorage((s) => ({ ...s, s3Region: e.target.value.trim() }))} /></Field>
              <Field label="Endpoint" htmlFor="se" hint="Empty for Amazon S3. Needed for R2, Spaces, Wasabi, Backblaze." className="sm:col-span-2">
                <TextInput id="se" value={storage.s3Endpoint} placeholder="https://<account>.r2.cloudflarestorage.com" onChange={(e) => setStorage((s) => ({ ...s, s3Endpoint: e.target.value.trim() }))} />
              </Field>
              <Field label="Access key ID" htmlFor="sk3"><TextInput id="sk3" value={storage.s3KeyId} autoComplete="off" onChange={(e) => setStorage((s) => ({ ...s, s3KeyId: e.target.value.trim() }))} /></Field>
              <SecretInput id="ss3" label="Secret access key" state={initial.storage.s3Secret} value={storage.s3Secret} onChange={(v) => setStorage((s) => ({ ...s, s3Secret: v }))} cleared={clear.includes("storage.s3Secret")} onClear={toggleClear("storage.s3Secret")} />
              <Field label="Public URL (optional)" htmlFor="spu" hint="CDN, custom domain or r2.dev address that serves the bucket. Empty = the bucket's own address." className="sm:col-span-2">
                <TextInput id="spu" value={storage.s3PublicUrl} placeholder="https://images.yourdomain.com" onChange={(e) => setStorage((s) => ({ ...s, s3PublicUrl: e.target.value.trim() }))} />
              </Field>
            </div>
            <p className="text-xs text-muted">The key needs permission to upload (PutObject) and delete (DeleteObject) in this bucket, and images must be publicly readable.</p>
          </div>
        )}

        {(storage.provider === "auto" || storage.provider === "vercel_blob") && (
          <div className="space-y-3 rounded-md border border-line p-4">
            <p className="text-sm font-medium">Vercel Blob <span className="font-normal text-muted">· Vercel project → Storage → Create → Blob</span></p>
            <SecretInput id="bt" label="Read-write token" state={initial.storage.blobToken} value={storage.blobToken} onChange={(v) => setStorage((s) => ({ ...s, blobToken: v }))} cleared={clear.includes("storage.blobToken")} onClear={toggleClear("storage.blobToken")} />
            <p className="text-xs text-muted">When the Blob store is connected to this Vercel project, the token is added automatically (BLOB_READ_WRITE_TOKEN) and you don&apos;t need to paste it.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => runTest("storage", testStorageAction)}>Test saved storage</Button>
          <FormMessage result={testMsg.storage ?? null} />
        </div>
        <p className="text-xs text-muted">Save first, then test. Images already uploaded stay where they are; new uploads go to the service chosen here.</p>
      </section>

      {/* Razorpay */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-[15px] font-semibold">Payment gateway: Razorpay</h2>
          <StatusDot ok={Boolean(rp.keyId || initial.razorpay.keyIdFromEnv) && initial.razorpay.keySecret.saved} label={initial.razorpay.keySecret.saved ? "Connected" : "Not connected"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Key ID" htmlFor="rk" hint={initial.razorpay.keyIdFromEnv && !rp.keyId ? "Currently using the key ID from .env" : "Starts with rzp_test_ or rzp_live_"}>
            <TextInput id="rk" value={rp.keyId} placeholder="rzp_live_…" onChange={(e) => setRp((s) => ({ ...s, keyId: e.target.value.trim() }))} />
          </Field>
          <SecretInput id="rs" label="Key secret" state={initial.razorpay.keySecret} value={rp.keySecret} onChange={(v) => setRp((s) => ({ ...s, keySecret: v }))} cleared={clear.includes("razorpay.keySecret")} onClear={toggleClear("razorpay.keySecret")} />
          <SecretInput id="rw" label="Webhook secret" state={initial.razorpay.webhookSecret} value={rp.webhookSecret} onChange={(v) => setRp((s) => ({ ...s, webhookSecret: v }))} cleared={clear.includes("razorpay.webhookSecret")} onClear={toggleClear("razorpay.webhookSecret")} />
          <Field label="Webhook URL (add this in the Razorpay dashboard)" htmlFor="ru">
            <div className="flex gap-2">
              <TextInput id="ru" readOnly value={initial.razorpay.webhookUrl} />
              <Button type="button" variant="secondary" size="icon" aria-label="Copy webhook URL" onClick={() => navigator.clipboard?.writeText(initial.razorpay.webhookUrl)}><Copy /></Button>
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => runTest("rp", testRazorpayAction)}>Test saved keys</Button>
          <FormMessage result={testMsg.rp ?? null} />
        </div>
      </section>

      {/* Email */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-[15px] font-semibold">Email: Resend</h2>
          <StatusDot ok={initial.email.apiKey.saved} label={initial.email.apiKey.saved ? "Connected" : "Not connected (emails print to the server log in development)"} />
        </div>
        <p className="text-sm text-muted">Sends sign-in codes, order emails and contact-form messages.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SecretInput id="ek" label="API key" state={initial.email.apiKey} value={email.apiKey} onChange={(v) => setEmail((s) => ({ ...s, apiKey: v }))} cleared={clear.includes("email.apiKey")} onClear={toggleClear("email.apiKey")} />
          <Field label="From address" htmlFor="ef" hint={`Must be on a domain verified in Resend. Default: ${initial.email.fromDefault}`}>
            <TextInput id="ef" value={email.from} placeholder="Clay & Glaze <hello@yourdomain.com>" onChange={(e) => setEmail((s) => ({ ...s, from: e.target.value }))} />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Send a test to" htmlFor="et" className="w-full max-w-xs">
            <TextInput id="et" type="email" value={testTo.email} onChange={(e) => setTestTo((s) => ({ ...s, email: e.target.value }))} />
          </Field>
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => runTest("email", () => testEmailAction(testTo.email))}>Send test email</Button>
          <FormMessage result={testMsg.email ?? null} />
        </div>
      </section>

      {/* SMS */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-[15px] font-semibold">SMS</h2>
          <StatusDot ok={sms.provider !== "none" && initial.sms.apiKey.saved} label={sms.provider === "none" ? "Off" : initial.sms.apiKey.saved ? "Connected" : "Key missing"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider" htmlFor="sp" hint={help.note}>
            <Select id="sp" value={sms.provider} onChange={(e) => setSms((s) => ({ ...s, provider: e.target.value as SmsProvider }))}>
              <option value="none">Off</option>
              <option value="msg91">MSG91</option>
              <option value="twilio">Twilio</option>
              <option value="fast2sms">Fast2SMS</option>
            </Select>
          </Field>
          {sms.provider !== "none" && (
            <>
              <SecretInput id="sk" label={help.key} state={initial.sms.apiKey} value={sms.apiKey} onChange={(v) => setSms((s) => ({ ...s, apiKey: v }))} cleared={clear.includes("sms.apiKey")} onClear={toggleClear("sms.apiKey")} />
              {help.sid && (
                <Field label={help.sid} htmlFor="ss"><TextInput id="ss" value={sms.accountSid} onChange={(e) => setSms((s) => ({ ...s, accountSid: e.target.value }))} /></Field>
              )}
              <Field label={help.sender} htmlFor="sn"><TextInput id="sn" value={sms.senderId} onChange={(e) => setSms((s) => ({ ...s, senderId: e.target.value }))} /></Field>
              {help.template && (
                <Field label={help.template} htmlFor="stid"><TextInput id="stid" value={sms.templateId} onChange={(e) => setSms((s) => ({ ...s, templateId: e.target.value }))} /></Field>
              )}
              <div className="sm:col-span-2">
                <Toggle label="Text customers when their order status changes" description="Confirmed, being made, dispatched (with tracking link), delivered, cancelled." checked={sms.orderUpdates} onChange={(orderUpdates) => setSms((s) => ({ ...s, orderUpdates }))} />
              </div>
            </>
          )}
        </div>
        {sms.provider !== "none" && (
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Send a test to" htmlFor="stt" className="w-full max-w-xs">
              <TextInput id="stt" type="tel" placeholder="98765 43210" value={testTo.phone} onChange={(e) => setTestTo((s) => ({ ...s, phone: e.target.value }))} />
            </Field>
            <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => runTest("sms", () => testSmsAction(testTo.phone))}>Send test SMS</Button>
            <FormMessage result={testMsg.sms ?? null} />
          </div>
        )}
        <p className="text-xs text-muted">Save first, then send a test: tests use the saved settings.</p>
      </section>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-canvas/95 p-3 shadow-float backdrop-blur">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save integrations"}</Button>
        <FormMessage result={msg} />
      </div>
    </form>
  );
}
