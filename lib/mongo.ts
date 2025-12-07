import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error("Missing MONGODB_URI in environment");
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In dev, use a global to avoid creating many clients with hot reload
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, just create one client per process
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
