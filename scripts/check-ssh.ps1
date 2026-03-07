<#
.SYNOPSIS
    Diagnose common SSH authentication issues with github.com on Windows.

.DESCRIPTION
    This script helps resolve "Permission denied (publickey)" errors when
    running `ssh -T git@github.com`.  It:
      1. Lists public keys found in ~/.ssh/
      2. Prints the SHA-256 fingerprint of each key
      3. Checks whether an ssh-agent is running and which keys it holds
      4. Verifies that ~/.ssh/config contains a Host github.com block
      5. Runs `ssh -T git@github.com` and reports the result
      6. Prints next-step suggestions based on the findings

.NOTES
    Run from any PowerShell prompt — administrator rights are NOT required.
    For full verbose SSH output run:  ssh -vvv git@github.com
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Write-Header([string]$text) {
    Write-Host ""
    Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Write-Ok([string]$text)   { Write-Host "  [OK]  $text" -ForegroundColor Green }
function Write-Warn([string]$text) { Write-Host "  [!!]  $text" -ForegroundColor Yellow }
function Write-Info([string]$text) { Write-Host "  [--]  $text" -ForegroundColor Gray }
function Write-Fail([string]$text) { Write-Host "  [XX]  $text" -ForegroundColor Red }

# ---------------------------------------------------------------------------
# 1. Locate public keys
# ---------------------------------------------------------------------------

Write-Header "Public keys in ~/.ssh/"

$sshDir = Join-Path $env:USERPROFILE ".ssh"

if (-not (Test-Path $sshDir)) {
    Write-Fail "Directory $sshDir does not exist."
    Write-Warn "Run: ssh-keygen -t ed25519 -C `"your@email.com`" to generate a key."
    exit 1
}

$pubKeys = Get-ChildItem -Path $sshDir -Filter "*.pub" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike "known_hosts*" }

if ($pubKeys.Count -eq 0) {
    Write-Fail "No public key files (*.pub) found in $sshDir"
    Write-Warn "Generate one with: ssh-keygen -t ed25519 -C `"your@email.com`""
    exit 1
}

$fingerprintMap = @{}
foreach ($key in $pubKeys) {
    Write-Info "Found: $($key.Name)"
    try {
        $fp = & ssh-keygen -lf $key.FullName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "  Fingerprint: $fp"
            $fingerprintMap[$key.FullName] = $fp
        }
        else {
            Write-Warn "  Could not read fingerprint for $($key.Name): $fp"
        }
    }
    catch {
        Write-Warn "  ssh-keygen not available or failed: $_"
    }
}

Write-Info ""
Write-Info "Compare these fingerprints against https://github.com/settings/keys"
Write-Info "The fingerprint you see there must match one of the values above."

# ---------------------------------------------------------------------------
# 2. SSH agent status
# ---------------------------------------------------------------------------

Write-Header "SSH agent"

$agentService = Get-Service -Name ssh-agent -ErrorAction SilentlyContinue
if ($null -eq $agentService) {
    Write-Warn "ssh-agent service not found. OpenSSH may not be installed."
    Write-Info "Install via: Settings > Apps > Optional features > OpenSSH Client"
}
elseif ($agentService.Status -ne 'Running') {
    Write-Warn "ssh-agent service is not running (Status: $($agentService.Status))"
    Write-Info "Start it with: Start-Service ssh-agent"
    Write-Info "Auto-start:    Set-Service -Name ssh-agent -StartupType Automatic"
}
else {
    Write-Ok "ssh-agent is running."

    # List keys loaded in the agent
    $agentKeys = & ssh-add -l 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Keys loaded in agent:"
        $agentKeys | ForEach-Object { Write-Info "  $_" }
    }
    elseif ($agentKeys -match "no identities") {
        Write-Warn "No keys are loaded in ssh-agent."
        Write-Info "Add your key with: ssh-add `"$sshDir\id_ed25519`""
    }
    else {
        Write-Warn "Could not list agent keys: $agentKeys"
    }
}

# ---------------------------------------------------------------------------
# 3. Check ~/.ssh/config for a github.com Host block
# ---------------------------------------------------------------------------

Write-Header "~/.ssh/config"

$configPath = Join-Path $sshDir "config"

if (-not (Test-Path $configPath)) {
    Write-Warn "No ~/.ssh/config file found."
    Write-Info "Create one at: $configPath"
    Write-Info "Recommended content:"
    Write-Info ""
    Write-Info "  Host github.com"
    Write-Info "      HostName github.com"
    Write-Info "      User git"
    Write-Info "      IdentityFile ~/.ssh/id_ed25519"
    Write-Info "      IdentitiesOnly yes"
}
else {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "(?mi)^\s*Host\s+github\.com") {
        Write-Ok "Found a 'Host github.com' block in $configPath"

        # Extract and display the IdentityFile value if present
        if ($configContent -match "(?mi)IdentityFile\s+(.+)") {
            $identityFile = $Matches[1].Trim()
            Write-Info "IdentityFile configured: $identityFile"

            # Expand ~ to $HOME
            $expanded = $identityFile -replace "^~", $env:USERPROFILE
            if (Test-Path $expanded) {
                Write-Ok "Key file exists: $expanded"
            }
            else {
                Write-Fail "Key file does NOT exist: $expanded"
                Write-Warn "Generate it with: ssh-keygen -t ed25519 -f `"$expanded`" -C `"your@email.com`""
            }
        }
        else {
            Write-Warn "No IdentityFile line found in the github.com Host block."
            Write-Info "Add one to pin which key is used, e.g.:"
            Write-Info "  IdentityFile ~/.ssh/id_ed25519"
        }

        if ($configContent -notmatch "(?mi)IdentitiesOnly\s+yes") {
            Write-Warn "IdentitiesOnly yes is missing — SSH may try keys from the agent for other accounts."
            Write-Info "Add 'IdentitiesOnly yes' under Host github.com to prevent this."
        }
    }
    else {
        Write-Warn "No 'Host github.com' block found in $configPath"
        Write-Info "Add the following block to $configPath :"
        Write-Info ""
        Write-Info "  Host github.com"
        Write-Info "      HostName github.com"
        Write-Info "      User git"
        Write-Info "      IdentityFile ~/.ssh/id_ed25519"
        Write-Info "      IdentitiesOnly yes"
    }
}

# ---------------------------------------------------------------------------
# 4. Test the SSH connection
# ---------------------------------------------------------------------------

Write-Header "SSH connection test (ssh -T git@github.com)"

Write-Info "Running ssh -T git@github.com  (may take a few seconds) ..."

$sshOutput = & ssh -T git@github.com 2>&1
$sshExitCode = $LASTEXITCODE

# GitHub returns exit code 1 even on a *successful* authentication, but it
# prints the "Hi <user>!" message in that case.
$successPattern = "Hi .+! You've successfully authenticated"

if ($sshOutput -match $successPattern) {
    Write-Ok "Authentication SUCCEEDED."
    Write-Ok "$sshOutput"
}
elseif ($sshOutput -match "Permission denied") {
    Write-Fail "Authentication FAILED: $sshOutput"
    Write-Info ""
    Write-Info "Next steps:"
    Write-Info "  1. Compare the fingerprints printed above with https://github.com/settings/keys"
    Write-Info "  2. If the key is missing, add it: https://github.com/settings/keys > New SSH key"
    Write-Info "  3. Add an IdentityFile entry to ~/.ssh/config (see above)"
    Write-Info "  4. For detailed diagnostics run: ssh -vvv git@github.com"
    Write-Info "  5. As a fallback, switch to HTTPS + PAT:"
    Write-Info "       git remote set-url origin https://github.com/deilert00/Goald.git"
    Write-Info "     Then configure Git Credential Manager:"
    Write-Info "       git config --global credential.helper manager"
}
else {
    Write-Warn "Unexpected output (exit code $sshExitCode): $sshOutput"
    Write-Info "Run 'ssh -vvv git@github.com' for detailed diagnostics."
}

# ---------------------------------------------------------------------------
# 5. HTTPS / PAT fallback reminder
# ---------------------------------------------------------------------------

Write-Header "HTTPS + PAT fallback"
Write-Info "If SSH cannot be resolved, switch to HTTPS:"
Write-Info "  git remote set-url origin https://github.com/deilert00/Goald.git"
Write-Info ""
Write-Info "Generate a PAT at: https://github.com/settings/tokens/new"
Write-Info "  - Expiration: 90 days"
Write-Info "  - Scope: repo"
Write-Info ""
Write-Info "Use Git Credential Manager (ships with Git for Windows) to store the token:"
Write-Info "  git config --global credential.helper manager"
Write-Info ""
Write-Info "Full troubleshooting guide: docs/SSH_TROUBLESHOOTING.md"
Write-Host ""

exit 0
