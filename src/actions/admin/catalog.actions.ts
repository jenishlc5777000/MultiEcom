"use server";

import { z } from "zod";
import { storeImage } from "@/lib/uploads";
import { objectId } from "@/lib/validations";
import { categoryInput, glazeInput, patternInput, productInput, sizeInput } from "@/lib/validations/admin";
import type { Image } from "@/models";
import {
  createProduct,
  deleteCategory,
  deleteGlaze,
  deleteProduct,
  deletePattern,
  deleteSize,
  saveCategory,
  saveGlaze,
  savePattern,
  saveSize,
  setProductStatus,
  updateProduct,
} from "@/services/admin/catalog-admin.service";
import type { ActionResult } from "@/types/dto";
import { ownerAction, UserFacingError } from "./_helpers";

// Storefront paths that show catalogue data: they must refresh after any edit.
const STOREFRONT = ["/", "/category", "/search"];
// Product forms receive their category options from the server on page load.
const PRODUCT_FORMS = ["/admin/products", "/admin/products/new", "/admin/products/[id]"];
const optionalId = z.union([objectId, z.null()]);

/* Products */

export async function saveProductAction(id: string | null, raw: unknown) {
  return ownerAction(
    z.object({ id: optionalId, input: productInput }),
    { id, input: raw },
    async ({ id, input }) => {
      if (id) {
        await updateProduct(id, input);
        return { id };
      }
      return { id: await createProduct(input) };
    },
    ["/admin/products", "/admin", ...STOREFRONT],
  );
}

export async function setProductStatusAction(id: string, status: unknown) {
  return ownerAction(
    z.object({ id: objectId, status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }),
    { id, status },
    ({ id, status }) => setProductStatus(id, status),
    ["/admin/products", ...STOREFRONT],
  );
}

export async function deleteProductAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deleteProduct(id), ["/admin/products", ...STOREFRONT]);
}

/** Upload one image file; returns the stored image (Cloudinary, or /public/uploads in dev). */
export async function uploadImageAction(formData: FormData): Promise<ActionResult<Image>> {
  const file = formData.get("file");
  const folder = formData.get("folder");
  const path = formData.get("path");
  return ownerAction(
    z.object({
      folder: z.enum(["products", "categories", "banners", "brand", "blog"]),
      // Sub-folders, e.g. "mugs/tapered" (lowercase letters, numbers and dashes).
      path: z.string().max(200).regex(/^[a-z0-9/-]*$/).default(""),
    }),
    { folder, path: typeof path === "string" ? path : "" },
    async ({ folder, path }) => {
      if (!(file instanceof File) || file.size === 0) throw new UserFacingError("Choose an image to upload.");
      return storeImage(file, folder, path.split("/").filter(Boolean));
    },
  );
}

/* Categories, glazes, sizes */

export async function saveCategoryAction(id: string | null, raw: unknown) {
  return ownerAction(z.object({ id: optionalId, input: categoryInput }), { id, input: raw }, ({ id, input }) => saveCategory(id, input), [
    "/admin/categories",
    ...PRODUCT_FORMS,
    ...STOREFRONT,
  ]);
}

export async function deleteCategoryAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deleteCategory(id), ["/admin/categories", ...PRODUCT_FORMS, ...STOREFRONT]);
}

export async function saveGlazeAction(id: string | null, raw: unknown) {
  return ownerAction(z.object({ id: optionalId, input: glazeInput }), { id, input: raw }, ({ id, input }) => saveGlaze(id, input), ["/admin/categories", ...STOREFRONT]);
}

export async function deleteGlazeAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deleteGlaze(id), ["/admin/categories"]);
}

export async function saveSizeAction(id: string | null, raw: unknown) {
  return ownerAction(z.object({ id: optionalId, input: sizeInput }), { id, input: raw }, ({ id, input }) => saveSize(id, input), ["/admin/categories", ...STOREFRONT]);
}

export async function savePatternAction(id: string | null, raw: unknown) {
  return ownerAction(z.object({ id: optionalId, input: patternInput }), { id, input: raw }, ({ id, input }) => savePattern(id, input), ["/admin/categories", ...PRODUCT_FORMS, ...STOREFRONT]);
}

export async function deletePatternAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deletePattern(id), ["/admin/categories", ...PRODUCT_FORMS]);
}

export async function deleteSizeAction(id: string) {
  return ownerAction(z.object({ id: objectId }), { id }, ({ id }) => deleteSize(id), ["/admin/categories"]);
}
