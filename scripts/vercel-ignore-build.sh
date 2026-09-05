#!/usr/bin/env bash
# Conservative Vercel Ignored Build Step for Ghost Allocator.
#
# Expected Vercel command when Root Directory is repository root:
#   bash scripts/vercel-ignore-build.sh
#
# Contract:
#   exit 0 = SKIP
#   exit 1 = BUILD
#
# Any uncertainty must BUILD.

set -u

echo "[vercel-ignore] evaluating Ghost Allocator changed paths"

HEAD_SHA="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [[ -z "${BASE_SHA}" ]]; then
  echo "[vercel-ignore] BUILD: VERCEL_GIT_PREVIOUS_SHA is unavailable"
  exit 1
fi

if ! git cat-file -e "${BASE_SHA}^{commit}" 2>/dev/null; then
  echo "[vercel-ignore] BUILD: previous deployment SHA is not available in Git history"
  exit 1
fi

if ! git cat-file -e "${HEAD_SHA}^{commit}" 2>/dev/null; then
  echo "[vercel-ignore] BUILD: deploying SHA is not available in Git history"
  exit 1
fi

# Disable rename detection so a runtime -> allowlisted move exposes both
# the deleted runtime path and the added destination path.
CHANGED_FILES="$(git diff --no-renames --name-only "${BASE_SHA}" "${HEAD_SHA}" -- 2>/dev/null)"
DIFF_STATUS=$?

if [[ ${DIFF_STATUS} -ne 0 ]]; then
  echo "[vercel-ignore] BUILD: git diff failed"
  exit 1
fi

if [[ -z "${CHANGED_FILES}" ]]; then
  echo "[vercel-ignore] BUILD: no trustworthy changed-file set was produced"
  exit 1
fi

echo "[vercel-ignore] changed files:"
printf '%s\n' "${CHANGED_FILES}" | sed 's/^/  - /'

while IFS= read -r file; do
  [[ -z "${file}" ]] && continue

  case "${file}" in
    # Markdown anywhere under docs/. In bash case patterns, * can span '/'.
    # Non-Markdown docs files (CSV, JSON, etc.) fall through to BUILD.
    docs/*.md)
      ;;
    README.md)
      ;;
    LICENSE)
      ;;
    reports/*)
      ;;
    .github/workflows/*)
      ;;
    .cursor/rules/*)
      ;;
    *)
      echo "[vercel-ignore] BUILD: unapproved or build-relevant path: ${file}"
      exit 1
      ;;
  esac
done <<< "${CHANGED_FILES}"

echo "[vercel-ignore] SKIP: every changed file is in the approved V1 non-runtime allowlist"
exit 0
