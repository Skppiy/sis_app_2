#!/bin/bash
# Rollback Script for JS→TS Migration
# This script restores all JS files from the dedupe folder

echo "🔄 Rolling back JS→TS migration..."
echo "📁 Current directory: $(pwd)"

# Verify we're in the right location
if [ ! -d "dedupe/frontend/src" ]; then
    echo "❌ Error: dedupe folder not found. Are you in the project root?"
    exit 1
fi

if [ ! -d "frontend/src" ]; then
    echo "❌ Error: frontend/src folder not found. Are you in the project root?"
    exit 1
fi

# Count files in dedupe
dedupe_count=$(find dedupe/frontend/src -name "*.js" | wc -l)
echo "📊 Found $dedupe_count JS files in dedupe folder"

# Restore files
echo "🔁 Restoring JS files from dedupe..."
cp -r dedupe/frontend/src/* frontend/src/

# Verify restoration
restored_count=$(find frontend/src -name "*.js" | wc -l)
echo "📊 Restored $restored_count JS files to source"

if [ "$dedupe_count" -eq "$restored_count" ]; then
    echo "✅ Rollback completed successfully!"
    echo "🔧 Next steps:"
    echo "   1. cd frontend"
    echo "   2. npm run build (to verify)"
    echo "   3. npm run dev (to test)"
else
    echo "⚠️  Warning: File count mismatch"
    echo "   Expected: $dedupe_count, Restored: $restored_count"
    echo "   Please verify manually"
fi

echo "📝 Run 'find frontend/src -name \"*.js\" | head -10' to verify files are restored"