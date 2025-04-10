import { MongoClient } from "mongodb"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // Check if we have a cached connection
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Connect to MongoDB
  const client = await MongoClient.connect(MONGODB_URI as string)
  const db = client.db()

  // Cache the connection
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Mongoose connection
export async function connectToMongoose() {
  if (mongoose.connection.readyState >= 1) {
    return
  }

  return mongoose.connect(MONGODB_URI as string, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
}

// User model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user", "guest"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Only hash the password if it's modified (or new)
userSchema.pre("save", async function (next) {
  
  if (!this.isModified("password")) return next()

  try {
    // In a real app, use bcrypt here
    // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(user.password, salt);
    // For demo, we'll just add a simple prefix
    this.password = "hashed_" + this.password
    next()
  } catch (error: any) {
    next(error)
  }
})

// Export User model (create it if it doesn't exist)
export const User = mongoose.models.User || mongoose.model("User", userSchema)
