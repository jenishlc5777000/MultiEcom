import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AutoSubmitSelect } from "@/components/admin/form";
import { EmptyState, FilterBar, PageHeader, Pill, ProductStatusPill, SearchInput, Table, Tabs, Td, Th, dateOnly } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { listCategoriesAdmin, listProducts } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "Products" };

type Search = { q?: string; status?: string; category?: string; stock?: string; removed?: string };

const AVAIL: Record<string, string> = { READY_STOCK: "Ready to ship", MADE_TO_ORDER: "Made to order", SOLD: "Sold" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = ["ACTIVE", "DRAFT", "ARCHIVED"].includes(sp.status ?? "") ? sp.status! : "ALL";
  const [products, categories] = await Promise.all([listProducts({ ...sp, status }), listCategoriesAdmin()]);

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, stock: sp.stock, status, ...patch })) if (v && v !== "ALL") p.set(k, v);
    return `/admin/products${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Active products appear in the store straight away. Drafts and archived products are hidden."
        actions={<Button asChild><Link href="/admin/products/new"><Plus /> Add product</Link></Button>}
      />

      {sp.removed && (
        <p role="status" className="mb-6 rounded-lg border border-ready/30 bg-ready/10 px-4 py-3 text-sm text-ready">
          {sp.removed === "archived" ? "That product appears in past orders, so it was archived (hidden from the store) instead of deleted." : "Product deleted."}
        </p>
      )}

      <Tabs
        current={status}
        items={[
          { value: "ALL", label: "All", href: href({ status: "ALL" }) },
          { value: "ACTIVE", label: "Active", href: href({ status: "ACTIVE" }) },
          { value: "DRAFT", label: "Drafts", href: href({ status: "DRAFT" }) },
          { value: "ARCHIVED", label: "Archived", href: href({ status: "ARCHIVED" }) },
        ]}
      />
      <FilterBar>
        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
        <SearchInput defaultValue={sp.q} placeholder="Search name, slug or SKU" />
        <AutoSubmitSelect name="category" label="Category" defaultValue={sp.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.depth ? `  ↳ ${c.name}` : c.name}</option>)}
        </AutoSubmitSelect>
        <AutoSubmitSelect name="stock" label="Stock" defaultValue={sp.stock ?? ""}>
          <option value="">Any stock</option>
          <option value="low">Low stock (≤ 2)</option>
        </AutoSubmitSelect>
      </FilterBar>

      {products.length === 0 ? (
        <EmptyState title="No products here">
          {sp.q || sp.category || sp.stock ? "Try clearing the filters." : <>Add your first product and it will show in the store once it&apos;s Active.</>}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Availability</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Price from</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-surface/60">
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-surface">
                      {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium group-hover:underline">{p.name}</span>
                      <span className="block text-xs text-muted">{p.variantCount} variant{p.variantCount === 1 ? "" : "s"}{p.isUnique ? " · one of a kind" : ""}</span>
                    </span>
                  </Link>
                </Td>
                <Td className="text-muted">{p.category}</Td>
                <Td><ProductStatusPill status={p.status} /></Td>
                <Td>
                  <Pill tone={p.availability === "READY_STOCK" ? "good" : p.availability === "MADE_TO_ORDER" ? "warn" : "muted"}>{AVAIL[p.availability]}</Pill>
                </Td>
                <Td className={`text-right tabular-nums ${p.availability === "READY_STOCK" && p.stock <= 2 ? "font-medium text-danger" : ""}`}>
                  {p.availability === "MADE_TO_ORDER" ? "—" : p.stock}
                </Td>
                <Td className="text-right tabular-nums">{formatINR(p.priceFrom)}</Td>
                <Td className="whitespace-nowrap text-muted">{dateOnly(p.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
