# Renart Case Study

Product listing application with dynamic pricing based on real-time gold rates.

## Features

- Dynamic price calculation based on gold price, weight, and popularity
- Real-time gold price integration
- Interactive product carousel
- Color variant selection
- Responsive design

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- API: Gold Price API integration

## Setup

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/renart-case-study.git
cd renart-case-study
```

2. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Create environment files

Backend `.env`:
```
GOLD_API_KEY=your_api_key_here
PORT=8080
```

Frontend `.env`:
```
VITE_API_BASE=http://localhost:8080
```

4. Start the servers

```bash
# Backend
cd backend
node server.js

# Frontend (new terminal)
cd frontend
npm run dev
```

## API Endpoints

- `GET /api/products` - Get product list
- `GET /api/goldprice` - Get current gold price

## Live Demo

[View Demo](your-deployed-url-here)
