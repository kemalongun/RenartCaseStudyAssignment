// Simple Express API for the Renart Case Study
// - /api/products reads local JSON
// - /api/goldprice fetches GoldAPI.io (cached 5 min)

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Allow frontend to call this API
app.use(cors());

// Health check
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Renart API is running" });
});

/* ----------------------------
 * /api/products
 * ---------------------------- */
app.get("/api/products", (_req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "products.json");
    const raw = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("Products error:", err?.message || err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

/* ----------------------------
 * /api/goldprice   (GoldAPI.io)
 * requires backend/.env with:
 *   GOLD_API_KEY=your_goldapi_token
 * ---------------------------- */
const goldCache = { value: null, ts: 0 };
const GOLD_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchGoldPriceUSD_GoldAPI() {
  const apiKey = process.env.GOLD_API_KEY;
  if (!apiKey) throw new Error("Missing GOLD_API_KEY");

  const url = "https://www.goldapi.io/api/XAU/USD";
  const { data } = await axios.get(url, {
    headers: {
      "x-access-token": apiKey,
      "Content-Type": "application/json",
    },
    timeout: 10_000,
  });

  if (typeof data?.price !== "number") {
    throw new Error("Unexpected response from GoldAPI");
  }
  return data.price; // USD per troy ounce
}

app.get("/api/goldprice", async (_req, res) => {
  const now = Date.now();

  // serve cached value if fresh
  if (goldCache.value && now - goldCache.ts < GOLD_TTL_MS) {
    return res.json({ ...goldCache.value, cached: true });
  }

  try {
    const usdPerOunce = await fetchGoldPriceUSD_GoldAPI();
    const usdPerGram = usdPerOunce / 31.1034768;

    const payload = {
      provider: "goldapi",
      usdPerOunce: Number(usdPerOunce.toFixed(2)),
      usdPerGram: Number(usdPerGram.toFixed(2)),
      updatedAt: new Date().toISOString(),
      cached: false,
    };

    goldCache.value = payload;
    goldCache.ts = now;

    res.json(payload);
  } catch (err) {
    console.error("Gold price error:", err?.message || err);
    res.status(502).json({ error: "Failed to fetch gold price" });
  }
});

/* ----------------------------
 * Start server
 * ---------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
