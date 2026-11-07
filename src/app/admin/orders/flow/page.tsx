import { OrderFlowForm } from "@/components/admin/order-flow-form";
import { PageHeader } from "@/components/admin/ui";
import { getOrderFlow } from "@/services/order-flow.service";

export const metadata = { title: "Order steps" };

export default async function OrderFlowPage() {
  const flow = await getOrderFlow();
  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title="Order steps"
        description="How an order moves after payment, which steps the customer sees and what each one says. Changes apply to the customer's order page straight away."
      />
      <OrderFlowForm initial={flow} />
    </>
  );
}
