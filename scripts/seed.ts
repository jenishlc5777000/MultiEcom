/**
 * Seed demo data: settings, categories, glazes, sizes, sample products, a
 * homepage banner and the dev demo accounts.
 *   npm run seed                         # seed catalogue
 *   npm run seed -- --owner you@mail.com # also make that user an owner
 * Safe to re-run: everything is upserted by slug / key.
 * Images are local placeholders from public/demo (see scripts/make-demo-images.mjs).
 */
import mongoose from "mongoose";
import { Category, Glaze, HomepageBanner, Product, Setting, Size, User } from "../src/models";

const img = (file: string, alt: string) => ({ url: `/demo/${file}`, publicId: `demo/${file}`, alt });

async function upsert<T>(model: mongoose.Model<T>, filter: object, doc: object) {
  return model.findOneAndUpdate(filter, { $set: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (add it to .env)");
  await mongoose.connect(uri);
  await Promise.all([Category, Glaze, Size, Product, Setting, User, HomepageBanner].map((m) => m.syncIndexes()));

  await upsert(Setting, { key: "store" }, { shippingFlatFee: 9900, freeShippingThreshold: 199900, returnWindowDays: 7 });

  // Category tree: two top-level categories, each with subcategories.
  // Existing slugs (mugs, bowls, planters, craft-kits) are kept, so their products stay linked.
  const [ceramics, artCraft] = await Promise.all([
    upsert(Category, { slug: "ceramics" }, {
      name: "Ceramics", parent: null, sortOrder: 1, isActive: true, image: img("cat-ceramics.svg", "Ceramics"),
      description: "Wheel-thrown and hand-built stoneware for the table and home.",
    }),
    upsert(Category, { slug: "art-and-craft" }, {
      name: "Art & Craft", parent: null, sortOrder: 2, isActive: true, image: img("cat-art-craft.svg", "Art and craft"),
      description: "Kits, tools, paints and wall art to make something of your own.",
    }),
  ]);
  const sub = (slug: string, name: string, parent: { _id: unknown }, sortOrder: number, file: string, description: string) =>
    upsert(Category, { slug }, { name, parent: parent._id, sortOrder, isActive: true, image: img(file, name), description });

  const [mugs, bowls, plates, planters, vases] = await Promise.all([
    sub("mugs", "Mugs", ceramics!, 1, "cat-mugs.svg", "Mugs and cups for coffee, chai and everything in between."),
    sub("bowls", "Bowls", ceramics!, 2, "cat-bowls.svg", "Everyday bowls and one-of-a-kind serving pieces."),
    sub("plates", "Plates", ceramics!, 3, "cat-plates.svg", "Dinner plates, side plates and platters."),
    sub("planters", "Planters", ceramics!, 4, "cat-planters.svg", "Planters with drainage for indoor plants."),
    sub("vases", "Vases", ceramics!, 5, "cat-vases.svg", "Bud vases and statement vases."),
  ]);
  // Sub-subcategories (patterns) for Mugs and Planters: customers pick one first, and
  // products live in these. They never appear in the header menu.
  await Promise.all([mugs, planters].map((c) => Category.updateOne({ _id: c!._id }, { $set: { productsInChildrenOnly: true } })));
  const [mugsTapered, mugsRound, mugsClassic, plantersTapered, plantersRound, plantersClassic] = await Promise.all([
    sub("mugs-tapered", "Tapered", mugs!, 1, "mug-celadon.svg", "Mugs that narrow towards the base."),
    sub("mugs-round", "Round", mugs!, 2, "mug-oat.svg", "Soft, rounded mugs and cups."),
    sub("mugs-classic", "Classic", mugs!, 3, "cat-mugs.svg", "Straight-sided everyday mugs."),
    sub("planters-tapered", "Tapered", planters!, 1, "cat-planters.svg", "Planters that narrow towards the base."),
    sub("planters-round", "Round", planters!, 2, "cat-planters.svg", "Rounded, bowl-like planters."),
    sub("planters-classic", "Classic", planters!, 3, "cat-planters.svg", "Straight-sided classic planters."),
  ]);
  void [plantersRound, plantersClassic, mugsTapered];

  const [kits, tools, paints, wallArt] = await Promise.all([
    sub("craft-kits", "Craft Kits", artCraft!, 1, "cat-kits.svg", "Everything you need to make pottery at home."),
    sub("pottery-tools", "Pottery Tools", artCraft!, 2, "cat-tools.svg", "Shaping, trimming and carving tools."),
    sub("glazes-and-paints", "Glazes & Paints", artCraft!, 3, "cat-paints.svg", "Underglazes and paints for clay and ceramics."),
    sub("wall-art", "Wall Art", artCraft!, 4, "cat-wall-art.svg", "Ceramic tiles and hangings for your walls."),
  ]);

  const [celadon, oat, cobalt, rust] = await Promise.all([
    upsert(Glaze, { slug: "celadon" }, { name: "Celadon", hex: "#9DBFA9", finish: "glossy" }),
    upsert(Glaze, { slug: "speckled-oat" }, { name: "Speckled Oat", hex: "#E6D9C2", finish: "matte" }),
    upsert(Glaze, { slug: "cobalt" }, { name: "Cobalt", hex: "#2F4F6F", finish: "glossy" }),
    upsert(Glaze, { slug: "rust" }, { name: "Rust", hex: "#B4532A", finish: "satin" }),
  ]);
  const [small, large] = await Promise.all([
    upsert(Size, { slug: "250ml" }, { label: "250 ml", sortOrder: 1 }),
    upsert(Size, { slug: "400ml" }, { label: "400 ml", sortOrder: 2 }),
  ]);

  const products = [
    {
      slug: "everyday-mug",
      type: "CERAMIC",
      name: "Everyday Mug",
      availability: "READY_STOCK",
      category: mugsClassic!._id,
      images: [img("mug-celadon.svg", "Everyday Mug in celadon"), img("mug-celadon-side.svg", "Everyday Mug, side view")],
      description: "Wheel-thrown stoneware mug with a generous handle.",
      capacity: "250 / 400 ml",
      dimensions: "9 cm × 8 cm",
      care: "Dishwasher and microwave safe. Avoid sudden temperature changes.",
      variants: [
        { glaze: celadon!._id, size: small!._id, sku: "MUG-CEL-250", price: 89900, stock: 6, images: { main: img("mug-celadon.svg", "Celadon mug") } },
        { glaze: celadon!._id, size: large!._id, sku: "MUG-CEL-400", price: 109900, stock: 3, images: { main: img("mug-celadon-large.svg", "Large celadon mug") } },
        { glaze: oat!._id, size: small!._id, sku: "MUG-OAT-250", price: 89900, stock: 0, images: { main: img("mug-oat.svg", "Speckled oat mug") } },
        { glaze: rust!._id, size: small!._id, sku: "MUG-RUST-250", price: 89900, stock: 4, images: { main: img("cat-mugs.svg", "Rust mug") } },
      ],
    },
    {
      slug: "speckled-oat-cup",
      type: "CERAMIC",
      name: "Speckled Oat Cup",
      availability: "MADE_TO_ORDER",
      leadTimeDays: 21,
      category: mugsRound!._id,
      images: [img("mug-oat.svg", "Speckled Oat Cup")],
      description: "A handle-less cup in a matte, speckled glaze. Made for you after you order.",
      capacity: "250 ml",
      variants: [{ glaze: oat!._id, size: small!._id, sku: "CUP-OAT-250", price: 74900, compareAtPrice: 84900, stock: 0 }],
    },
    {
      slug: "monsoon-serving-bowl",
      type: "CERAMIC",
      name: "Monsoon Serving Bowl",
      availability: "READY_STOCK",
      isUnique: true,
      patternName: "Monsoon",
      category: bowls!._id,
      images: [img("bowl-monsoon.svg", "Monsoon Serving Bowl"), img("bowl-monsoon-top.svg", "Monsoon bowl from above")],
      description: "A one-of-a-kind serving bowl with hand-brushed rain lines.",
      dimensions: "24 cm wide",
      variants: [{ glaze: cobalt!._id, sku: "BOWL-MONSOON-001", price: 249900, stock: 1 }],
    },
    {
      slug: "breakfast-bowl",
      type: "CERAMIC",
      name: "Breakfast Bowl",
      availability: "READY_STOCK",
      category: bowls!._id,
      images: [img("cat-bowls.svg", "Breakfast Bowl")],
      description: "A deep everyday bowl for porridge, noodles and dal.",
      dimensions: "15 cm wide",
      variants: [
        { glaze: oat!._id, sku: "BOWL-OAT-15", price: 99900, stock: 8 },
        { glaze: celadon!._id, sku: "BOWL-CEL-15", price: 99900, stock: 5 },
      ],
    },
    {
      slug: "terracotta-planter",
      type: "CERAMIC",
      name: "Rust Planter",
      availability: "READY_STOCK",
      category: plantersTapered!._id,
      images: [img("cat-planters.svg", "Rust Planter")],
      description: "A tall planter with a drainage hole and saucer.",
      dimensions: "14 cm × 16 cm",
      variants: [{ glaze: rust!._id, sku: "PLANT-RUST-M", price: 149900, stock: 2 }],
    },
    {
      slug: "pinch-pot-kit",
      type: "CRAFT",
      name: "Pinch Pot Craft Kit",
      availability: "READY_STOCK",
      category: kits!._id,
      images: [img("cat-kits.svg", "Pinch Pot Craft Kit")],
      description: "Everything you need to make two small pinch pots at home. Air-dry clay, no kiln needed.",
      kitContents: ["1 kg air-dry clay", "Wooden shaping tool", "Sponge", "Two brushes", "Illustrated guide"],
      variants: [{ sku: "KIT-PINCH", price: 129900, stock: 10 }],
    },

    /* New subcategories */
    {
      slug: "celadon-dinner-plate",
      type: "CERAMIC",
      name: "Celadon Dinner Plate",
      availability: "READY_STOCK",
      category: plates!._id,
      images: [img("plate-celadon.svg", "Celadon Dinner Plate"), img("cat-plates.svg", "Plate in speckled oat")],
      description: "A wide, low-rimmed dinner plate with a soft celadon glaze.",
      dimensions: "27 cm wide",
      care: "Dishwasher and microwave safe.",
      variants: [
        { glaze: celadon!._id, sku: "PLATE-CEL-27", price: 119900, stock: 7, images: { main: img("plate-celadon.svg", "Celadon plate") } },
        { glaze: oat!._id, sku: "PLATE-OAT-27", price: 119900, stock: 4, images: { main: img("cat-plates.svg", "Speckled oat plate") } },
      ],
    },
    {
      slug: "speckled-bud-vase",
      type: "CERAMIC",
      name: "Speckled Bud Vase",
      availability: "READY_STOCK",
      category: vases!._id,
      images: [img("vase-oat.svg", "Speckled Bud Vase"), img("cat-vases.svg", "Bud vase in cobalt")],
      description: "A small vase for a single stem, in a matte speckled glaze.",
      dimensions: "18 cm tall",
      variants: [
        { glaze: oat!._id, sku: "VASE-OAT-S", price: 79900, stock: 5, images: { main: img("vase-oat.svg", "Speckled oat vase") } },
        { glaze: cobalt!._id, sku: "VASE-COB-S", price: 84900, stock: 3, images: { main: img("cat-vases.svg", "Cobalt vase") } },
      ],
    },
    {
      slug: "starter-pottery-tool-set",
      type: "CRAFT",
      name: "Starter Pottery Tool Set",
      availability: "READY_STOCK",
      category: tools!._id,
      images: [img("cat-tools.svg", "Starter Pottery Tool Set")],
      description: "Eight essential tools for throwing, trimming and carving, in a cotton roll.",
      kitContents: ["Wire cutter", "Wooden rib", "Metal scraper", "Needle tool", "Loop tool", "Sponge", "Two carving tools", "Cotton tool roll"],
      variants: [{ sku: "TOOLS-STARTER", price: 99900, stock: 12 }],
    },
    {
      slug: "underglaze-paint-set",
      type: "CRAFT",
      name: "Underglaze Paint Set",
      availability: "READY_STOCK",
      category: paints!._id,
      images: [img("cat-paints.svg", "Underglaze Paint Set")],
      description: "Four food-safe underglaze colours and a brush, for painting on bisque.",
      kitContents: ["4 × 30 ml underglaze (rust, sage, cobalt, ochre)", "Round brush", "Colour guide"],
      variants: [{ sku: "PAINT-UG-4", price: 89900, stock: 9 }],
    },
    {
      slug: "glazed-tile-wall-hanging",
      type: "CERAMIC",
      name: "Glazed Tile Wall Hanging",
      availability: "MADE_TO_ORDER",
      leadTimeDays: 14,
      category: wallArt!._id,
      images: [img("cat-wall-art.svg", "Glazed Tile Wall Hanging")],
      description: "Nine hand-glazed tiles set in a wooden frame, ready to hang.",
      dimensions: "45 cm × 45 cm",
      variants: [{ sku: "WALL-TILE-9", price: 349900, stock: 0 }],
    },
  ];

  for (const p of products) await upsert(Product, { slug: p.slug }, { status: "ACTIVE", ...p });

  await upsert(
    HomepageBanner,
    { title: "Made slowly, / for the *everyday* / table." },
    { ctaLabel: "Shop the collection", ctaHref: "/category", image: img("hero.svg", "Speckled stoneware mug on a dark table"), isActive: true, sortOrder: 0 },
  );

  // Demo accounts used by the dev-only demo login (mirrors src/lib/auth/demo-accounts.ts).
  for (const demo of [
    { email: "customer@demo.local", name: "Demo Customer", role: "customer" },
    { email: "owner@demo.local", name: "Demo Owner", role: "owner" },
  ]) {
    await User.updateOne(
      { email: demo.email },
      { $set: { role: demo.role }, $setOnInsert: { name: demo.name, emailVerified: new Date() } },
      { upsert: true },
    );
  }

  const ownerIdx = process.argv.indexOf("--owner");
  const ownerEmail = ownerIdx > -1 ? process.argv[ownerIdx + 1]?.toLowerCase() : undefined;
  if (ownerEmail) {
    await User.updateOne({ email: ownerEmail }, { $set: { role: "owner" }, $setOnInsert: { email: ownerEmail } }, { upsert: true });
    console.log(`Owner role set for ${ownerEmail} (sign out and in again to refresh the session).`);
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
