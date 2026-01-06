# Git History Purge: Reference Data Removal

## ⚠️ CRITICAL: Read Before Proceeding

This document describes how to purge reference datasets from git history. This is a **destructive operation** that rewrites git history.

## What Was Done

1. ✅ Removed vendor naming from UI/docs ("42 Macro KISS" → "External Reference Workbook")
2. ✅ Updated loaders to use local-only paths (`.local/reference/` or `GHOSTREGIME_REFERENCE_DATA_DIR`)
3. ✅ Removed reference data from `public/data/kiss/` (browser loader now shows friendly error)
4. ✅ Made tests opt-in (`RUN_PARITY_TESTS=1` required)
5. ✅ Added guardrail script (`npm run check:parity-names`)
6. ✅ Updated `.gitignore` to exclude reference data paths

## What Needs to Be Done (Manual Steps)

### Step 1: Remove Files from Working Tree

Files should already be deleted, but verify:

```bash
# Check if files still exist
ls -la data/kiss/
ls -la public/data/kiss/

# If they exist, remove them
rm -rf data/kiss/
rm -rf public/data/kiss/
```

### Step 2: Install git-filter-repo (if not already installed)

```bash
# macOS
brew install git-filter-repo

# Linux (Debian/Ubuntu)
sudo apt install git-filter-repo

# Or via pip
pip install git-filter-repo
```

### Step 3: Create a Backup (IMPORTANT)

```bash
# Clone a backup of the repo
cd /tmp
git clone <your-repo-url> ghost-allocator-backup
```

### Step 4: Purge History

**⚠️ WARNING: This rewrites git history. All collaborators will need to re-clone or hard reset.**

```bash
# Navigate to your repo
cd /path/to/ghost-allocator

# Purge reference data paths from history
git filter-repo --path data/kiss --path public/data/kiss --invert-paths

# Verify the purge worked
git log --all --full-history -- data/kiss/
git log --all --full-history -- public/data/kiss/
# Should show no results
```

### Step 5: Force Push (Destructive)

**⚠️ WARNING: This will overwrite remote history. Coordinate with your team first.**

```bash
# Force push to main branch
git push --force --prune origin main

# Force push tags (if any)
git push --force --tags
```

### Step 6: Notify Team

Anyone with an existing clone will need to:

```bash
# Option A: Re-clone (safest)
cd /tmp
rm -rf ghost-allocator
git clone <your-repo-url> ghost-allocator

# Option B: Hard reset (if they have no local changes)
cd ghost-allocator
git fetch origin
git reset --hard origin/main
```

## Post-Purge Verification

1. ✅ `npm run build` passes
2. ✅ `npm run check:parity-names` passes
3. ✅ `npm test` passes (parity tests skip without `RUN_PARITY_TESTS=1`)
4. ✅ No reference data files in repo or history
5. ✅ Parity UI shows friendly error when data not found

## Notes

- Old blobs may still exist in forks/caches, but this materially reduces exposure
- Reference data should now be placed in `.local/reference/` (gitignored)
- Parity features remain opt-in via `NEXT_PUBLIC_ENABLE_PARITY=1` and `RUN_PARITY_TESTS=1`
- Browser loader no longer fetches from `public/` - shows friendly error instead

## Reference Data Location

For local development, place reference files in:

```
.local/reference/
├── reference_latest_snapshot.json
├── reference_backtest.csv
└── reference_states.csv
```

Or set `GHOSTREGIME_REFERENCE_DATA_DIR` to a custom path.
