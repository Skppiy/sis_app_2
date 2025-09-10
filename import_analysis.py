#!/usr/bin/env python3
import os
import re
import glob
from pathlib import Path
from collections import defaultdict

# Find all files that contain imports
frontend_src = "D:/sis_app/frontend/src"
os.chdir(frontend_src)

# Get all JS/TS/JSX/TSX files
all_files = []
all_files.extend(glob.glob("**/*.js", recursive=True))
all_files.extend(glob.glob("**/*.ts", recursive=True))
all_files.extend(glob.glob("**/*.jsx", recursive=True))
all_files.extend(glob.glob("**/*.tsx", recursive=True))

# Track actual imports
imports = defaultdict(list)
import_pattern = re.compile(r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"];?', re.MULTILINE)
lazy_import_pattern = re.compile(r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', re.MULTILINE)

print("=== IMPORT ANALYSIS ===")
print(f"Analyzing {len(all_files)} files for imports...")

actually_imported_files = set()

for file_path in all_files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find regular imports
        matches = import_pattern.findall(content)
        lazy_matches = lazy_import_pattern.findall(content)
        
        all_matches = matches + lazy_matches
        
        for match in all_matches:
            # Resolve relative imports
            if match.startswith('./') or match.startswith('../'):
                # Convert relative path to absolute from current file
                current_dir = os.path.dirname(file_path)
                resolved_path = os.path.normpath(os.path.join(current_dir, match))
                # Remove leading ./ or ../
                if resolved_path.startswith('./'):
                    resolved_path = resolved_path[2:]
                imports[file_path].append((match, resolved_path))
            elif match.startswith('@/'):
                # Alias import - resolve to actual path
                resolved_path = match[2:]  # Remove @/
                imports[file_path].append((match, resolved_path))
            elif match.startswith('@'):
                # Other aliases
                alias_mappings = {
                    '@api': 'api',
                    '@auth': 'auth', 
                    '@features': 'features',
                    '@components': 'components',
                    '@layouts': 'layouts',
                    '@pages': 'pages',
                    '@styles': 'styles',
                    '@schemas': 'schemas',
                    '@utils': 'utils'
                }
                
                for alias, path in alias_mappings.items():
                    if match.startswith(alias):
                        resolved_path = match.replace(alias, path, 1)
                        imports[file_path].append((match, resolved_path))
                        break
                else:
                    imports[file_path].append((match, match))  # External package
            else:
                imports[file_path].append((match, match))  # External package
                
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

# Now determine which actual files are being imported
print("\n=== RESOLVING ACTUAL FILE IMPORTS ===")

for importing_file, file_imports in imports.items():
    for original_import, resolved_path in file_imports:
        # Skip external packages
        if not resolved_path.startswith('.') and not '/' in resolved_path[:10]:
            continue
            
        # Try different extensions to see which file actually exists and gets imported
        base_path = resolved_path
        
        # Remove any existing extension
        if base_path.endswith('.js') or base_path.endswith('.ts'):
            base_path = base_path[:-3]
        elif base_path.endswith('.jsx') or base_path.endswith('.tsx'):
            base_path = base_path[:-4]
        
        # Check which file actually exists
        possible_files = [
            base_path + '.ts',
            base_path + '.tsx', 
            base_path + '.js',
            base_path + '.jsx',
            base_path + '/index.ts',
            base_path + '/index.tsx',
            base_path + '/index.js',
            base_path + '/index.jsx',
        ]
        
        for possible_file in possible_files:
            if os.path.exists(possible_file):
                actually_imported_files.add(possible_file)
                print(f"IMPORT: {importing_file} -> {possible_file} (via {original_import})")
                break

print(f"\n=== SUMMARY ===")
print(f"Total files that are actually imported: {len(actually_imported_files)}")

# Find files that exist but are NOT imported
all_local_files = set()
for f in all_files:
    if not f.startswith('node_modules'):
        all_local_files.add(f.replace('\\', '/'))

not_imported = all_local_files - actually_imported_files
print(f"Files that exist but are NOT imported: {len(not_imported)}")

print("\n=== FILES NOT BEING IMPORTED ===")
for file in sorted(not_imported):
    print(f"UNUSED: {file}")

# Specifically check for duplicate pairs where wrong version might be imported
print("\n=== DUPLICATE ANALYSIS - WHICH VERSION IS IMPORTED? ===")

duplicate_pairs = [
    ("api/index.js", "api/index.ts"),
    ("api/queryKeys.js", "api/queryKeys.ts"), 
    ("api/requestHelper.js", "api/requestHelper.ts"),
    ("features/academics/services/teachers.js", "features/academics/services/teachers.ts"),
    ("features/academics/services/subjects.js", "features/academics/services/subjects.ts"),
    ("features/academics/services/years.js", "features/academics/services/years.ts"),
    ("features/enrollment/services/students.js", "features/enrollment/services/students.ts"),
    # Add more critical pairs as needed
]

for js_file, ts_file in duplicate_pairs:
    js_imported = js_file in actually_imported_files
    ts_imported = ts_file in actually_imported_files
    
    print(f"\n{js_file} vs {ts_file}:")
    print(f"  JS imported: {js_imported}")
    print(f"  TS imported: {ts_imported}")
    
    if js_imported and ts_imported:
        print("  WARNING: BOTH VERSIONS IMPORTED - POTENTIAL CONFLICT!")
    elif js_imported and not ts_imported:
        print("  JS version being used")
    elif ts_imported and not js_imported:
        print("  TS version being used")
    else:
        print("  Neither version imported")