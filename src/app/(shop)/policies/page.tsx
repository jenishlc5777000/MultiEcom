import { getSiteConfig } from "@/services/site-config.service";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

export default async function PoliciesIndex() {
  // Studio → Visibility.
  if (!(await getSiteConfig()).visibility.pages.policies) notFound();
  redirect("/policies/shipping");
}
