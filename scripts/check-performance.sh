#!/bin/bash

# Performance Check Script
# This script helps verify that optimizations are properly applied

echo "🔍 Checking Performance Optimizations..."
echo ""

# Check if babel plugin is installed
echo "1️⃣ Checking Babel Plugin..."
if grep -q "babel-plugin-transform-remove-console" package.json; then
    echo "✅ babel-plugin-transform-remove-console is installed"
else
    echo "❌ babel-plugin-transform-remove-console is NOT installed"
    echo "   Run: npm install --save-dev babel-plugin-transform-remove-console"
fi
echo ""

# Check if babel.config.js exists
echo "2️⃣ Checking Babel Configuration..."
if [ -f "babel.config.js" ]; then
    echo "✅ babel.config.js exists"
    if grep -q "transform-remove-console" babel.config.js; then
        echo "✅ Console removal plugin is configured"
    else
        echo "⚠️  Console removal plugin not found in babel.config.js"
    fi
else
    echo "❌ babel.config.js not found"
fi
echo ""

# Check if metro.config.js exists
echo "3️⃣ Checking Metro Configuration..."
if [ -f "metro.config.js" ]; then
    echo "✅ metro.config.js exists"
    if grep -q "hermesParser" metro.config.js; then
        echo "✅ Hermes parser is enabled"
    fi
    if grep -q "drop_console" metro.config.js; then
        echo "✅ Console dropping is configured"
    fi
else
    echo "❌ metro.config.js not found"
fi
echo ""

# Check TypeScript config
echo "4️⃣ Checking TypeScript Configuration..."
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json exists"
    if grep -q "removeComments" tsconfig.json; then
        echo "✅ Comment removal is enabled"
    fi
    if grep -q "skipLibCheck" tsconfig.json; then
        echo "✅ skipLibCheck is enabled"
    fi
else
    echo "❌ tsconfig.json not found"
fi
echo ""

# Check for React.memo usage in components
echo "5️⃣ Checking Component Optimization..."
MEMO_COUNT=$(find components -name "*.tsx" -exec grep -l "React.memo" {} \; 2>/dev/null | wc -l)
TOTAL_COMPONENTS=$(find components -name "*.tsx" 2>/dev/null | wc -l)
echo "✅ $MEMO_COUNT out of $TOTAL_COMPONENTS components use React.memo"
if [ $MEMO_COUNT -gt 0 ]; then
    echo "   Components with React.memo:"
    find components -name "*.tsx" -exec grep -l "React.memo" {} \; 2>/dev/null | sed 's/^/   - /'
fi
echo ""

# Check for console.log usage
echo "6️⃣ Checking Console Usage..."
CONSOLE_COUNT=$(grep -r "console\.\(log\|info\|debug\)" --include="*.ts" --include="*.tsx" app components store services 2>/dev/null | grep -v "__DEV__" | grep -v "console.error" | grep -v "console.warn" | wc -l)
if [ $CONSOLE_COUNT -gt 0 ]; then
    echo "⚠️  Found $CONSOLE_COUNT console.* calls not wrapped in __DEV__"
    echo "   These will be removed in production builds, but consider wrapping in __DEV__"
else
    echo "✅ All console calls are either wrapped in __DEV__ or will be removed"
fi
echo ""

# Check image optimization
echo "7️⃣ Checking Image Optimization..."
if [ -f "utils/imageOptimization.ts" ]; then
    echo "✅ Image optimization utility exists"
else
    echo "❌ Image optimization utility not found"
fi
echo ""

# Check Hermes in app.json
echo "8️⃣ Checking Expo Configuration..."
if [ -f "app.json" ]; then
    echo "✅ app.json exists"
    if grep -q '"jsEngine": "hermes"' app.json; then
        echo "✅ Hermes engine is enabled"
    else
        echo "⚠️  Hermes engine not explicitly enabled"
    fi
    if grep -q '"newArchEnabled": true' app.json; then
        echo "✅ New Architecture is enabled"
    fi
else
    echo "❌ app.json not found"
fi
echo ""

# Bundle size estimation
echo "9️⃣ Bundle Size Check..."
if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "📦 node_modules size: $NODE_MODULES_SIZE"
    echo "   (This is before tree-shaking, actual bundle will be smaller)"
else
    echo "⚠️  node_modules not found. Run: npm install"
fi
echo ""

echo "✨ Performance Check Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Install dependencies: npm install"
echo "   2. Clear cache: npx expo start --clear"
echo "   3. Build for production: npx expo export"
echo "   4. Profile with React DevTools"
echo ""
