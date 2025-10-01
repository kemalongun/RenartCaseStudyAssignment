import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function GoldTicker() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      const res = await fetch(`${API_BASE}/api/goldprice`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setData(json);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (err) return <div className="gold-ticker error">Gold price unavailable</div>;
  if (!data) return <div className="gold-ticker">Loading gold price…</div>;

  return (
    <div className="gold-ticker">
      <span>Gold:</span>
      <strong>${data.usdPerOunce.toLocaleString()}</strong>
      <span>/oz</span>
      <span className="sep">•</span>
      <span>${data.usdPerGram.toFixed(2)}/g</span>
      <span className="sep">•</span>
      <span className="muted">{new Date(data.updatedAt).toLocaleTimeString()}</span>
    </div>
  );
}
