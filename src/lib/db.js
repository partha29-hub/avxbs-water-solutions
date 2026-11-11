import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  const MONGO_URI = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  if (!MONGO_URI) {
    throw new Error(
      "Please define the MONGO_URI environment variable inside your .env or .env.local file"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;

  return cached.conn;
}

export default connectDB;
