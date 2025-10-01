const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Renart API is running" });
});

app.get("/api/products", async (req, res) => {
  try {
    const { minPrice, maxPrice, minPopularity } = req.query;
    const filePath = path.join(__dirname, "data", "products.json");
    const raw = fs.readFileSync(filePath, "utf8");
    let products = JSON.parse(raw);

    // Get current gold price for price calculations
    let goldPrice = 0;
    try {
      const goldPriceData = await fetchGoldPriceUSD_GoldAPI();
      goldPrice = goldPriceData / 31.1034768; // Convert troy ounce to gram
    } catch (err) {
      console.error("Warning: Using fallback gold price");
      goldPrice = 120; // Fallback price
    }

    // Log incoming filters and gold price
    console.log('Debug:', {
      minPrice: parseFloat(minPrice),
      maxPrice: parseFloat(maxPrice),
      minPopularity: parseFloat(minPopularity),
      goldPrice
    });

    // Apply filters if provided
    if (minPrice || maxPrice || minPopularity) {
      products = products.filter(p => {
        // Calculate price for each product
        const price = (p.popularityScore + 1) * p.weight * goldPrice;
        
        // Debug log for each product
        console.log(`Filtering ${p.name}:`, {
          price,
          popularityScore: p.popularityScore,
          meetsMinPrice: !minPrice || price >= parseFloat(minPrice),
          meetsMaxPrice: !maxPrice || price <= parseFloat(maxPrice),
          meetsPopularity: !minPopularity || p.popularityScore >= parseFloat(minPopularity)
        });

        // Apply filters
        const meetsMinPrice = !minPrice || price >= parseFloat(minPrice);
        const meetsMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
        const meetsPopularity = !minPopularity || p.popularityScore >= parseFloat(minPopularity);
        
        return meetsMinPrice && meetsMaxPrice && meetsPopularity;
      });
    }

    // Log filtered products count
    console.log('Filtered products:', products.length);
    res.json(products);
  } catch (err) {
    console.error("Products error:", err?.message || err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

const goldCache = { value: null, ts: 0 };
const GOLD_TTL_MS = 5 * 60 * 1000;

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
  return data.price;
}

app.get("/api/goldprice", async (_req, res) => {
  const now = Date.now();

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});