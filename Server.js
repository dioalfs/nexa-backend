// Server.js

require("dotenv").config();  // ← BACA .env

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();

// PENTING: pakai PORT dari environment (hosting) atau 3000 kalau lokal
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 🗄️ KONFIGURASI MONGODB ---
// AMBIL DARI ENV VAR, BUKAN STRING LANGSUNG
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ ERROR: MONGODB_URI belum diset di environment variables!");
  process.exit(1);
}

// --- KONEKSI KE MONGODB & INISIALISASI KOLEKSI ---
let db;
let usersCollection;
let laptopsCollection;

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);

    // SESUAIKAN NAMA KOLEKSI DI MONGODB
    usersCollection = db.collection("users");
    laptopsCollection = db.collection("laptops");

    console.log("🌿 MongoDB Atlas terkoneksi!");
  } catch (err) {
    console.error("❌ Gagal konek MongoDB:", err.message);
    process.exit(1);
  }
}

connectDB();

// ===============================
// 1. ROOT (cek server hidup)
// ===============================
app.get("/", (req, res) => {
  res.send("Laptofy API berjalan 👍");
});

// ===============================
// 2. API LAPTOP (CRUD)
// ===============================

/**
 * GET /api/laptops
 * Ambil semua data laptop
 */
app.get("/api/laptops", async (req, res) => {
  try {
    const laptops = await laptopsCollection.find({}).toArray();

    const formatted = laptops.map((laptop) => {
      const {
        _id,
        name,
        brand,
        price,
        cpu,
        ram,
        storage,
        gpu,
        weight,
        battery,
        screen,
        fitur,
      } = laptop;

      return {
        id: _id.toString(),
        name,
        brand,
        price,
        cpu,
        ram,
        storage,
        gpu,
        weight,
        battery,
        screen,
        fitur: fitur || [],
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("GET /api/laptops error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/laptops
 * Tambah laptop baru (dipakai dari halaman admin)
 */
app.post("/api/laptops", async (req, res) => {
  try {
    const newLaptop = { ...req.body };

    // Validasi sederhana
    if (!newLaptop.name || !newLaptop.brand || newLaptop.price == null) {
      return res
        .status(400)
        .json({ message: "Nama, brand, dan harga wajib diisi." });
    }

    // Normalisasi tipe data angka
    if (newLaptop.price !== undefined) {
      newLaptop.price = parseInt(newLaptop.price, 10);
    }
    if (newLaptop.ram !== undefined) {
      newLaptop.ram = parseInt(newLaptop.ram, 10);
    }
    if (newLaptop.weight !== undefined) {
      newLaptop.weight = parseFloat(newLaptop.weight);
    }
    if (newLaptop.battery !== undefined) {
      newLaptop.battery = parseInt(newLaptop.battery, 10);
    }

    // Pastikan fitur array
    if (typeof newLaptop.fitur === "string") {
      newLaptop.fitur = newLaptop.fitur
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(newLaptop.fitur)) {
      newLaptop.fitur = [];
    }

    const result = await laptopsCollection.insertOne(newLaptop);

    res.json({
      success: true,
      message: "Laptop berhasil ditambahkan!",
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("POST /api/laptops error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/laptops/:id
 * Hapus laptop berdasarkan id MongoDB
 */
app.delete("/api/laptops/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await laptopsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: "Laptop berhasil dihapus!" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Laptop tidak ditemukan" });
    }
  } catch (error) {
    console.error("DELETE /api/laptops/:id error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// 3. API AUTH (REGISTER & LOGIN)
// ===============================

/**
 * POST /api/register
 * Daftar akun baru (role default: user)
 */
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi.",
      });
    }

    // Cek username sudah ada atau belum
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username sudah dipakai!" });
    }

    const newUser = {
      username,
      password, // plain text (cukup untuk tugas kuliah)
      role: "user",
    };

    await usersCollection.insertOne(newUser);

    res.json({
      success: true,
      message: "Registrasi berhasil! Silakan login.",
    });
  } catch (error) {
    console.error("POST /api/register error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/login
 * Cek username & password, kirim role ke frontend
 */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await usersCollection.findOne({ username });

    if (user && user.password === password) {
      return res.json({
        success: true,
        message: "Login berhasil!",
        username: user.username,
        role: user.role || "user",
      });
    }

    res.status(401).json({
      success: false,
      message: "Username atau password salah!",
    });
  } catch (error) {
    console.error("POST /api/login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================
// 4. JALANKAN SERVER
// ===============================
app.listen(port, () => {
  console.log(`🚀 Server API berjalan di http://localhost:${port}`);
});
