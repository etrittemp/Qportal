#!/bin/bash

echo "🚀 Deploying EUDA Backend to Vercel..."
echo ""

cd server

# Deploy to production
echo "📦 Deploying backend..."
vercel --prod

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: Copy the deployment URL and:"
echo "   1. Update frontend .env with: VITE_API_URL=<backend-url>"
echo "   2. Add environment variables using: vercel env add"
echo ""
echo "Environment variables needed:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo "  - JWT_SECRET"
echo "  - NODE_ENV (production)"
echo "  - FRONTEND_URL (your frontend URL)"
echo ""
