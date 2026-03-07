# GitHub SSH Public Key Authentication — Windows Troubleshooting Guide

This guide helps Windows users diagnose and fix SSH public-key authentication failures
when connecting to GitHub (`git clone`, `git push`, `git pull`, etc.).
It covers key generation, ssh-agent setup, uploading the public key to GitHub, the
`~/.ssh/config` file, handling multiple keys, verbose debug output, and a
Personal Access Token (PAT) fallback for when SSH is not viable.

---

## Quick-Start Checklist

Run through these steps in order. Each step has a dedicated section below.

1. [Verify your SSH key pair exists](#1-verify-your-ssh-key-pair-exists)
2. [Start ssh-agent and add your key](#2-start-ssh-agent-and-add-your-key)
3. [Copy the public key to GitHub](#3-copy-the-public-key-to-github)
4. [Check (or create) your `~/.ssh/config`](#4-check-or-create-your-sshconfig)
5. [Handle multiple SSH keys](#5-handle-multiple-ssh-keys)
6. [Run a verbose connectivity test](#6-run-a-verbose-connectivity-test)
7. [PAT fallback (HTTPS authentication)](#7-pat-fallback-https-authentication)

---

## 1. Verify Your SSH Key Pair Exists

Open **Git Bash**, **Windows Terminal**, or **PowerShell** and run:

```powershell
ls "$env:USERPROFILE\.ssh"
# Git Bash / WSL equivalent:
ls ~/.ssh
```

You should see at least one key pair, e.g. `id_ed25519` + `id_ed25519.pub`
(or `id_rsa` + `id_rsa.pub`).

### Generate a new key if none exists

```bash
# Recommended: Ed25519 key (modern, fast, compact)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Legacy fallback: RSA 4096-bit key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

Accept the default path (`~/.ssh/id_ed25519`) or choose a custom path.
**Set a passphrase** — it protects the key if your machine is compromised.

After generation confirm the files exist:

```bash
ls ~/.ssh
# Expected:
#   id_ed25519      ← private key (keep secret, never share)
#   id_ed25519.pub  ← public key  (this is what you upload to GitHub)
```

---

## 2. Start ssh-agent and Add Your Key

On Windows, ssh-agent must be running **and** your key must be loaded before SSH
connections to GitHub will succeed.

### Option A — Git Bash (easiest)

Git Bash ships with a helper. Add the following to `~/.bashrc` (or `~/.bash_profile`)
so it runs automatically in every new terminal:

```bash
# ~/.bashrc  — auto-start ssh-agent and load the default key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

To apply immediately without restarting your terminal:

```bash
source ~/.bashrc
```

### Option B — PowerShell (Windows built-in OpenSSH)

Run PowerShell **as Administrator** once to enable the service:

```powershell
# Enable and start the OpenSSH Authentication Agent service
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service  ssh-agent

# Add your key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

Verify it loaded:

```powershell
ssh-add -l
# Expected: fingerprint + key path
# "The agent has no identities" means the key was NOT added.
```

### Option C — WSL (Windows Subsystem for Linux)

Inside your WSL distribution, treat it like Linux:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

> **Tip:** If you keep your keys in the Windows filesystem (`/mnt/c/Users/<name>/.ssh/`),
> WSL requires permissions `600` on the private key:
>
> ```bash
> chmod 600 /mnt/c/Users/<YourName>/.ssh/id_ed25519
> ```

---

## 3. Copy the Public Key to GitHub

### Step 1 — Print your public key

```bash
# Git Bash / WSL
cat ~/.ssh/id_ed25519.pub

# PowerShell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

The output looks like:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... your_email@example.com
```

Copy the **entire line** including the `ssh-ed25519` prefix and the comment at the end.

### Step 2 — Add the key on GitHub

1. Go to **GitHub → Settings → SSH and GPG keys**
   (direct link: <https://github.com/settings/keys>)
2. Click **New SSH key**.
3. Give it a recognizable **Title** (e.g. `Work laptop – Ed25519 2025`).
4. Paste the public key text into the **Key** field.
5. Click **Add SSH key** and confirm with your GitHub password if prompted.

### Verify the key is recognized

```bash
ssh -T git@github.com
# Success: Hi <username>! You've successfully authenticated…
# Failure: Permission denied (publickey).
```

---

## 4. Check (or Create) Your `~/.ssh/config`

The config file tells SSH which key to use for which host.

### View the current config

```bash
cat ~/.ssh/config
# PowerShell:
Get-Content "$env:USERPROFILE\.ssh\config"
```

### Minimal config for GitHub

If the file does not exist (or is missing a `github.com` entry), create/edit it:

```
# ~/.ssh/config
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    IdentitiesOnly yes
```

`IdentitiesOnly yes` prevents SSH from trying every key in the agent — useful when
you have many keys and GitHub rejects connections after too many failed attempts.

> **Windows path note:** In Git Bash and WSL, `~` expands to the correct home
> directory. In native PowerShell use the full path:
> `C:/Users/<YourName>/.ssh/id_ed25519` (forward slashes work in OpenSSH on Windows).

### Fix file permissions (Git Bash / WSL)

SSH refuses to use keys or config files that are world-readable:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

On Windows with native OpenSSH, right-click the private key file → **Properties →
Security** → ensure only your user account has access (remove `SYSTEM`, `Administrators`
entries if SSH complains about permissions).

---

## 5. Handle Multiple SSH Keys

If you have keys for different GitHub accounts (personal vs. work) or other services,
use `Host` aliases in `~/.ssh/config`:

```
# Personal GitHub account
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes
    AddKeysToAgent yes

# Work GitHub account
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
    AddKeysToAgent yes
```

When cloning or adding a remote, replace `github.com` with the alias:

```bash
# Personal repo
git clone git@github-personal:personal-org/repo.git

# Work repo
git clone git@github-work:work-org/repo.git

# Update an existing remote to use the alias
git remote set-url origin git@github-work:work-org/Goald.git
```

Verify each alias independently:

```bash
ssh -T git@github-personal
ssh -T git@github-work
```

### List all keys currently loaded in the agent

```bash
ssh-add -l
```

### Remove all keys and re-add only the one you need

```bash
ssh-add -D                       # remove all
ssh-add ~/.ssh/id_ed25519_work   # add specific key
```

---

## 6. Run a Verbose Connectivity Test

When `ssh -T git@github.com` fails, add verbosity flags to see exactly where it
breaks down:

```bash
# Level 1 — basic handshake info
ssh -v git@github.com

# Level 2 — key negotiation details
ssh -vv git@github.com

# Level 3 — maximum verbosity (full packet trace)
ssh -vvv git@github.com
```

### What to look for in the output

| Log line | Meaning |
|----------|---------|
| `Connecting to github.com … port 22` | Network connection established |
| `Server host key: …` | GitHub's host key received |
| `Offering public key: ~/.ssh/id_ed25519` | SSH is trying your key |
| `Authenticated to github.com` | ✅ Success |
| `Permission denied (publickey)` | Key not accepted — check steps 2–4 |
| `Connection refused` | Port 22 is blocked — try port 443 (see below) |
| `No more authentication methods` | Agent has no keys loaded — see step 2 |

### Fallback: SSH over HTTPS port 443

Corporate firewalls often block port 22. GitHub supports SSH over port 443:

```
# ~/.ssh/config
Host github.com
    HostName ssh.github.com
    Port 443
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Test it:

```bash
ssh -T -p 443 git@ssh.github.com
```

---

## 7. PAT Fallback (HTTPS Authentication)

If SSH cannot be made to work (strict corporate proxy, managed device policy, etc.),
you can authenticate over HTTPS using a **Personal Access Token (PAT)** instead.

### Create a PAT on GitHub

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
   (direct link: <https://github.com/settings/tokens>)
2. Click **Generate new token (classic)**.
3. Set an **Expiration** (90 days is a reasonable default).
4. Select scopes:
   - `repo` — full repository access (required for private repos)
   - `workflow` — if you trigger GitHub Actions via `git push`
5. Click **Generate token** and **copy it immediately** — GitHub shows it only once.

### Use the PAT as your Git password

When prompted for credentials, enter:
- **Username:** your GitHub username
- **Password:** the PAT (not your GitHub account password)

### Store the PAT in Git Credential Manager (recommended)

Windows ships with **Git Credential Manager (GCM)**, which securely stores tokens in
the Windows Credential Store so you are not prompted every time:

```bash
# Confirm GCM is configured (should already be set by Git for Windows)
git config --global credential.helper
# Expected: manager  (or  manager-core  on older versions)

# Clone a repo — you will be prompted once, then GCM caches the token
git clone https://github.com/deilert00/Goald.git
```

To update or clear a stored credential:

```powershell
# Remove a cached GitHub credential (forces re-prompt on next use)
git credential reject << EOF
protocol=https
host=github.com
EOF
```

Or open **Control Panel → Credential Manager → Windows Credentials** and remove the
`git:https://github.com` entry.

### Switch an existing repo from SSH to HTTPS

```bash
# Check current remote
git remote -v

# Switch to HTTPS
git remote set-url origin https://github.com/deilert00/Goald.git

# Verify
git remote -v
```

### Switch back from HTTPS to SSH (once SSH is working)

```bash
git remote set-url origin git@github.com:deilert00/Goald.git
```

---

## Common Error Reference

| Error message | Likely cause | Fix |
|---------------|--------------|-----|
| `Permission denied (publickey)` | Key not on GitHub or not in agent | Steps 2–3 |
| `The agent has no identities` | Key not added to ssh-agent | Step 2 |
| `Bad permissions` / `WARNING: UNPROTECTED PRIVATE KEY FILE` | Key file permissions too open | Step 4 |
| `Connection refused (port 22)` | Firewall blocking SSH port | Step 6 — port 443 fallback |
| `Host key verification failed` | `~/.ssh/known_hosts` stale entry | `ssh-keygen -R github.com` then retry |
| `Could not resolve hostname github.com` | DNS / network issue | Check network; verify proxy settings |
| `sign_and_send_pubkey: signing failed` | Hardware key or passphrase issue | Re-add key: `ssh-add ~/.ssh/id_ed25519` |

---

## See Also

- [GitHub Docs — Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Docs — Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [OpenSSH for Windows — Microsoft Docs](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
