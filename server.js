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
    const filePath = path.join(__dirname, "backend/data", "products.json");
    const raw = fs.readFileSync(filePath, "utf8");
    let products = JSON.parse(raw);

    let goldPrice = 0;
    try {
      const goldPriceData = await fetchGoldPriceUSD();
      goldPrice = goldPriceData / 31.1034768;
    } catch (err) {
      goldPrice = 63.09;
    }

    if (minPrice || maxPrice || minPopularity) {
      products = products.filter(p => {
        const price = (p.popularityScore + 1) * p.weight * goldPrice;
        const meetsMinPrice = !minPrice || price >= parseFloat(minPrice);
        const meetsMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
        const meetsPopularity = !minPopularity || p.popularityScore >= parseFloat(minPopularity);
        
        return meetsMinPrice && meetsMaxPrice && meetsPopularity;
      });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

const goldCache = { value: null, ts: 0 };
const GOLD_TTL_MS = 5 * 60 * 1000;

async function fetchGoldPriceUSD() {
  try {
    const API_KEY = "8bfc5cda6cdab4d28a473e3183f9175e";
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=XAU&currencies=USD`;
    
    const { data } = await axios.get(url, {
      timeout: 10_000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!data || !data.rates || !data.rates.USD) {
      throw new Error('Invalid API response format');
    }
    
    const usdPerOunce = data.rates.USD;
    
    if (!usdPerOunce || usdPerOunce <= 0) {
      throw new Error('Invalid gold price received');
    }
    
    return usdPerOunce;
  } catch (err) {
    return 1962.50;
  }
}

app.get("/api/goldprice", async (_req, res) => {
  const now = Date.now();
  
  if (goldCache.value && 
      goldCache.value.usdPerOunce > 0 && 
      now - goldCache.ts < GOLD_TTL_MS) {
    return res.json({ ...goldCache.value, cached: true });
  }

  try {
    const usdPerOunce = await fetchGoldPriceUSD();
    const usdPerGram = usdPerOunce / 31.1034768;

    const payload = {
      provider: "metalpriceapi",
      usdPerOunce: Number(usdPerOunce.toFixed(2)),
      usdPerGram: Number(usdPerGram.toFixed(2)),
      updatedAt: new Date().toISOString(),
      cached: false,
    };

    if (payload.usdPerOunce > 0) {
      goldCache.value = payload;
      goldCache.ts = now;
    }

    res.json(payload);
  } catch (err) {
    const fallbackPrice = 1962.50;
    const fallbackPricePerGram = fallbackPrice / 31.1034768;
    
    res.json({
      provider: "fallback",
      usdPerOunce: fallbackPrice,
      usdPerGram: Number(fallbackPricePerGram.toFixed(2)),
      updatedAt: new Date().toISOString(),
      cached: false,
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});