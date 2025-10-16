#!/bin/bash

echo "🚀 Deploying EUDA Frontend to Vercel..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env file..."
    read -p "Enter your backend API URL (e.g., https://your-backend.vercel.app): " backend_url
    echo "VITE_API_URL=$backend_url" > .env
    echo "✅ .env file created"
fi

echo "📦 Building and deploying frontend..."
vercel --prod

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Add VITE_API_URL environment variable: vercel env add VITE_API_URL"
echo "   2. Copy the frontend URL"
echo "   3. Update backend FRONTEND_URL: cd server && vercel env add FRONTEND_URL"
echo "   4. Test your application!"
echo ""
