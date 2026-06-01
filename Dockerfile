FROM node:20-slim

WORKDIR /app

# OpenSSL required by Prisma on Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy backend source + prisma schema
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma

# Generate Prisma client
RUN cd backend && npx prisma generate

EXPOSE 4000

# Run with tsx — no compile step needed, saves memory on free tier
CMD ["./node_modules/.bin/tsx", "backend/src/index.ts"]
