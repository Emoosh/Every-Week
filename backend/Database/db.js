import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

const uri = process.env.MONGODB_KEY;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db; 

export async function connectDB() {
  try {
    if (!db) { 
      await client.connect();
      db = client.db("Every-Week");
      console.log("✅ Connected to MongoDB!");
    }
    return db;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

/**
 * Kullanıcı kaydı oluşturur (signup)
 */
export async function signup(e_mail, password) {
  try {
    const database = await connectDB();  

    const newUser = {
      e_mail,
      password,
      createdAt: new Date(),
      lastLogin: null
    };

    const result = await database.collection("users").insertOne(newUser);
    console.log("✅ User created with ID:", result.insertedId);
  } catch (error) {
    console.error("❌ Signup error:", error);
  }
}

/**
 * Kullanıcı giriş yapar (login)
 */
export async function login(e_mail, password) {
  try {
    const database = await connectDB();

    const user = await database.collection("users").findOne({ e_mail, password });

    if (!user) {
      console.log("❌ Invalid email or password!");
      return null;
    }

    await database.collection("users").updateOne(
      { e_mail },
      { $set: { lastLogin: new Date() } }
    );

    console.log("✅ Login succeeded:", user.e_mail);
    return user;
  } catch (error) {
    console.error("❌ Login error:", error);
    return null;
  }
}

//Emojiler aşşşırı komik
process.on("SIGINT", async () => {
  console.log("🔌 Closing MongoDB connection...");
  await client.close();
  process.exit(0);
});
