#!/bin/bash

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚀 EUDA Questionnaire Portal - Vercel Deployment Script   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo ""
    echo "Please run the following command to login:"
    echo -e "${BLUE}vercel login${NC}"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Logged in as: $(vercel whoami)${NC}"
echo ""

# Step 1: Deploy Backend
echo "═══════════════════════════════════════════════════════════════"
echo "📦 STEP 1: Deploying Backend API"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd server

echo "Deploying backend to Vercel..."
BACKEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^ ]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${BLUE}🔗 Backend URL: $BACKEND_URL${NC}"
echo ""

# Save backend URL
echo "$BACKEND_URL" > ../backend-url.txt

# Step 2: Configure Backend Environment Variables
echo "═══════════════════════════════════════════════════════════════"
echo "⚙️  STEP 2: Configuring Backend Environment Variables"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Adding environment variables to backend..."

# Read from .env file
if [ -f .env ]; then
    echo "📋 Setting up environment variables..."

    # Extract values from .env
    SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
    SUPABASE_ANON_KEY=$(grep SUPABASE_ANON_KEY .env | cut -d '=' -f2)
    SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env | cut -d '=' -f2)
    JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2)

    # Add environment variables (using echo to avoid interactive prompts)
    echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production --yes || true
    echo "$SUPABASE_ANON_KEY" | vercel env add SUPABASE_ANON_KEY production --yes || true
    echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_KEY production --yes || true
    echo "$JWT_SECRET" | vercel env add JWT_SECRET production --yes || true
    echo "production" | vercel env add NODE_ENV production --yes || true

    echo -e "${GREEN}✅ Environment variables configured${NC}"
else
    echo -e "${RED}❌ .env file not found in server directory${NC}"
    exit 1
fi

echo ""

# Step 3: Deploy Frontend
echo "═══════════════════════════════════════════════════════════════"
echo "📦 STEP 3: Deploying Frontend"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd ..

# Update frontend .env
echo "Updating frontend .env with backend URL..."
echo "VITE_API_URL=$BACKEND_URL" > .env

echo "Deploying frontend to Vercel..."
FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^ ]*' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Frontend deployment failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "${BLUE}🔗 Frontend URL: $FRONTEND_URL${NC}"
echo ""

# Save frontend URL
echo "$FRONTEND_URL" > frontend-url.txt

# Step 4: Configure Frontend Environment Variables
echo "═══════════════════════════════════════════════════════════════"
echo "⚙️  STEP 4: Configuring Frontend Environment Variables"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Adding VITE_API_URL to frontend..."
echo "$BACKEND_URL" | vercel env add VITE_API_URL production --yes || true

echo ""
echo -e "${GREEN}✅ Frontend environment variables configured${NC}"

# Step 5: Update Backend CORS
echo "═══════════════════════════════════════════════════════════════"
echo "⚙️  STEP 5: Updating Backend CORS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd server
echo "Adding FRONTEND_URL to backend..."
echo "$FRONTEND_URL" | vercel env add FRONTEND_URL production --yes || true

echo ""
echo "Redeploying backend with updated CORS..."
vercel --prod --yes > /dev/null 2>&1

echo -e "${GREEN}✅ Backend CORS updated${NC}"

cd ..

# Step 6: Redeploy Frontend
echo "═══════════════════════════════════════════════════════════════"
echo "⚙️  STEP 6: Final Frontend Deployment"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Redeploying frontend with environment variables..."
vercel --prod --yes > /dev/null 2>&1

echo -e "${GREEN}✅ Frontend redeployed${NC}"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 DEPLOYMENT COMPLETE! 🎉                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your EUDA Questionnaire Portal is now live!${NC}"
echo ""
echo "📝 URLs:"
echo -e "  ${BLUE}Frontend:${NC} $FRONTEND_URL"
echo -e "  ${BLUE}Backend:${NC}  $BACKEND_URL"
echo ""
echo "📋 Application Pages:"
echo -e "  ${BLUE}Questionnaire:${NC} $FRONTEND_URL/questionnaire"
echo -e "  ${BLUE}Dashboard:${NC}     $FRONTEND_URL/dashboard"
echo -e "  ${BLUE}Login:${NC}         $FRONTEND_URL/login"
echo ""
echo "🔍 Testing:"
echo "  1. Visit the questionnaire and submit a test response"
echo "  2. Login to the dashboard"
echo "  3. Verify the response appears in the dashboard"
echo ""
echo -e "${YELLOW}⚠️  Important: Test the health endpoint:${NC}"
echo "  curl $BACKEND_URL/health"
echo ""
echo "✅ Deployment information saved to:"
echo "   - backend-url.txt"
echo "   - frontend-url.txt"
echo ""
