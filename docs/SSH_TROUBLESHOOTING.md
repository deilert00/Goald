# SSH Troubleshooting: `Permission denied (publickey)` on Windows

This guide resolves the most common cause of:

```
$ ssh -T git@github.com
git@github.com: Permission denied (publickey).
```

on Windows when cloning or pushing to the `deilert00/Goald` repository.

---

## Quick-start checklist

1. [ ] Run `ssh -vvv git@github.com` and note **which key file** is being offered
2. [ ] Confirm the matching public key is uploaded to **your** GitHub account
3. [ ] If you have multiple keys, create or update `~/.ssh/config` with an explicit `IdentityFile` entry
4. [ ] If SSH cannot be made to work, use the **HTTPS + PAT fallback** described at the bottom

---

## 1. Check which key is being offered

Run the following in **Git Bash** or **PowerShell**:

```powershell
ssh -vvv git@github.com 2>&1 | Select-String -Pattern "Offering|identity|Authentications"
```

Or in **Git Bash / WSL**:

```bash
ssh -vvv git@github.com 2>&1 | grep -E "Offering|identity|Authentications"
```

Key lines to look for in the verbose output:

```
debug1: Trying private key: C:\Users\<you>\.ssh\id_ed25519
debug1: Offering public key: C:\Users\<you>\.ssh\id_rsa
debug1: Authentications that can continue: publickey
```

- **`Offering public key`** — the key currently being tried
- **`Authentications that can continue: publickey`** after the offer means the server rejected it

If no key is being offered at all, SSH cannot find any key — skip to [Step 3](#3-multiple-keys-and-ssh-config).

---

## 2. Verify the public key is on the correct GitHub account

### 2a. Find your public key fingerprint

```powershell
# Git Bash / WSL
ssh-keygen -lf ~/.ssh/id_ed25519.pub

# PowerShell (adjust filename if you use id_rsa or another key)
ssh-keygen -lf "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

Expected output format:

```
256 SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx your@email.com (ED25519)
```

### 2b. Compare with keys on GitHub

1. Go to <https://github.com/settings/keys>
2. For each key listed, GitHub shows only the fingerprint (not the full public key)
3. Compare the `SHA256:…` portion with the fingerprint printed above

If the fingerprint is **not** in the list, add the public key:

```powershell
# Print the public key to paste into GitHub
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"

# Or in Git Bash / WSL
cat ~/.ssh/id_ed25519.pub
```

Then:

1. Go to <https://github.com/settings/keys> → **New SSH key**
2. Set **Title** to something recognisable (e.g. `Work laptop – Windows`)
3. Paste the entire `ssh-ed25519 AAAA… your@email.com` string into **Key**
4. Click **Add SSH key**

Re-test:

```bash
ssh -T git@github.com
# Expected: Hi <username>! You've successfully authenticated…
```

---

## 3. Multiple keys and `~/.ssh/config`

When you have more than one key pair (personal, work, client, etc.) SSH may offer the wrong one.
The fix is a `Host` block in `~/.ssh/config` that pins the identity file.

### 3a. Open (or create) the config file

```powershell
# PowerShell
notepad "$env:USERPROFILE\.ssh\config"
```

```bash
# Git Bash / WSL
nano ~/.ssh/config
```

If the `.ssh` directory does not exist yet, create it first:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.ssh"
```

### 3b. Add a `Host github.com` block

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

> **`IdentitiesOnly yes`** is important — it prevents SSH from trying keys from an SSH agent
> that belong to a different account.

Replace `id_ed25519` with the actual filename of your private key if it differs
(e.g. `id_rsa`, `id_ed25519_work`, etc.).

### 3c. Multiple GitHub accounts (personal + work)

If you need to switch between two GitHub accounts, use separate hostnames:

```
# Personal account
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work account — use as: git@github-work:org/repo.git
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

Clone with the work alias:

```bash
git clone git@github-work:deilert00/Goald.git
```

Update an existing remote:

```bash
git remote set-url origin git@github-work:deilert00/Goald.git
```

---

## 4. Reading `ssh -vvv` output

Below is a **minimal annotated example** of a successful and a failing handshake.

### Successful authentication

```
debug1: Connecting to github.com [140.82.121.4] port 22.
debug1: Connection established.
debug1: Offering public key: /c/Users/you/.ssh/id_ed25519 ED25519 SHA256:xxx
debug1: Server accepts key: /c/Users/you/.ssh/id_ed25519 ED25519 SHA256:xxx  ← key accepted
debug1: Authentication succeeded (publickey).
```

### Failing authentication (wrong key offered)

```
debug1: Offering public key: /c/Users/you/.ssh/id_rsa RSA SHA256:yyy
debug1: Authentications that can continue: publickey   ← key rejected
debug1: No more authentication methods to try.
git@github.com: Permission denied (publickey).
```

**What to do:**
- Look at the `Offering public key:` filename — add that public key to GitHub, **or**
- Add an `IdentityFile` line in `~/.ssh/config` pointing at the correct key

### Failing authentication (no key found)

```
debug1: No more authentication methods to try.
git@github.com: Permission denied (publickey).
```

Without any `Offering` line, SSH found no key to try.

**What to do:**
- Generate a key: `ssh-keygen -t ed25519 -C "your@email.com"`
- Add it to GitHub (see [Step 2](#2-verify-the-public-key-is-on-the-correct-github-account))

### Agent not running (Windows)

```
debug1: No identities.
```

OpenSSH agent may not be running. Start it once, or start it automatically:

```powershell
# Start agent for this session
Start-Service ssh-agent

# Or start on boot (run as Administrator)
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent

# Add your key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

---

## 5. HTTPS + Personal Access Token (PAT) fallback

If SSH cannot be resolved, use HTTPS with a PAT instead.

### 5a. Generate a PAT

1. Go to <https://github.com/settings/tokens/new>
2. Set an **Expiration** (e.g. 90 days)
3. Select scope: **`repo`** (full control of private repositories)
4. Click **Generate token** and copy the value — you will not see it again

### 5b. Configure the remote to use HTTPS

```bash
# Check current remote URL
git remote -v

# Switch from SSH to HTTPS
git remote set-url origin https://github.com/deilert00/Goald.git
```

### 5c. Store credentials so you are not prompted every push

**Option A — Git Credential Manager (recommended, see Section 6)**

**Option B — credential in URL (less secure, fine for CI):**

```bash
git remote set-url origin https://<username>:<PAT>@github.com/deilert00/Goald.git
```

> ⚠️ Never commit a URL that contains a PAT to a public repository.

**Option C — store in Git credential helper:**

```bash
git config --global credential.helper store
# Then perform any authenticated operation; Git will prompt once and store the token
git fetch origin
```

Credentials are saved in `~/.git-credentials` in plain text. Use the credential manager for
better security.

---

## 6. Git Credential Manager (GCM)

Git for Windows ships with **Git Credential Manager** (GCM). It stores tokens in the Windows
Credential Store (encrypted) and supports OAuth browser flows.

### Check if GCM is active

```bash
git config --global credential.helper
# Expected output: manager   (or manager-core on older installations)
```

### Configure GCM

```bash
git config --global credential.helper manager
```

### Authenticate

Simply run any `git` command that needs credentials (clone, fetch, push). GCM will open a browser
window and ask you to authorise the GitHub app. After that, credentials are cached automatically.

### Clear cached credentials (force re-authentication)

```powershell
# Remove stored GitHub credential from the Windows Credential Store
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```

Or via **Credential Manager** in Control Panel → Windows Credentials → remove any `git:https://github.com` entry.

---

## 7. Helper script: `scripts/check-ssh.ps1`

A convenience PowerShell script is included at `scripts/check-ssh.ps1`.
Run it in PowerShell (no admin required):

```powershell
.\scripts\check-ssh.ps1
```

The script:
1. Lists all public keys in `~/.ssh/`
2. Prints the fingerprint of each key
3. Tests the connection with `ssh -T git@github.com` using any `Host github.com` entry in your config
4. Prints a summary and next-step hints

---

## See also

- [GitHub Docs – Generating a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [GitHub Docs – Adding a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
- [GitHub Docs – Testing your SSH connection](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
