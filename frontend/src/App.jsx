import { useEffect, useRef, useState } from "react";
import "./index.css";
import Carousel from "./components/Carousel";
import ProductFilters from "./components/ProductFilters";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function formatUSD(n) {
  return n?.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function Popularity({ value }) {
  const rating = value || 0;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.max(0, Math.min(1, rating - i));
    return (
      <span
        key={i}
        style={{
          position: "relative",
          width: 22,
          height: 22,
          display: "inline-block",
          fontSize: 24,
          lineHeight: "22px",
        }}
      >
        <span style={{ color: "#d7d7d7", position: "absolute", inset: 0 }}>★</span>
        <span
          style={{
            color: "#FFD580",
            position: "absolute",
            inset: 0,
            width: `${fill * 100}%`,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          ★
        </span>
      </span>
    );
  });

  return (
    <div className="card-rating" style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {stars}
      <span style={{ marginLeft: 6, fontFamily: "Avenir Book, Arial, sans-serif", fontSize: 14, fontWeight: "500" }}>
        {rating.toFixed(1)}/5
      </span>
    </div>
  );
}

function ProductCard({ p, goldPricePerGram }) {
  const [colorIndex, setColorIndex] = useState(0);
  const priceUSD = (p.popularityScore + 1) * p.weight * goldPricePerGram;
  const imagesOrdered = p.images ? [p.images.yellow, p.images.rose, p.images.white].filter(Boolean) : [];
  const labelsOrdered = Object.keys(p.images || {}).map(color => color.charAt(0).toUpperCase() + color.slice(1) + " Gold");
  const popularity5 = p.popularityScore * 5;

  return (
    <div className="card">
      <div className="thumb">
        <Carousel images={imagesOrdered} currentIndex={colorIndex} onIndexChange={setColorIndex} />
      </div>
      <h3 className="card-title">{p.name}</h3>
      <div className="card-price">{formatUSD(priceUSD)} USD</div>
      <div className="color-dots">
        {labelsOrdered.map((label, i) => (
          <button
            key={`color-${i}`}
            onClick={() => setColorIndex(i)}
            title={label}
            aria-label={label}
            className={`dot ${i === colorIndex ? "active" : ""}`}
            style={{ background: ["#E6CA97", "#E1A4A9", "#D9D9D9"][i] || "#ddd" }}
          />
        ))}
      </div>
      <div className="card-label card-label--bold">{labelsOrdered[colorIndex]}</div>
      <Popularity value={popularity5} />
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [goldPrice, setGoldPrice] = useState(null);
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const barRef = useRef(null);

  const fetchProducts = async (filters = new URLSearchParams()) => {
    try {
      const response = await fetch(`${API_BASE}/api/products?${filters}`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Fetch gold price
    fetch(`${API_BASE}/api/goldprice`)
      .then((r) => r.json())
      .then(data => setGoldPrice(data.usdPerGram))
      .catch((err) => console.error("Gold price fetch error:", err));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const getMax = () => {
    const el = trackRef.current;
    if (!el) return 0;
    return el.scrollWidth - el.clientWidth;
  };

  const getStep = () => {
    const track = trackRef.current;
    if (!track) return 300;
    const card = track.querySelector(".card");
    if (!card) return 300;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = 16;
    return Math.round(cardWidth + gap);
  };

  const scrollByWrap = (delta) => {
    const el = trackRef.current;
    if (!el) return;
    const max = getMax();
    const atEnd = el.scrollLeft >= max - 1;
    const atStart = el.scrollLeft <= 1;

    if (delta > 0 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (delta < 0 && atStart) {
      el.scrollTo({ left: max, behavior: "smooth" });
      return;
    }

    const next = Math.max(0, Math.min(max, el.scrollLeft + delta));
    el.scrollTo({ left: next, behavior: "smooth" });
  };

  const scrollToProgress = (pct) => {
    const el = trackRef.current;
    if (!el) return;
    const max = getMax();
    el.scrollLeft = Math.max(0, Math.min(max, pct * max));
  };

  const movePaddle = (e) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;

    const rawPct = x / rect.width;
    const pctWrapped = ((rawPct % 1) + 1) % 1;

    const paddleW = 0.2;
    const travel = Math.max(0, Math.min(1 - paddleW, pctWrapped - paddleW / 2));
    scrollToProgress(travel / (1 - paddleW));
  };

  const startDrag = (e) => {
    setDragging(true);
    movePaddle(e);
  };
  const endDrag = () => setDragging(false);

  useEffect(() => {
    const onMove = (e) => {
      if (dragging) {
        e.preventDefault();
        movePaddle(e);
      }
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  return (
    <div className="container">
      <h1 className="page-title">Product List</h1>
      <ProductFilters onFilter={fetchProducts} />
      <div className="list-wrap">
        <button
          className="list-arrow left"
          onClick={() => scrollByWrap(-getStep())}
          aria-label="Previous products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <div className="list-track" ref={trackRef}>
          {products.map((p) => (
            <ProductCard 
              key={p.id} 
              p={p} 
              goldPricePerGram={goldPrice || 0}
            />
          ))}
        </div>

        <button
          className="list-arrow right"
          onClick={() => scrollByWrap(getStep())}
          aria-label="Next products"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <div
        className={`list-progress ${dragging ? "dragging" : ""}`}
        ref={barRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onMouseUp={endDrag}
        onTouchEnd={endDrag}
        onClick={movePaddle}
        aria-hidden="true"
      >
        <div className="fill" style={{ left: `${progress * 80}%` }} />
      </div>
    </div>
  );
}