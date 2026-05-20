import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const collections = {
  users: "usersBalaji",
  repairs: "repairJobs",
};

let client;
let actualDB;

export async function connectDB() {
  try {
    if (actualDB) return actualDB;

    client = new MongoClient(env.mongoUri);
    console.log("Connecting to MongoDB...");

    await client.connect();
    actualDB = client.db(env.dbName);

    await createIndexes();

    console.log(`MongoDB connected to database: ${env.dbName}`);
    return actualDB;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

async function createIndexes() {
  const usersCollection = actualDB.collection(collections.users);
  const repairsCollection = actualDB.collection(collections.repairs);

  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await repairsCollection.createIndex({ createdAt: -1 });
  await repairsCollection.createIndex({ repairStatus: 1, createdAt: -1 });
  await repairsCollection.createIndex({ paymentStatus: 1, createdAt: -1 });
  await repairsCollection.createIndex({ status: 1, createdAt: -1 });
  await repairsCollection.createIndex({ whatsapp: 1 });
  await repairsCollection.createIndex({ customerName: 1 });
  await repairsCollection.createIndex({ device: 1 });
  await repairsCollection.createIndex({ "extraFlags.urgent": 1 });
}

export function getDB() {
  if (!actualDB) {
    throw new Error("Database not connected. Please call connectDB() first.");
  }

  return actualDB;
}

export function getCollection(collectionName) {
  if (!collectionName) {
    throw new Error("Collection name is required.");
  }

  return getDB().collection(collectionName);
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = undefined;
    actualDB = undefined;
  }
}
