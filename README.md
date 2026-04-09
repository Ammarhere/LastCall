# LastCall 🛍️
Rescue surplus food in Karachi · Save up to 70%

## Quick Start

### Prerequisites
- Node.js 20+, Docker Desktop, Expo CLI (`npm i -g expo-cli`), Expo Go on phone

### 1. Install
```bash
npm install
```

### 2. Start Databases
```bash
docker compose up -d
```

### 3. Configure
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — add Firebase credentials + JWT_SECRET
```

### 4. Run (4 separate terminals)
```bash
npm run backend     # API → http://localhost:4000
npm run customer    # Expo QR → scan with Expo Go
npm run partner     # Expo QR → scan with Expo Go
# Admin: open apps/admin/lastcall-admin.html in your browser
```

### First Admin User
```bash
curl -X POST http://localhost:4000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lastcall.pk","password":"SecurePass123","phone":"03001234567"}'
```
