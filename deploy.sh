#!/bin/bash

echo "🚀 Starting EPTUNU CBT Platform Production Build & Optimization..."

# 1. Pull latest commits from main branch
echo "📦 Pulling latest updates from Git..."
git pull origin main

# 2. Install dependencies
echo "📥 Installing dependencies..."
npm install

# 3. Synchronize Database schema
echo "🗄️ Pushing database schema..."
if [ -f .env ] && [ ! -f packages/database/.env ]; then
  cp .env packages/database/.env
fi
npm run db:push

# 4. Build Monorepo Workspaces
echo "🏗️ Building API & Web Workspaces..."
npm run build

# 5. Reload PM2 Process Manager
echo "🔄 Reloading PM2 Service Instances..."
if command -v pm2 &> /dev/null; then
  pm2 start ecosystem.config.js --update-env || pm2 reload ecosystem.config.js --update-env
  pm2 save
  echo "✅ PM2 Services updated successfully!"
else
  echo "⚠️ PM2 not found globally. Please start services manually."
fi

echo "🎉 EPTUNU Production Deployment Completed!"
