import { useState } from 'react';
import './ProductFilters.css';

export default function ProductFilters({ onFilter }) {
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minPopularity, setMinPopularity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const filters = new URLSearchParams();
    filters.append('minPrice', priceRange[0]);
    filters.append('maxPrice', priceRange[1]);
    if (minPopularity) filters.append('minPopularity', minPopularity / 5);
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="filters">
      <div className="price-range">
        <label>Price Range ($)</label>
        <div className="range-slider-container">
          <input
            type="range"
            min="0"
            max="2000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
            className="slider"
          />
          <div className="range-values">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>
      <div className="min-rating">
        <label>
          Rating (0-5)
          <input
            type="number"
            value={minPopularity}
            onChange={e => setMinPopularity(e.target.value)}
            min="0"
            max="5"
            step="0.1"
          />
        </label>
      </div>
      <div className="filter-actions">
        <button type="submit">Apply Filters</button>
        <button 
          type="button" 
          onClick={() => {
            setPriceRange([0, 2000]);
            setMinPopularity('');
            onFilter(new URLSearchParams());
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}