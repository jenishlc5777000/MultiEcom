import { IntegrationsForm } from "@/components/admin/integrations-form";
import { PageHeader } from "@/components/admin/ui";
import { getIntegrationsForAdmin } from "@/services/integrations.service";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const initial = await getIntegrationsForAdmin();
  return (
    <>
      <PageHeader title="Integrations" description="Credentials for payments, email and SMS. Contact-form templates are in Studio → Contact form." />
      <IntegrationsForm initial={initial} />
    </>
  );
}
