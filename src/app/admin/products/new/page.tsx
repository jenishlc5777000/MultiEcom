import { ProductForm } from "@/components/admin/product-form";
import { resolveCategoryForms } from "@/lib/category-fields";
import { getSettingsForEdit } from "@/services/admin/settings-admin.service";
import { PageHeader } from "@/components/admin/ui";
import { listCategoriesAdmin, listGlazesAndSizes, listPatternNames } from "@/services/admin/catalog-admin.service";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, { glazes, sizes }, patternNames, settings] = await Promise.all([listCategoriesAdmin(), listGlazesAndSizes(), listPatternNames(), getSettingsForEdit()]);
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Save as Draft to keep it hidden, or Active to publish it to the store immediately." />
      <ProductForm
        initial={null}
        categories={categories.map((c) => ({ id: c.id, name: c.name, label: c.label, parentId: c.parentId, isActive: c.isActive }))}
        patternNames={patternNames}
        categoryForms={resolveCategoryForms(categories)}
        glazes={glazes.map((g) => ({ id: g.id, name: g.name, hex: g.hex }))}
        sizes={sizes.map((s) => ({ id: s.id, name: s.label }))}
        storeDefaults={{ gstRate: settings.gstRate, shippingFee: settings.shippingFlatFee }}
      />
    </>
  );
}
