# Reservation App

Frontend: React + Vite (`/frontend`)  
Backend: Node + Express (`/backend`)

## Setup

Install dependencies for both:
```bash
cd frontend && npm install
cd ../backend && npm install
```

## Run

Start backend:
```bash
cd backend
npm run dev
```

In another terminal, start frontend:
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:4000`

## Backend API

- `GET /api/health`
- `POST /api/register`
- `POST /api/login`
- `GET /api/spaces`
- `GET /api/spaces/:hallId/availability?date=YYYY-MM-DD`
- `GET /api/bookings?hallId=...&date=YYYY-MM-DD`
- `POST /api/bookings`

## Folder Structure

```
Reservation/
├── frontend/        # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── backend/         # Node + Express
│   ├── index.js
│   └── package.json
└── package.json     # Root scripts
```
