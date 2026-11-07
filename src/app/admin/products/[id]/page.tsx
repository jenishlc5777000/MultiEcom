import { notFound } from "next/navigation";
import { ProductDangerZone } from "@/components/admin/product-danger-zone";
import { ProductForm } from "@/components/admin/product-form";
import { resolveCategoryForms } from "@/lib/category-fields";
import { PageHeader, ProductStatusPill } from "@/components/admin/ui";
import { getProductForEdit, listCategoriesAdmin, listGlazesAndSizes } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories, { glazes, sizes }] = await Promise.all([getProductForEdit(id), listCategoriesAdmin(), listGlazesAndSizes()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={product.name} actions={<ProductStatusPill status={product.status} />} />
      {created && (
        <p role="status" className="mb-6 rounded-lg border border-ready/30 bg-ready/10 px-4 py-3 text-sm text-ready">
          Product created.{" "}
          {product.status === "ACTIVE" ? "It's live in the store now." : "It's a draft. Set the status to Active to publish it."}
        </p>
      )}
      <ProductForm
        key={id}
        initial={product}
        categories={categories.map((c) => ({ id: c.id, name: c.label }))}
        categoryForms={resolveCategoryForms(categories)}
        glazes={glazes.map((g) => ({ id: g.id, name: g.name, hex: g.hex }))}
        sizes={sizes.map((s) => ({ id: s.id, name: s.label }))}
      />
      <div className="-mt-20 pb-28">
        <ProductDangerZone id={id} name={product.name} />
      </div>
    </>
  );
}
