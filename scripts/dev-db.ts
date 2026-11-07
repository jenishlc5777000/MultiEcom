/**
 * Local single-node MongoDB replica set for development (transactions need a
 * replica set). Data persists in ./.data/mongo between runs.
 *   npm run db
 * Use MONGODB_URI=mongodb://127.0.0.1:27017/clay-and-glaze?replicaSet=rs0&directConnection=true
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const PORT = 27017;
const dbPath = path.resolve(".data/mongo");

async function main() {
  mkdirSync(dbPath, { recursive: true });
  const replSet = await MongoMemoryReplSet.create({
    binary: { version: "7.0.14" },
    replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, dbPath }],
  });
  console.log(`MongoDB replica set ready: ${replSet.getUri("clay-and-glaze")}`);

  const stop = async () => {
    await replSet.stop({ doCleanup: false }); // keep data on disk
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
