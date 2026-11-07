import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { getSettingsForEdit } from "@/services/admin/settings-admin.service";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const initial = await getSettingsForEdit();
  return (
    <>
      <PageHeader title="Settings" description="These values drive checkout totals, the promise strip on the home page, the footer and the policy pages." />
      <SettingsForm initial={initial} />
    </>
  );
}
