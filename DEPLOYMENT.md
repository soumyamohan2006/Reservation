# Deployment Guide

## Backend Deployed
Your backend is deployed at: **https://reservation-ce32.onrender.com**

## Next Steps

### 1. Update Backend Environment Variables
Add this to your Render backend environment variables:
```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 2. Deploy Frontend

#### Option A: Vercel (Recommended)
```bash
cd frontend
npm install
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option B: Netlify
```bash
cd frontend
npm install
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### 3. Update Frontend Environment Variable
After deploying frontend, update `frontend/.env.production`:
```
VITE_API_URL=https://reservation-ce32.onrender.com
```

Then rebuild and redeploy the frontend.

### 4. Test the Application
1. Visit your deployed frontend URL
2. Register a new account
3. Try booking a space
4. Check if API calls work correctly

## Current Configuration

### Frontend
- Development: `http://localhost:5173` → `http://localhost:4000`
- Production: Uses `VITE_API_URL` from `.env.production`

### Backend
- Deployed: `https://reservation-ce32.onrender.com`
- MongoDB: Connected to MongoDB Atlas
- CORS: Allows `FRONTEND_URL` from environment variables

## Troubleshooting

### CORS Errors
Make sure `FRONTEND_URL` in backend `.env` matches your deployed frontend URL exactly.

### API Not Working
Check that `VITE_API_URL` in `frontend/.env.production` is set to `https://reservation-ce32.onrender.com`

### Build Errors
Run `npm run build` locally first to catch any build issues before deploying.
