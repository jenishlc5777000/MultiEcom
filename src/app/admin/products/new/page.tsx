import { ProductForm } from "@/components/admin/product-form";
import { resolveCategoryForms } from "@/lib/category-fields";
import { PageHeader } from "@/components/admin/ui";
import { listCategoriesAdmin, listGlazesAndSizes } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, { glazes, sizes }] = await Promise.all([listCategoriesAdmin(), listGlazesAndSizes()]);
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Save as Draft to keep it hidden, or Active to publish it to the store immediately." />
      <ProductForm
        initial={null}
        categories={categories.map((c) => ({ id: c.id, name: c.label }))}
        categoryForms={resolveCategoryForms(categories)}
        glazes={glazes.map((g) => ({ id: g.id, name: g.name, hex: g.hex }))}
        sizes={sizes.map((s) => ({ id: s.id, name: s.label }))}
      />
    </>
  );
}
