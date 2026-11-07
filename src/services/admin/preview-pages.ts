import "server-only";
import { connectDB } from "@/lib/db/connect";
import { Category, Product } from "@/models";

/** Pages the preview pane can show, with the most relevant one first. */
export async function previewPages(first: "/" | "/contact" | "/search" | "category" = "/") {
  await connectDB();
  const [cat, product] = await Promise.all([
    Category.findOne({ isActive: true, parent: null }).sort({ sortOrder: 1 }).select("name slug").lean(),
    Product.findOne({ status: "ACTIVE" }).sort({ createdAt: -1 }).select("name slug").lean(),
  ]);
  const pages = [
    { label: "Home page", path: "/" },
    { label: "All categories", path: "/category" },
    ...(cat ? [{ label: `Category: ${cat.name}`, path: `/category/${cat.slug}` }] : []),
    ...(product ? [{ label: `Product: ${product.name}`, path: `/products/${product.slug}` }] : []),
    { label: "Contact page", path: "/contact" },
    { label: "Search results", path: "/search?q=mug" },
    { label: "Search", path: "/search" },
  ];
  const lead = first === "category" ? pages.find((p) => p.path.startsWith("/category/")) : pages.find((p) => p.path === first);
  return lead ? [lead, ...pages.filter((p) => p !== lead)] : pages;
}
