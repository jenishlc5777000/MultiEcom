export const siteConfig = {
  name: "Nibbea",
  shortName: "Nibbea",
  description: "Handmade ceramics and craft kits.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  currency: "INR" as const,
  themeColor: "#F6F4F0",
  backgroundColor: "#F6F4F0",
};

export const policyPages = [
  { slug: "shipping", label: "Shipping" },
  { slug: "returns", label: "Returns & refunds" },
  { slug: "privacy", label: "Privacy" },
  { slug: "terms", label: "Terms of sale" },
] as const;
export type PolicySlug = (typeof policyPages)[number]["slug"];

/** Header links shown next to the Shop mega-menu. */
export const mainNav = [
  { href: "/about", label: "About" },
  { href: "/policies/shipping", label: "Shipping & Returns" },
] as const;

export const mobileTabs = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/category", label: "Shop", icon: "grid" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/cart", label: "Cart", icon: "cart" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;
