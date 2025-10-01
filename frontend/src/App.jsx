import { useEffect, useRef, useState } from "react";
import "./index.css";
import Carousel from "./components/Carousel";
import GoldTicker from "./components/GoldTicker";

export default function App() {
  // ...
  return (
    <div className="container">
      <h1 className="page-title">Product List</h1>
      <GoldTicker />
      {/* rest of your UI */}
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function formatUSD(n) {
  return n?.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Star rating: 0..5 with gold fractional fill */
function Popularity({ value }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.max(0, Math.min(1, value - i));
    return (
      <span
        key={i}
        style={{
          position: "relative",
          width: 22,
          height: 22,
          display: "inline-block",
          fontSize: 24,       // star size
          lineHeight: "22px",
        }}
      >
        {/* empty star */}
        <span style={{ color: "#d7d7d7", position: "absolute", inset: 0 }}>★</span>
        {/* filled star */}
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
    <div
      className="card-rating"
      style={{ display: "flex", alignItems: "center", gap: 2 }}
    >
      {stars}
      <span
        style={{
          marginLeft: 6,
          fontFamily: "Avenir Book, Arial, sans-serif",
          fontSize: 14,
          fontWeight: "500", // bold
        }}
      >
        {value.toFixed(1)}/5
      </span>
    </div>
  );
}

function ProductCard({ p }) {
  const [colorIndex, setColorIndex] = useState(0);

  // Reorder colors to: Yellow, Rose, White (data is Yellow, White, Rose)
  const order = [0, 2, 1];
  const labelsRaw = p.colorLabels ?? ["Yellow Gold", "White Gold", "Rose Gold"];
  const imagesOrdered = order.map((i) => p.images?.[i]).filter(Boolean);
  const labelsOrdered = order.map((i) => labelsRaw[i]).filter(Boolean);

  return (
    <div className="card">
      <div className="thumb">
        <Carousel
          images={imagesOrdered}
          currentIndex={colorIndex}
          onIndexChange={setColorIndex}
        />
      </div>

      <h3 className="card-title">{p.name}</h3>

      {/* price (Montserrat Regular 15) */}
      <div className="card-price">{formatUSD(p.priceUSD)} USD</div>

      {/* color dots below price with extra spacing from CSS */}
      <div className="color-dots">
        {labelsOrdered.map((label, i) => (
          <button
            key={i}
            onClick={() => setColorIndex(i)}
            title={label}
            aria-label={label}
            className={`dot ${i === colorIndex ? "active" : ""}`}
            style={{
              background: ["#E6CA97", "#E1A4A9", "#D9D9D9"][i] || "#ddd",
            }}
          />
        ))}
      </div>

      {/* color name (Avenir Book 12, bold) */}
      <div className="card-label card-label--bold">
        {labelsOrdered[colorIndex]}
      </div>

      {/* popularity stars */}
      <Popularity value={p.popularity5} />
    </div>
  );
}


export default function App() {
  const [products, setProducts] = useState([]);
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [dragging, setDragging] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .then(setProducts)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // update paddle when the track scrolls
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

  // compute one-card step (card width + CSS gap)
  const getStep = () => {
    const track = trackRef.current;
    if (!track) return 300; // fallback
    const card = track.querySelector(".card");
    if (!card) return 300;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = 16; // must match .list-track gap in CSS
    return Math.round(cardWidth + gap);
  };

  // wrap only when already at the edge; otherwise move by delta clamped within bounds
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

  // paddle click/drag behavior (wrap feel handled by user controlling the paddle)
  const movePaddle = (e) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;

    const rawPct = x / rect.width;
    const pctWrapped = ((rawPct % 1) + 1) % 1;

    const paddleW = 0.2; // paddle width = 20%
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
            <ProductCard key={p.id} p={p} />
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

      {/* draggable paddle */}
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
