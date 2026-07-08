#!/bin/bash
# Quick pre-push checks for Jekyll site

echo "🔍 Running pre-push checks..."
echo ""

ERRORS=0

# Check for Liquid syntax and unclosed raw tags
echo "1 & 2. Checking for Liquid syntax and unclosed raw tags..."
PYTHON_ERRORS=$(python3 -c '
import glob, sys, re
errors = 0
for filepath in glob.glob("_posts/*.md"):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    raw_count = content.count("{% raw %}")
    endraw_count = content.count("{% endraw %}")
    if raw_count != endraw_count:
        print(f"   ✗ {filepath}: Mismatched raw ({raw_count}) and endraw ({endraw_count}) tags")
        errors += 1
        continue
    raw_indices = [m.start() for m in re.finditer(r"{%\s*raw\s*%}", content)]
    endraw_indices = [m.end() for m in re.finditer(r"{%\s*endraw\s*%}", content)]
    def is_inside_raw(index):
        for start, end in zip(raw_indices, endraw_indices):
            if start <= index <= end:
                return True
        return False
    lines = content.splitlines(keepends=True)
    def get_line_num(char_index):
        current_len = 0
        for line_num, line in enumerate(lines, 1):
            current_len += len(line)
            if char_index < current_len:
                return line_num
        return len(lines)
    for m in re.finditer(r"\{\{", content):
        start_idx = m.start()
        if not is_inside_raw(start_idx):
            line_num = get_line_num(start_idx)
            line_content = lines[line_num - 1].strip()
            print(f"   ✗ {filepath}:{line_num} - Found unescaped \"{{\" outside raw block: {line_content}")
            errors += 1
sys.exit(errors)
' 2>&1)

if [ $? -ne 0 ]; then
    echo "   ✗ Found issues:"
    echo "$PYTHON_ERRORS"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ No Liquid syntax or raw tag issues found"
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
    echo ""
    echo "ℹ️  Note: If you see a 'site.webmanifest' conflict warning during build,"
    echo "   it's harmless - Jekyll is just seeing the same file with different"
    echo "   path representations. The file will still be copied correctly."
    exit 0
else
    echo "❌ Found $ERRORS issue(s). Please fix before pushing."
    exit 1
fi

