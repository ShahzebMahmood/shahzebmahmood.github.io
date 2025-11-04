#!/bin/bash
# Quick pre-push checks for Jekyll site

echo "🔍 Running pre-push checks..."
echo ""

ERRORS=0

# Check for Liquid syntax in code blocks (should use HTML entities)
echo "1. Checking for Liquid syntax in code blocks..."
LIQUID_ISSUES=$(grep -rn "{{ ." _posts/*.md | grep -v "&#123;" | grep -v "{% raw %}" || true)
if [ -n "$LIQUID_ISSUES" ]; then
    echo "   ✗ Found Liquid syntax in code blocks (should use HTML entities):"
    echo "$LIQUID_ISSUES" | sed 's/^/      /'
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ No Liquid syntax issues in code blocks"
fi

# Check for unclosed raw tags
echo ""
echo "2. Checking for unclosed Liquid raw tags..."
UNCLOSED_RAW=$(grep -rn "{% raw %}" _posts/*.md | grep -v "{% endraw %}" || true)
if [ -n "$UNCLOSED_RAW" ]; then
    echo "   ✗ Found unclosed {% raw %} tags:"
    echo "$UNCLOSED_RAW" | sed 's/^/      /'
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ No unclosed raw tags"
fi

# Check that all posts have front matter
echo ""
echo "3. Checking post front matter..."
for file in _posts/*.md; do
    if ! head -1 "$file" | grep -q "^---"; then
        echo "   ✗ $file missing opening ---"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo "   ✓ All posts have valid front matter"
fi

# Check for favicon files
echo ""
echo "4. Checking favicon files..."
if [ ! -f "favicon.ico" ]; then
    echo "   ✗ favicon.ico missing"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ favicon.ico exists"
fi

if [ ! -f "assets/img/favicons/favicon-16x16.png" ]; then
    echo "   ✗ favicon-16x16.png missing"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ favicon-16x16.png exists"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Safe to push."
    exit 0
else
    echo "❌ Found $ERRORS issue(s). Please fix before pushing."
    exit 1
fi

