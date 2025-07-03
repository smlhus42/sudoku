# 🚀 War of Numbers - Deployment Guide

## 📋 Arkitektur

**Frontend (Vercel)**: React + TypeScript + Vite  
**Backend (Railway/Render)**: Node.js + Express + Socket.io

## 🎯 Deployment Steps

### 1. Backend Deployment (Railway/Render)

#### Railway:
1. Gå til [railway.app](https://railway.app)
2. Logg inn med GitHub
3. New Project → Deploy from GitHub repo
4. Velg `sudoku` repository
5. Set root directory til `server/`
6. Add environment variables:
   ```
   PORT=3001
   FRONTEND_URL=https://ditt-vercel-domene.vercel.app
   NODE_ENV=production
   ```

#### Render:
1. Gå til [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo `sudoku`
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     PORT=3001
     FRONTEND_URL=https://ditt-vercel-domene.vercel.app
     NODE_ENV=production
     ```

### 2. Frontend Deployment (Vercel)

1. Gå til [vercel.com](https://vercel.com)
2. Import GitHub repo `sudoku`
3. Framework Preset: **Vite**
4. Root Directory: **Leave empty** (uses repo root)
5. Build Command: `npm run build:frontend`
6. Environment Variables:
   ```
   VITE_API_URL=https://ditt-backend-domene.railway.app
   VITE_SOCKET_URL=https://ditt-backend-domene.railway.app
   ```

### 3. Oppdater CORS

Etter frontend er deployet, oppdater backend environment variables:
```
FRONTEND_URL=https://ditt-faktiske-vercel-domene.vercel.app
```

## 🧪 Testing

### Local Testing:
```bash
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
npm run dev
```

### Production URLs:
- **Frontend**: `https://war-of-numbers.vercel.app`
- **Backend**: `https://war-of-numbers-api.railway.app`
- **Health Check**: `https://war-of-numbers-api.railway.app/health`

## 📱 Mobile Testing

URL for mobile testing: `https://war-of-numbers.vercel.app`

Test på forskjellige enheter:
- [ ] iPhone/Android
- [ ] Tablet
- [ ] Desktop
- [ ] Landscape/Portrait orientering

## 🔧 Troubleshooting

### CORS Issues:
- Sjekk at `FRONTEND_URL` matcher eksakt Vercel URL
- Kontroller at environment variables er satt riktig

### WebSocket Issues:
- Verifiser at `VITE_SOCKET_URL` peker til backend
- Sjekk at backend logger WebSocket connections

### Build Issues:
- Kontroller at alle dependencies er installert
- Verifiser at build-scripts er riktige 