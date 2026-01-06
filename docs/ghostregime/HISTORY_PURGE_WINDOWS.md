# Git History Purge: Windows/PowerShell Runbook

## ⚠️ CRITICAL: Read Before Proceeding

This runbook provides **Windows/PowerShell-specific** commands for purging reference data files from git history. This is a **destructive operation** that rewrites git history.

**What gets purged:**
- `data/kiss/`
- `public/data/kiss/`
- `docs/KISS/`

## Prerequisites

### 1. Install git-filter-repo

Choose one of these installation methods:

**Option A: Using pipx (recommended)**
```powershell
# Install pipx if not already installed
python -m pip install --user pipx
python -m pipx ensurepath

# Install git-filter-repo
pipx install git-filter-repo
```

**Option B: Using pip**
```powershell
python -m pip install --user git-filter-repo
```

**Verify installation:**
```powershell
git filter-repo --version
```

### 2. Backup Your Repository

**⚠️ IMPORTANT: Always create a backup before rewriting history.**

```powershell
# Navigate to a safe location (e.g., Desktop or Documents)
cd $env:USERPROFILE\Desktop

# Clone a backup of your repo
git clone <your-repo-url> ghost-allocator-backup
```

## Step-by-Step Purge Process

### Step 1: Verify Current State

```powershell
# Navigate to your repo
cd C:\path\to\ghost-allocator

# Check if forbidden paths exist in working tree (should be empty)
git ls-files data/kiss docs/KISS public/data/kiss

# Check if forbidden paths exist in history (will show matches if they exist)
git log --all --full-history --oneline -- data/kiss/ public/data/kiss/ docs/KISS/
```

### Step 2: Create a Mirror Clone (Safe Workflow)

**⚠️ Use a mirror clone to avoid affecting your main working directory.**

```powershell
# Navigate to a safe location
cd $env:USERPROFILE\Desktop

# Create a bare mirror clone
git clone --mirror <your-repo-url> ghost-allocator-mirror.git

# Navigate into the mirror
cd ghost-allocator-mirror.git
```

### Step 3: Run git-filter-repo

**⚠️ This rewrites history. All collaborators will need to re-clone or hard reset.**

```powershell
# Purge reference data paths from history
git filter-repo --path data/kiss --path public/data/kiss --path docs/KISS --invert-paths
```

**What this does:**
- Removes all commits that touched files in these paths
- Rewrites history to exclude these paths completely
- Updates all commit hashes (history is rewritten)

### Step 4: Verify the Purge

```powershell
# Check that paths are gone from history
git log --all --full-history -- data/kiss/
git log --all --full-history -- public/data/kiss/
git log --all --full-history -- docs/KISS/
# Should show no results

# Verify with the verification script (if you have it)
cd C:\path\to\ghost-allocator
npm run check:no-reference-history
```

### Step 5: Force Push (Destructive)

**⚠️ WARNING: This will overwrite remote history. Coordinate with your team first.**

```powershell
# Still in the mirror clone directory
git push --force --mirror origin
```

**What this does:**
- Overwrites the remote repository with the cleaned history
- Updates all branches and tags
- **All collaborators must re-clone or hard reset**

### Step 6: Update Your Main Working Directory

After the force push, update your main working directory:

```powershell
# Navigate back to your main repo
cd C:\path\to\ghost-allocator

# Fetch the cleaned history
git fetch origin

# Hard reset to match remote (⚠️ This discards local changes)
git reset --hard origin/main

# Clean up any untracked files
git clean -fd
```

### Step 7: Notify Your Team

Anyone with an existing clone will need to re-clone or hard reset:

**Option A: Re-clone (safest)**
```powershell
cd C:\path\to
Remove-Item -Recurse -Force ghost-allocator
git clone <your-repo-url> ghost-allocator
```

**Option B: Hard reset (if they have no local changes)**
```powershell
cd C:\path\to\ghost-allocator
git fetch origin
git reset --hard origin/main
```

## Post-Purge Verification

Run the verification scripts:

```powershell
# Check working tree (should pass)
npm run check:no-reference-data

# Check git history (should pass after purge)
npm run check:no-reference-history

# Check for vendor naming (should pass)
npm run check:parity-names

# Run all checks together
npm run verify:reference-clean
```

All checks should pass after a successful purge.

## Troubleshooting

### "git filter-repo: command not found"

- Make sure you installed git-filter-repo (see Prerequisites)
- If using pip, you may need to add Python Scripts to your PATH:
  ```powershell
  $env:Path += ";$env:USERPROFILE\AppData\Roaming\Python\Python3XX\Scripts"
  ```

### "fatal: not a git repository"

- Make sure you're in the mirror clone directory (ends with `.git`)
- Or navigate to your main repo directory

### "error: failed to push some refs"

- Make sure you have write access to the repository
- Check that you're pushing to the correct remote
- Coordinate with your team before force pushing

### History still shows files after purge

- Make sure you ran `git filter-repo` with all three paths
- Verify with `git log --all --full-history -- data/kiss/`
- Re-run the verification script: `npm run check:no-reference-history`

## Alternative: Using the Main Repo (Not Recommended)

If you must work directly in your main repo (not recommended):

```powershell
# Navigate to your repo
cd C:\path\to\ghost-allocator

# Purge history
git filter-repo --path data/kiss --path public/data/kiss --path docs/KISS --invert-paths

# Force push
git push --force --prune origin main
git push --force --tags
```

**⚠️ Warning:** This modifies your working directory. Use the mirror clone workflow instead.

## Summary

1. ✅ Install git-filter-repo
2. ✅ Create backup clone
3. ✅ Create mirror clone
4. ✅ Run git-filter-repo with `--invert-paths`
5. ✅ Verify purge worked
6. ✅ Force push with `--mirror`
7. ✅ Update main working directory
8. ✅ Notify team
9. ✅ Run verification scripts

## Reference

- Original purge doc: `docs/ghostregime/GIT_HISTORY_PURGE.md`
- Verification scripts: `npm run verify:reference-clean`
- Guardrail scripts: `npm run check:no-reference-data`, `npm run check:no-reference-history`
