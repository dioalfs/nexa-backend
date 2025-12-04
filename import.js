const { MongoClient } = require('mongodb');
const fs = require('fs');

// 👇 GUNAKAN CONNECTION STRING YANG SAMA 👇
const uri = "mongodb+srv://dioikacg_db_user:4xZiyRmPmANmneGB@cluster0.trxbszg.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);
const jsonFilePath = 'nexa.json';

async function importData() {
  try {
    console.log("Menghubungkan ke Cloud...");
    await client.connect();
    console.log("✅ Terhubung!");
    
    const db = client.db("nexa_db");
    const collection = db.collection("laptops");

    // 1. Baca file JSON lokal
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    const laptops = JSON.parse(data);

    // 2. Hapus data lama di cloud (biar bersih)
    await collection.deleteMany({});
    console.log("🗑️  Data lama di cloud dihapus.");

    // 3. Upload data baru
    const result = await collection.insertMany(laptops);
    console.log(`🎉 Berhasil mengupload ${result.insertedCount} laptop ke MongoDB Atlas!`);

  } catch (error) {
    console.error("❌ Gagal impor:", error);
  } finally {
    await client.close();
  }
}

importData();