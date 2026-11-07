import { CategoryManager, GlazeManager, SizeManager } from "@/components/admin/catalog-managers";
import { PageHeader } from "@/components/admin/ui";
import { listCategoriesAdmin, listGlazesAndSizes } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "Categories" };

export default async function CategoriesAdminPage() {
  const [categories, { glazes, sizes }] = await Promise.all([listCategoriesAdmin(), listGlazesAndSizes()]);
  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise the shop as Category → Subcategory → Products. They drive the shop menu and category pages. Glazes and sizes are the options customers choose between on a product."
      />
      <section className="rounded-lg border border-line bg-paper/60">
        <CategoryManager categories={categories} glazes={glazes.map((g) => ({ id: g.id, name: g.name }))} sizes={sizes.map((z) => ({ id: z.id, name: z.label }))} />
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section id="glazes" className="scroll-mt-24 rounded-lg border border-line bg-paper/60">
          <GlazeManager glazes={glazes} />
        </section>
        <section id="sizes" className="scroll-mt-24 rounded-lg border border-line bg-paper/60">
          <SizeManager sizes={sizes} />
        </section>
      </div>
    </>
  );
}
