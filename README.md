# Renart Case Study

## Live Demo
- Frontend: https://renart-case-study-snowy.vercel.app
- Backend API: https://renart-api.onrender.com

## Features
- Dynamic product listing with real-time gold price calculations
- Interactive price range filter
- Product rating filter
- Color variant selection
- Responsive design
- Real-time gold price integration

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Deployment: Vercel (Frontend) + Render (Backend)
- APIs: Gold Price API integration

## Local Development

### Backend Setup
```bash
# Install dependencies
npm install

# Start server
node server.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend (.env):
```
GOLD_API_KEY=your_api_key
PORT=8080
```

Frontend (.env):
```
VITE_API_BASE=http://localhost:8080
```

## API Endpoints
- `GET /api/products` - Get product list
- `GET /api/goldprice` - Get current gold price

## Filtering Features
- Price Range: Filter products by price
- Rating: Filter by product popularity score
