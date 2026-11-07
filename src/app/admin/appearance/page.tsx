import { redirect } from "next/navigation";

/** "Appearance" was renamed to Studio; keep old links working. */
export default async function AppearanceRedirect({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(tab ? `/admin/studio?tab=${encodeURIComponent(tab)}` : "/admin/studio");
}
