#!/bin/bash

echo "================================="
echo "VERIFICATION TEST FOR ALL FIXES"
echo "================================="
echo ""

# Test 1: Backend IPv4/IPv6 connectivity
echo "1. Testing backend IPv4 connectivity..."
curl -s -X POST http://127.0.0.1:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Backend accessible via IPv4 (127.0.0.1)"
else
  echo "   ❌ Backend NOT accessible via IPv4"
fi

echo ""
echo "2. Testing backend IPv6 connectivity..."
curl -s -X POST http://[::1]:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Backend accessible via IPv6 (::1)"
else
  echo "   ❌ Backend NOT accessible via IPv6"
fi

echo ""
echo "3. Testing backend localhost connectivity..."
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ Backend accessible via localhost"
else
  echo "   ❌ Backend NOT accessible via localhost"
fi

echo ""
echo "4. Checking translation files..."
if grep -q "creating:" /home/etritneziri/projects/Qportal/src/i18n/translations.ts; then
  echo "   ✅ Translation key 'creating' exists"
else
  echo "   ❌ Translation key 'creating' missing"
fi

if grep -q "Duke krijuar" /home/etritneziri/projects/Qportal/src/i18n/translations.ts; then
  echo "   ✅ Albanian translation for 'creating' exists"
else
  echo "   ❌ Albanian translation for 'creating' missing"
fi

if grep -q "Креирање" /home/etritneziri/projects/Qportal/src/i18n/translations.ts; then
  echo "   ✅ Serbian translation for 'creating' exists"
else
  echo "   ❌ Serbian translation for 'creating' missing"
fi

echo ""
echo "5. Checking AdminDashboard translation integration..."
if grep -q "useTranslation" /home/etritneziri/projects/Qportal/src/AdminDashboard.tsx; then
  echo "   ✅ AdminDashboard uses translation hook"
else
  echo "   ❌ AdminDashboard missing translation hook"
fi

echo ""
echo "6. Checking LanguageSelector visibility fix..."
if grep -q "text-gray-900 bg-white" /home/etritneziri/projects/Qportal/src/components/LanguageSelector.tsx; then
  echo "   ✅ LanguageSelector has proper text colors"
else
  echo "   ❌ LanguageSelector missing text color fix"
fi

echo ""
echo "7. Checking QuestionnaireManagement modal fixes..."
if grep -q "renderUploadModal" /home/etritneziri/projects/Qportal/src/QuestionnaireManagement.tsx; then
  echo "   ✅ Upload modal converted to render function"
else
  echo "   ❌ Upload modal still inline component"
fi

if grep -q "renderCreateModal" /home/etritneziri/projects/Qportal/src/QuestionnaireManagement.tsx; then
  echo "   ✅ Create modal implemented"
else
  echo "   ❌ Create modal missing"
fi

if grep -q 'id="uploadTitle"' /home/etritneziri/projects/Qportal/src/QuestionnaireManagement.tsx; then
  echo "   ✅ Upload inputs have unique IDs"
else
  echo "   ❌ Upload inputs missing unique IDs"
fi

if grep -q "handleCreate" /home/etritneziri/projects/Qportal/src/QuestionnaireManagement.tsx; then
  echo "   ✅ Create handler implemented"
else
  echo "   ❌ Create handler missing"
fi

echo ""
echo "8. Checking backend server binding..."
if grep -q "'0.0.0.0'" /home/etritneziri/projects/Qportal/server/src/index.js; then
  echo "   ✅ Backend explicitly binds to 0.0.0.0"
else
  echo "   ❌ Backend missing explicit binding"
fi

echo ""
echo "================================="
echo "VERIFICATION COMPLETE"
echo "================================="
