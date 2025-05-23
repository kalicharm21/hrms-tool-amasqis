import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/";

const client = new MongoClient(uri);
let isConnected = false;

export const connectDB = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log("Connected to MongoDB -> Done");
    } catch (error) {
      console.error("Database Connection Error ->", error);
      throw error;
    }
  }
};

export const getTenantCollections = (tenantDbName) => {
  if (!isConnected) {
    throw new Error(
      "MongoDB client not connected yet. Call connectDB() first."
    );
  }
  const db = client.db(tenantDbName);
  return {
    stats: db.collection("stats"),
    companies: db.collection("companies"),
  };
};

export const getsuperadminCollections = () => {
  if (!isConnected) {
    throw new Error(
      "MongoDB client not connected yet. Call connectDB() first."
    );
  }
  const db = client.db("AmasQIS");
  return {
    stats: db.collection("stats"),
    companies: db.collection("companies"),
    packagesCollection: db.collection("packages"),
  };
};
