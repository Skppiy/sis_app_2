#!/usr/bin/env python3
import os
import glob
from pathlib import Path

# Find all JS/TS/JSX/TSX files
frontend_src = "D:/sis_app/frontend/src"
os.chdir(frontend_src)

js_files = glob.glob("**/*.js", recursive=True)
ts_files = glob.glob("**/*.ts", recursive=True)  
jsx_files = glob.glob("**/*.jsx", recursive=True)
tsx_files = glob.glob("**/*.tsx", recursive=True)

# Find duplicates
duplicates = []

for js_file in js_files:
    base_path = js_file[:-3]  # Remove .js extension
    
    # Check for corresponding TS file
    ts_file = base_path + ".ts"
    if ts_file in ts_files:
        duplicates.append(("JS/TS", js_file, ts_file))
    
    # Check for corresponding TSX file  
    tsx_file = base_path + ".tsx"
    if tsx_file in tsx_files:
        duplicates.append(("JS/TSX", js_file, tsx_file))

for jsx_file in jsx_files:
    base_path = jsx_file[:-4]  # Remove .jsx extension
    
    # Check for corresponding TSX file
    tsx_file = base_path + ".tsx"
    if tsx_file in tsx_files:
        duplicates.append(("JSX/TSX", jsx_file, tsx_file))

print(f"=== DUPLICATE FILE ANALYSIS ===")
print(f"Total JS files: {len(js_files)}")
print(f"Total TS files: {len(ts_files)}")
print(f"Total JSX files: {len(jsx_files)}")
print(f"Total TSX files: {len(tsx_files)}")
print(f"Total duplicates found: {len(duplicates)}")
print()

print("=== DUPLICATE PAIRS ===")
for pair_type, file1, file2 in sorted(duplicates):
    print(f"{pair_type}: {file1} <-> {file2}")

print()
print("=== CATEGORIZED DUPLICATES ===")

# Categorize by type
api_duplicates = [d for d in duplicates if 'api/' in d[1]]
auth_duplicates = [d for d in duplicates if 'auth/' in d[1]]
component_duplicates = [d for d in duplicates if 'components/' in d[1]]
feature_duplicates = [d for d in duplicates if 'features/' in d[1]]
schema_duplicates = [d for d in duplicates if 'schemas/' in d[1]]
service_duplicates = [d for d in duplicates if 'services/' in d[1]]
page_duplicates = [d for d in duplicates if 'pages/' in d[1]]
hook_duplicates = [d for d in duplicates if 'hooks/' in d[1]]
other_duplicates = [d for d in duplicates if not any(x in d[1] for x in ['api/', 'auth/', 'components/', 'features/', 'schemas/', 'services/', 'pages/', 'hooks/'])]

categories = [
    ("API", api_duplicates),
    ("Auth", auth_duplicates), 
    ("Components", component_duplicates),
    ("Features", feature_duplicates),
    ("Schemas", schema_duplicates),
    ("Services", service_duplicates),
    ("Pages", page_duplicates),
    ("Hooks", hook_duplicates),
    ("Other", other_duplicates)
]

for category, items in categories:
    if items:
        print(f"\n{category} ({len(items)} pairs):")
        for pair_type, file1, file2 in items:
            print(f"  {pair_type}: {file1} <-> {file2}")