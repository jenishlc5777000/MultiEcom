import { notFound } from "next/navigation";
import { ProductDangerZone } from "@/components/admin/product-danger-zone";
import { ProductForm } from "@/components/admin/product-form";
import { resolveCategoryForms } from "@/lib/category-fields";
import { getSettingsForEdit } from "@/services/admin/settings-admin.service";
import { PageHeader, ProductStatusPill } from "@/components/admin/ui";
import { archiveDeleteDate, getProductForEdit, listCategoriesAdmin, listGlazesAndSizes, listPatternNames } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories, { glazes, sizes }, patternNames, settings] = await Promise.all([getProductForEdit(id), listCategoriesAdmin(), listGlazesAndSizes(), listPatternNames(), getSettingsForEdit()]);
  if (!product) notFound();
  const deletesOn = await archiveDeleteDate(id);

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={product.name} actions={<ProductStatusPill status={product.status} />} />
      {deletesOn && (
        <p role="status" className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Archived. This product, its photos, and its place in carts and favourites will be deleted automatically on{" "}
          <strong>{deletesOn.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>. Set it back to Active or Draft to keep it.
        </p>
      )}
      {created && (
        <p role="status" className="mb-6 rounded-lg border border-ready/30 bg-ready/10 px-4 py-3 text-sm text-ready">
          Product created.{" "}
          {product.status === "ACTIVE" ? "It's live in the store now." : "It's a draft. Set the status to Active to publish it."}
        </p>
      )}
      <ProductForm
        key={id}
        initial={product}
        categories={categories.map((c) => ({ id: c.id, name: c.name, label: c.label, parentId: c.parentId, isActive: c.isActive }))}
        patternNames={patternNames}
        categoryForms={resolveCategoryForms(categories)}
        glazes={glazes.map((g) => ({ id: g.id, name: g.name, hex: g.hex }))}
        sizes={sizes.map((s) => ({ id: s.id, name: s.label }))}
        storeDefaults={{ gstRate: settings.gstRate, shippingFee: settings.shippingFlatFee }}
      />
      <div className="-mt-20 pb-28">
        <ProductDangerZone id={id} name={product.name} />
      </div>
    </>
  );
}
