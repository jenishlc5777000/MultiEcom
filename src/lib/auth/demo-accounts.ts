import "server-only";
import type { UserRole } from "@/models/User";

/**
 * Fixed accounts for local development only (see demoLoginEnabled()).
 * The password comes from DEMO_PASSWORD (default "demo1234").
 */
export const DEMO_ACCOUNTS: { email: string; name: string; role: UserRole }[] = [
  { email: "customer@demo.local", name: "Demo Customer", role: "customer" },
  { email: "owner@demo.local", name: "Demo Owner", role: "owner" },
];
