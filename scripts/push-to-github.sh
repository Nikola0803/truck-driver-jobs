#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Run this locally (in Git Bash / WSL / any terminal with git)
#
# Before running:
#   1. Go to https://github.com/new
#   2. Create a repo named: truck-driver-jobs   (private or public, your choice)
#   3. Do NOT initialize with README/gitignore
#   4. Copy the repo URL (e.g. https://github.com/yourname/truck-driver-jobs.git)
#   5. Paste it below as REPO_URL
# ─────────────────────────────────────────────────────────────────────────────

REPO_URL="https://github.com/Nikola0803/truck-driver-jobs.git"

# ── Safety check ─────────────────────────────────────────────────────────────
if [[ "$REPO_URL" == *"YOUR_USERNAME"* ]]; then
  echo "❌  Edit REPO_URL in this script first (line 14)"
  exit 1
fi

set -e

echo ""
echo "🚀  Pushing TruckDriverJobs to GitHub..."
echo ""

# Init git if not already done
if [ ! -d ".git" ]; then
  git init
  echo "✅  Git initialized"
fi

# Set main branch
git branch -M main 2>/dev/null || true

# Stage everything
git add .
git status

echo ""
echo "📝  Creating initial commit..."
git commit -m "Initial commit — TruckDriverJobs.co" 2>/dev/null || echo "  (nothing new to commit)"

# Add remote if not set
if ! git remote get-url origin &>/dev/null; then
  git remote add origin "$REPO_URL"
  echo "✅  Remote added: $REPO_URL"
else
  git remote set-url origin "$REPO_URL"
  echo "✅  Remote updated: $REPO_URL"
fi

# Push
echo ""
echo "⬆️   Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅  Done! Your code is on GitHub."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NEXT: SSH into your VPS and run:"
echo "  bash <(curl -s https://raw.githubusercontent.com/YOUR_USERNAME/truck-driver-jobs/main/scripts/setup-vps.sh)"
echo ""
echo "  OR upload scripts/setup-vps.sh to the VPS and run: bash setup-vps.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
