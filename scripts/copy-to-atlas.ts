/**
 * Copy the store from the local database to the production database (Atlas).
 *   npm run copy:atlas                      (catalogue + settings)
 *   npm run copy:atlas -- --catalogue-only  (keep the live settings)
 * Source: MONGODB_URI in .env. Target: MONGODB_URI in .env.deploy.local.
 *
 * Copies the catalogue (categories, products, glazes, sizes, collections,
 * homepage banners) and the store settings incl. Studio design, sections and
 * theme. Not copied: orders, payments, users, reviews, sessions, saved
 * integration credentials and unpublished drafts. Documents keep their ids,
 * so products stay linked to categories. Safe to re-run (upserts by _id).
 * Also creates the indexes the app needs (production doesn't auto-create them).
 */
import fs from "node:fs";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";

function readEnvFile(file: string, key: string) {
  if (!fs.existsSync(file)) return undefined;
  const line = fs.readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") || undefined;
}

const COLLECTIONS = ["categories", "products", "glazes", "sizes", "collections", "homepagebanners"];

async function main() {
  const source = readEnvFile(".env", "MONGODB_URI");
  const target = readEnvFile(".env.deploy.local", "MONGODB_URI");
  if (!source) throw new Error("MONGODB_URI missing in .env");
  if (!target) throw new Error("MONGODB_URI missing in .env.deploy.local (paste your Atlas connection string there)");
  if (target === source) throw new Error("Source and target are the same database.");
  if (/127\.0\.0\.1|localhost/.test(target)) throw new Error("The target looks like a local database. Use your Atlas connection string.");

  const from = await MongoClient.connect(source);
  const to = await MongoClient.connect(target);
  const src = from.db();
  const dst = to.db();
  console.log(`Copying from local "${src.databaseName}" to "${dst.databaseName}" on ${new URL(target.replace(/^mongodb(\+srv)?:/, "http:")).hostname}`);

  for (const name of COLLECTIONS) {
    const docs = await src.collection(name).find().toArray();
    if (docs.length) await dst.collection(name).bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })));
    console.log(`  ${name.padEnd(16)} ${docs.length}`);
  }

  // Store settings (theme, Studio, shipping…), without credentials or drafts.
  // --catalogue-only keeps the live settings (e.g. a theme picked in the live admin).
  const catalogueOnly = process.argv.includes("--catalogue-only");
  const settings = catalogueOnly ? null : await src.collection("settings").findOne({ key: "store" });
  if (catalogueOnly) console.log("  settings         kept as they are on the live site");
  if (settings) {
    const { integrations: _i, siteDraft: _d, ...rest } = settings;
    await dst.collection("settings").replaceOne({ key: "store" }, rest, { upsert: true });
    console.log(`  settings         theme "${rest.theme ?? "stone"}"`);
  }
  await from.close();
  await to.close();

  // Indexes (unique slugs, text search…): defined on the Mongoose models.
  await mongoose.connect(target);
  const models = await import("../src/models");
  for (const m of Object.values(models)) {
    if (m && typeof m === "function" && "syncIndexes" in m) await (m as unknown as mongoose.Model<unknown>).syncIndexes();
  }
  await mongoose.disconnect();
  console.log("Indexes created. Done.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
