const { MongoClient } = require('mongodb');

// 👇 COPY LINK DARI FILE Server.js KAMU, LALU TEMPEL DI BAWAH INI 👇
const uri = "mongodb+srv://dioikacg_db_user:4xZiyRmPmANmneGB@cluster0.trxbszg.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);

async function createAdmin() {
    try {
        await client.connect();
        console.log("✅ Terhubung ke Cloud...");
        
        const db = client.db("laptofy_db");
        const users = db.collection("users");

        // Data Admin
        const newAdmin = {
            username: "admin",
            password: "admin123",
            role: "admin" // PENTING: Role harus admin
        };

        // Cek dulu biar tidak dobel
        const existingUser = await users.findOne({ username: "admin" });
        
        if (existingUser) {
            console.log("⚠️ User admin sudah ada. Menghapus yang lama...");
            await users.deleteOne({ username: "admin" });
        }

        await users.insertOne(newAdmin);
        console.log("🎉 SUKSES! Akun admin berhasil dibuat.");
        console.log("User: admin");
        console.log("Pass: admin123");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

createAdmin();