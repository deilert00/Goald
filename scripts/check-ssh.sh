#!/usr/bin/env bash
# scripts/check-ssh.sh
#
# Verifies that SSH authentication to GitHub is working and reports which
# account is active.  Also checks whether the current repository remote
# uses SSH or HTTPS and offers to switch.
#
# Usage:
#   bash scripts/check-ssh.sh
#
# Exit codes:
#   0  SSH authentication successful
#   1  SSH authentication failed or prerequisite missing

set -euo pipefail

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✔${RESET}  $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
err()  { echo -e "${RED}✖${RESET}  $*"; }
info() { echo -e "${CYAN}ℹ${RESET}  $*"; }
header() { echo -e "\n${BOLD}$*${RESET}"; }

# ── 1. Check prerequisites ────────────────────────────────────────────────────
header "1. Checking prerequisites"

if ! command -v ssh &>/dev/null; then
  err "ssh not found. Install OpenSSH and re-run."
  exit 1
fi
ok "ssh is installed ($(ssh -V 2>&1 | head -1))"

if ! command -v git &>/dev/null; then
  err "git not found. Install Git and re-run."
  exit 1
fi
ok "git is installed ($(git --version))"

# ── 2. Check loaded SSH keys ──────────────────────────────────────────────────
header "2. Loaded SSH keys"

if ! ssh-add -l &>/dev/null; then
  warn "No identities loaded in the SSH agent."
  info "Add your key with:  ssh-add ~/.ssh/id_ed25519"
  info "(If the agent is not running:  eval \"\$(ssh-agent -s)\" then ssh-add)"
else
  ssh-add -l | while IFS= read -r line; do
    ok "$line"
  done
fi

# ── 3. Test SSH connection to GitHub ─────────────────────────────────────────
header "3. Testing SSH connection to GitHub"

# ssh -T exits with code 1 even on success ("no shell access"), so we capture
# the output and check the content instead.
SSH_OUTPUT=$(ssh -T git@github.com 2>&1) || true

if echo "$SSH_OUTPUT" | grep -q "successfully authenticated"; then
  GITHUB_USER=$(echo "$SSH_OUTPUT" | sed -n 's/Hi \([^!]*\)!.*/\1/p')
  ok "Authenticated to GitHub as: ${BOLD}${GITHUB_USER}${RESET}"
  echo ""
  info "Verify this is the account you expect."
  info "If the wrong user appears, see docs/SSH_GITHUB_SETUP.md → 'Wrong account is authenticated'."
else
  err "SSH authentication to GitHub failed."
  echo ""
  echo "  Output: ${SSH_OUTPUT}"
  echo ""
  info "Steps to fix:"
  info "  1. Make sure your public key is added to github.com/settings/keys"
  info "  2. Add your key to the agent:  ssh-add ~/.ssh/id_ed25519"
  info "  3. For detailed guidance:  docs/SSH_GITHUB_SETUP.md"
  exit 1
fi

# ── 4. Check remote URL for this repo ────────────────────────────────────────
header "4. Checking repository remote URL"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)

if [[ -z "$REPO_ROOT" ]]; then
  warn "Not inside a Git repository — skipping remote URL check."
else
  REMOTE_URL=$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null || echo "")

  if [[ -z "$REMOTE_URL" ]]; then
    warn "No 'origin' remote configured."
  elif echo "$REMOTE_URL" | grep -q "^git@"; then
    ok "Remote 'origin' is already using SSH: ${REMOTE_URL}"
  elif echo "$REMOTE_URL" | grep -q "^https://"; then
    warn "Remote 'origin' is using HTTPS: ${REMOTE_URL}"
    echo ""
    info "Switch to SSH with:"
    # Derive SSH URL from HTTPS URL (handles github.com/org/repo.git patterns)
    SSH_EQUIVALENT=$(echo "$REMOTE_URL" \
      | sed 's|https://github.com/|git@github.com:|')
    info "  git remote set-url origin ${SSH_EQUIVALENT}"
  else
    info "Remote 'origin' URL: ${REMOTE_URL}"
  fi
fi

# ── 5. Summary ────────────────────────────────────────────────────────────────
header "5. Summary"
ok "SSH setup looks good."
info "For full setup instructions and troubleshooting, see:"
info "  docs/SSH_GITHUB_SETUP.md"
