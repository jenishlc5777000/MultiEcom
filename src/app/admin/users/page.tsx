import Link from "next/link";
import { EmptyState, FilterBar, PageHeader, Pagination, Pill, SearchInput, Table, Tabs, Td, Th, dateOnly } from "@/components/admin/ui";
import { formatINR } from "@/lib/utils";
import { listUsers } from "@/services/admin/user-admin.service";

export const metadata = { title: "Users" };

type Search = { q?: string; role?: string; page?: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const role = ["customer", "owner", "blocked"].includes(sp.role ?? "") ? sp.role! : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { users, total, pageCount } = await listUsers({ q: sp.q?.trim(), role, page });

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, role, ...patch })) if (v) p.set(k, String(v));
    return `/admin/users${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Users" description={`${total} account${total === 1 ? "" : "s"}. Spend counts paid orders only.`} />
      <Tabs
        current={role}
        items={[
          { value: "", label: "Everyone", href: href({ role: undefined, page: undefined }) },
          { value: "customer", label: "Customers", href: href({ role: "customer", page: undefined }) },
          { value: "owner", label: "Owners", href: href({ role: "owner", page: undefined }) },
          { value: "blocked", label: "Blocked", href: href({ role: "blocked", page: undefined }) },
        ]}
      />
      <FilterBar>
        {role && <input type="hidden" name="role" value={role} />}
        <SearchInput defaultValue={sp.q} placeholder="Search name, email or phone" />
      </FilterBar>

      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Spent</Th>
              <Th>Last order</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="group transition-colors hover:bg-surface/60">
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-sm font-medium uppercase" aria-hidden>
                      {(u.name || u.email).charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium group-hover:underline">{u.name || "No name"}</span>
                      <span className="block truncate text-xs text-muted">{u.email}</span>
                    </span>
                  </Link>
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1.5">
                    {u.role === "owner" ? <Pill tone="info">Owner</Pill> : <Pill>Customer</Pill>}
                    {u.isBlocked && <Pill tone="bad">Blocked</Pill>}
                  </span>
                </Td>
                <Td className="text-right tabular-nums">{u.orders}</Td>
                <Td className="text-right tabular-nums">{formatINR(u.spent)}</Td>
                <Td className="whitespace-nowrap text-muted">{u.lastOrderAt ? dateOnly(u.lastOrderAt) : "—"}</Td>
                <Td className="whitespace-nowrap text-muted">{dateOnly(u.joinedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageCount={pageCount} href={(p) => href({ page: String(p) })} />
    </>
  );
}
