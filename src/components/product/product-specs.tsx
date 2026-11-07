import { formatAttribute } from "@/lib/category-fields";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/models";
import { getCategoryForm } from "@/services/admin/catalog-admin.service";

/**
 * Specifications from the product's category fields (Admin → Categories →
 * product fields). Renders nothing when there are none to show.
 */
export async function ProductSpecs({ slug, title = "Specifications", className }: { slug: string; title?: string; className?: string }) {
  await connectDB();
  const p = await Product.findOne({ slug, status: "ACTIVE" }).select("category attributes").lean<{ category: unknown; attributes?: Record<string, string> }>();
  if (!p?.attributes || !Object.keys(p.attributes).length) return null;
  const { fields } = await getCategoryForm(String(p.category));
  const rows = fields.filter((f) => f.showOnProduct && p.attributes?.[f.key]).map((f) => ({ label: f.label, value: formatAttribute(f, p.attributes![f.key]!), color: f.type === "color" ? p.attributes![f.key] : undefined }));
  if (!rows.length) return null;
  return (
    <section className={className} aria-labelledby="specs-title">
      <h2 id="specs-title" className="mb-3 font-sans text-base font-semibold">{title}</h2>
      <dl className="divide-y divide-line border-y border-line text-sm">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5">
            <dt className="text-muted">{r.label}</dt>
            <dd className="flex items-center gap-2 text-ink">
              {r.color && <span className="size-4 rounded-full border border-ink/15" style={{ backgroundColor: r.color }} aria-hidden />}
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
