import { z } from "zod";

/**
 * Every short storefront text that isn't edited elsewhere in Studio (buttons,
 * menu items, small headings, filter names…). The owner changes any of them in
 * Admin → Studio → Text & labels; anything left empty uses the default here.
 *
 * Headings support *asterisks* for the highlighted word, like other Studio titles.
 */
export const LABEL_GROUPS = {
  nav: "Header & menus",
  home: "Home page",
  product: "Product page",
  list: "Lists, filters & sorting",
  cart: "Cart & checkout",
  footer: "Footer",
  trust: "Trust strip (shipping, returns…)",
} as const;
export type LabelGroup = keyof typeof LABEL_GROUPS;

type Def = { g: LabelGroup; d: string; hint?: string };
const L = <K extends string>(t: Record<K, Def>) => t;

export const LABELS = L({
  // Header & menus
  "nav.shop": { g: "nav", d: "Shop", hint: "Menu button that opens the categories (non-search headers)" },
  "nav.tagline": { g: "nav", d: "Handmade in small batches", hint: "Small line in the top bar of some header designs" },
  "nav.shipping": { g: "nav", d: "Shipping" },
  "nav.returns": { g: "nav", d: "Returns" },
  "nav.contact": { g: "nav", d: "Contact" },
  "nav.orders": { g: "nav", d: "Your orders" },
  "nav.search": { g: "nav", d: "Search" },
  "nav.category": { g: "nav", d: "Category", hint: "Category picker next to the header search box" },
  "nav.allCategories": { g: "nav", d: "All categories" },
  "nav.mobileShop": { g: "nav", d: "Shop", hint: "Heading of the phone menu" },
  // Home page
  "home.shopByCategory": { g: "home", d: "Shop by category" },
  "home.allCategories": { g: "home", d: "All categories" },
  "home.allProducts": { g: "home", d: "All products" },
  "home.newest": { g: "home", d: "Newest" },
  "home.readyToShip": { g: "home", d: "Ready to ship" },
  "home.readyEyebrow": { g: "home", d: "Ships in 2 days" },
  "home.empty": { g: "home", d: "Nothing here yet. Check back soon." },
  "home.viewAll": { g: "home", d: "View all" },
  "home.lookbookTitle": { g: "home", d: "The Lookbook", hint: "Lookbook home page" },
  "home.lookbookCover": { g: "home", d: "Cover", hint: "Lookbook home page" },
  "home.lookbookAlso": { g: "home", d: "Also in this issue", hint: "Lookbook home page" },
  "home.lookbookNew": { g: "home", d: "New from the *studio*", hint: "Lookbook home page" },
  "home.bentoNewEyebrow": { g: "home", d: "New from the studio", hint: "Bento home page" },
  "home.bentoNewTitle": { g: "home", d: "Fresh out of the *kiln*", hint: "Bento home page" },
  "home.spotlightBadge": { g: "home", d: "Piece of the week", hint: "Spotlight home page" },
  "home.spotlightText": { g: "home", d: "Made by hand, so every one is slightly different. Choose your glaze and size on the next page.", hint: "Spotlight home page" },
  "home.availableIn": { g: "home", d: "Available in" },
  "home.chooseBuy": { g: "home", d: "Choose & buy" },
  "home.shopEverything": { g: "home", d: "Shop everything" },
  "home.restEyebrow": { g: "home", d: "The rest of the range" },
  "home.restTitle": { g: "home", d: "More *pieces*" },
  "home.browseEyebrow": { g: "home", d: "Browse" },
  "home.browseTitle": { g: "home", d: "By category" },
  "home.newBadge": { g: "home", d: "New", hint: "Round sticker on the framed hero (top line)" },
  "home.newBadgeBottom": { g: "home", d: "drop", hint: "Round sticker on the framed hero (big word)" },
  "home.searchShop": { g: "home", d: "Search the shop" },
  "home.dealsEyebrow": { g: "home", d: "Today's picks", hint: "Marketplace home page" },
  "home.dealsTitle": { g: "home", d: "Deals you'll *love*", hint: "Marketplace home page" },
  "home.bestTitle": { g: "home", d: "Most loved", hint: "Marketplace home page" },
  "home.magazineIssue": { g: "home", d: "This season", hint: "Magazine home page" },
  "home.magazineRead": { g: "home", d: "Read the story", hint: "Magazine home page" },
  "home.magazineEditors": { g: "home", d: "Editor's *picks*", hint: "Magazine home page" },
  "home.zigzagEyebrow": { g: "home", d: "The collection", hint: "Showcase home page" },
  "home.zigzagCta": { g: "home", d: "Discover", hint: "Showcase home page" },
  "home.galleryTitle": { g: "home", d: "The *gallery*", hint: "Gallery home page" },
  "home.galleryHint": { g: "home", d: "Tap a piece to see it up close.", hint: "Gallery home page" },
  // Product page
  "product.addToCart": { g: "product", d: "Add to Cart" },
  "product.buyNow": { g: "product", d: "Buy Now" },
  "product.chooseOptions": { g: "product", d: "Choose options" },
  "product.outOfStock": { g: "product", d: "Out of stock" },
  "product.sold": { g: "product", d: "Sold" },
  "product.quantity": { g: "product", d: "Quantity" },
  "product.glaze": { g: "product", d: "Glaze", hint: "Used when the category has no own name for this option" },
  "product.size": { g: "product", d: "Size", hint: "Used when the category has no own name for this option" },
  // Lists, filters & sorting
  "list.filterCategory": { g: "list", d: "Category" },
  "list.availability": { g: "list", d: "Availability" },
  "list.any": { g: "list", d: "Any" },
  "list.readyToShip": { g: "list", d: "Ready to ship" },
  "list.madeToOrder": { g: "list", d: "Made to order" },
  "list.price": { g: "list", d: "Price" },
  "list.min": { g: "list", d: "Min" },
  "list.max": { g: "list", d: "Max" },
  "list.sortBy": { g: "list", d: "Sort by" },
  "list.apply": { g: "list", d: "Apply" },
  "list.sortBest": { g: "list", d: "Best match" },
  "list.sortNew": { g: "list", d: "Newest" },
  "list.sortPriceAsc": { g: "list", d: "Price: low to high" },
  "list.sortPriceDesc": { g: "list", d: "Price: high to low" },
  "list.sortRated": { g: "list", d: "Top rated" },
  // Cart & checkout
  "cart.unavailable": { g: "cart", d: "No longer available. Please remove it." },
  // Footer
  "footer.colShop": { g: "footer", d: "Shop" },
  "footer.colStore": { g: "footer", d: "Studio", hint: "Column with About, Contact, Offers, Blog…" },
  "footer.colHelp": { g: "footer", d: "Help" },
  "footer.favourites": { g: "footer", d: "Favourites" },
  "footer.orders": { g: "footer", d: "Your orders" },
  "footer.cart": { g: "footer", d: "Cart" },
  "footer.contact": { g: "footer", d: "Contact" },
  "footer.instagram": { g: "footer", d: "Instagram" },
  // Trust strip
  "trust.packed": { g: "trust", d: "Packed with care" },
  "trust.returnsBody": { g: "trust", d: "Something not right? Request a return within {days} days of delivery.", hint: "{days} = your return window" },
  "trust.secureBody": { g: "trust", d: "Pay by UPI, card or netbanking through Razorpay." },
  "trust.returns": { g: "trust", d: "Easy returns" },
  "trust.secure": { g: "trust", d: "Secure checkout" },
  "trust.freeShipping": { g: "trust", d: "Free shipping" },
  "trust.freeShippingAll": { g: "trust", d: "Free shipping on every order" },
});
export type LabelKey = keyof typeof LABELS;
export const LABEL_KEYS = Object.keys(LABELS) as LabelKey[];

/** Stored overrides: only known keys, trimmed, empty = default. */
export const labelsSchema = z
  .record(z.string().max(300))
  .default({})
  .transform((r) => Object.fromEntries(Object.entries(r).filter(([k, v]) => k in LABELS && v.trim()).map(([k, v]) => [k, v.trim()])) as Partial<Record<LabelKey, string>>);
export type Labels = z.infer<typeof labelsSchema>;

/** `t("product.addToCart")` → the owner's text or the default. */
export function makeT(over: Labels | undefined) {
  return (k: LabelKey) => over?.[k] || LABELS[k].d;
}
export type T = ReturnType<typeof makeT>;
