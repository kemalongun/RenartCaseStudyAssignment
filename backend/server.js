const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});


// Products route (reads real products.json and computes price + popularity/5)
app.get('/api/products', (req, res) => {
  try {
    const raw = fs.readFileSync(__dirname + '/data/products.json', 'utf-8');
    const products = JSON.parse(raw);

    // Fallback gold price per gram in USD (we’ll add live API later)
    const GOLD_USD_PER_GRAM = 75;

    // We expect images as an object { yellow, white, rose }
    const COLOR_KEYS = ['yellow', 'white', 'rose'];
    const COLOR_LABELS = ['Yellow Gold', 'White Gold', 'Rose Gold'];

    const result = products.map((p, idx) => {
      // popularityScore in your file is 0..1, not 0..100
      const score01 = typeof p.popularityScore === 'number' ? p.popularityScore : 0;

      const priceUSD = (score01 + 1) * p.weight * GOLD_USD_PER_GRAM;
      const popularity5 = Math.round(score01 * 50) / 10; // e.g., 0.85 -> 4.3

      // normalize images into an ordered array matching our labels
      const imagesArray = COLOR_KEYS.map(k => p.images?.[k]).filter(Boolean);
      const colorLabels = COLOR_LABELS.slice(0, imagesArray.length);

      return {
        id: p.id ?? idx + 1,
        name: p.name,
        weight: p.weight,
        popularityScore: score01,
        popularity5,                         // should be non-zero now
        priceUSD: Number(priceUSD.toFixed(2)),
        images: imagesArray,                 // now an array
        colorLabels                          // ["Yellow Gold","White Gold","Rose Gold"]
      };
    });

    res.json(result);
  } catch (e) {
    console.error('Error reading products.json:', e.message);
    res.status(500).json({ error: 'Failed to read products.json' });
  }
});




// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
