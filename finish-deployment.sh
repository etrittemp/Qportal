#!/bin/bash
BACKEND_URL="https://server-one-rho-37.vercel.app"
FRONTEND_URL="https://euda-portal-i8w4u6jmh-etrit-neziris-projects-f42b4265.vercel.app"

echo "Adding VITE_API_URL to frontend..."
vercel env add VITE_API_URL production << HEREDOC
$BACKEND_URL
HEREDOC

echo "Redeploying frontend..."
cd /home/etritneziri/projects/Qportal
vercel --prod --yes > /dev/null 2>&1

echo "Adding FRONTEND_URL to backend..."
cd server
vercel env add FRONTEND_URL production << HEREDOC
$FRONTEND_URL
HEREDOC

echo "Redeploying backend..."
vercel --prod --yes > /dev/null 2>&1

echo "✅ Deployment complete!"
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
