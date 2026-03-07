# GitHub SSH Authentication Setup

This guide covers generating an SSH key, adding it to your GitHub account, verifying the
correct account is active, and using a Personal Access Token (PAT) as a fallback.

---

## Table of Contents

1. [Why SSH?](#why-ssh)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Generate an SSH Key Pair](#step-1--generate-an-ssh-key-pair)
4. [Step 2 — Add the Public Key to GitHub](#step-2--add-the-public-key-to-github)
5. [Step 3 — Verify the SSH Connection](#step-3--verify-the-ssh-connection)
6. [Step 4 — Configure Git to Use SSH](#step-4--configure-git-to-use-ssh)
7. [PAT Fallback (HTTPS Authentication)](#pat-fallback-https-authentication)
8. [Troubleshooting](#troubleshooting)
   - [Settings shows an empty SSH key list](#settings-shows-an-empty-ssh-key-list)
   - [Permission denied (publickey)](#permission-denied-publickey)
   - [Wrong account is authenticated](#wrong-account-is-authenticated)
   - [Organization SSO restrictions](#organization-sso-restrictions)

---

## Why SSH?

SSH key authentication avoids entering a username and password on every `git push`/`git pull`.
Unlike HTTPS with a cached password, SSH keys are tied to a specific machine and revocable
individually from your GitHub account settings.

---

## Prerequisites

- Git installed locally (`git --version`)
- OpenSSH installed (`ssh -V`) — ships with macOS, modern Windows (OpenSSH optional feature),
  and all major Linux distributions
- A GitHub account

---

## Step 1 — Generate an SSH Key Pair

Open a terminal and run:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

> **Note:** Replace `your_email@example.com` with the email address associated with your
> GitHub account. This comment is embedded in the key for identification purposes only.

When prompted:

- **Enter file in which to save the key:** press **Enter** to accept the default
  (`~/.ssh/id_ed25519`), or type a custom path.
- **Enter passphrase:** choose a strong passphrase (recommended) or press **Enter** for none.

<!-- Screenshot placeholder: terminal output showing the key fingerprint and randomart image -->
<!-- ![SSH keygen output](../assets/screenshots/ssh-keygen-output.png) -->

This creates two files:

| File | Purpose |
|---|---|
| `~/.ssh/id_ed25519` | **Private key** — never share this |
| `~/.ssh/id_ed25519.pub` | **Public key** — this is what you add to GitHub |

### Add the key to the SSH agent

Start the agent and add your new private key so it is available in the current session:

```bash
# macOS / Linux
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

```powershell
# Windows (PowerShell, OpenSSH service must be running)
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

---

## Step 2 — Add the Public Key to GitHub

1. Copy your public key to the clipboard:

   ```bash
   # macOS
   pbcopy < ~/.ssh/id_ed25519.pub

   # Linux (xclip)
   xclip -selection clipboard < ~/.ssh/id_ed25519.pub

   # Windows (PowerShell)
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
   ```

   Or print it and copy manually:

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. Open GitHub in a browser and sign in with your **personal account** (see
   [Wrong account is authenticated](#wrong-account-is-authenticated) if you are unsure).

3. Navigate to **Settings → SSH and GPG keys**:

   ```
   https://github.com/settings/keys
   ```

   <!-- Screenshot placeholder: GitHub Settings → SSH and GPG keys page (empty state) -->
   <!-- ![GitHub SSH keys page — empty](../assets/screenshots/github-ssh-keys-empty.png) -->

4. Click **New SSH key**.

   <!-- Screenshot placeholder: "New SSH key" button highlighted -->
   <!-- ![New SSH key button](../assets/screenshots/github-new-ssh-key-button.png) -->

5. Fill in the form:

   | Field | Value |
   |---|---|
   | **Title** | A descriptive name, e.g. `Work MacBook 2025` |
   | **Key type** | `Authentication Key` (default) |
   | **Key** | Paste the entire contents of `id_ed25519.pub` |

   <!-- Screenshot placeholder: Add SSH key form filled in -->
   <!-- ![Add SSH key form](../assets/screenshots/github-add-ssh-key-form.png) -->

6. Click **Add SSH key** and confirm with your GitHub password or passkey if prompted.

7. The key should now appear in the list under **Authentication keys**.

   <!-- Screenshot placeholder: SSH key successfully added to the list -->
   <!-- ![SSH key added successfully](../assets/screenshots/github-ssh-key-added.png) -->

---

## Step 3 — Verify the SSH Connection

Run the following command to test that GitHub accepts your key:

```bash
ssh -T git@github.com
```

Expected success output:

```
Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.
```

The username shown in `Hi <your-username>!` confirms **which GitHub account** the key is
linked to. If the wrong username appears, see
[Wrong account is authenticated](#wrong-account-is-authenticated).

You can also use the helper script included in this repository:

```bash
bash scripts/check-ssh.sh
```

---

## Step 4 — Configure Git to Use SSH

If you cloned the repository over HTTPS, switch the remote to SSH:

```bash
# Check current remote URL
git remote -v

# Switch to SSH
git remote set-url origin git@github.com:deilert00/Goald.git
```

For new clones, always use the SSH URL:

```bash
git clone git@github.com:deilert00/Goald.git
```

---

## PAT Fallback (HTTPS Authentication)

If SSH is blocked by a corporate firewall or you prefer HTTPS, use a Personal Access Token
(PAT) as your password.

### Generate a PAT

1. Go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**:

   ```
   https://github.com/settings/tokens
   ```

2. Click **Generate new token (classic)**.

3. Set an expiry and select the scopes you need.  
   For repository operations, `repo` is sufficient.

4. Click **Generate token** and copy the value immediately — it is shown only once.

   <!-- Screenshot placeholder: Generated PAT value (blurred for security) -->
   <!-- ![Generated PAT](../assets/screenshots/github-pat-generated.png) -->

### Use the PAT with Git

When Git prompts for a password over HTTPS, enter the PAT instead of your account password.

To avoid re-entering it every time, configure the credential helper:

```bash
# macOS — store in Keychain
git config --global credential.helper osxkeychain

# Linux — cache in memory for 1 hour
git config --global credential.helper 'cache --timeout=3600'

# Windows — Git Credential Manager
git config --global credential.helper manager
```

After the next authenticated operation, the token is stored and reused automatically.

---

## Troubleshooting

### Settings shows an empty SSH key list

**Symptom:** `https://github.com/settings/keys` shows _"There are no SSH keys associated
with your account."_

**Common causes and fixes:**

| Cause | Fix |
|---|---|
| You are viewing an organization's settings, not your personal account | Go to your personal profile → Settings → SSH and GPG keys (URL: `https://github.com/settings/keys`) |
| You are signed in as the wrong GitHub account | Sign out, sign in as the correct user, then revisit the page |
| You added the key to a different account | Repeat [Step 2](#step-2--add-the-public-key-to-github) while signed in to the correct account |
| Browser cached an old session | Open the settings page in a private/incognito window to confirm the active account |

To confirm which account is currently signed in, look at the avatar in the top-right corner
of any GitHub page, or check the URL after clicking your avatar:

```
https://github.com/<your-username>
```

<!-- Screenshot placeholder: GitHub top-right avatar dropdown showing username -->
<!-- ![GitHub signed-in user dropdown](../assets/screenshots/github-account-dropdown.png) -->

---

### Permission denied (publickey)

**Symptom:**

```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Steps:**

1. Confirm the SSH agent has your key loaded:

   ```bash
   ssh-add -l
   ```

   If output is `The agent has no identities.`, add the key:

   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

2. Re-test the connection:

   ```bash
   ssh -T git@github.com
   ```

3. Verify the public key appears in your GitHub Settings → SSH and GPG keys page.

4. If you have multiple SSH keys, ensure `~/.ssh/config` routes `github.com` to the right one:

   ```
   Host github.com
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519
   ```

---

### Wrong account is authenticated

**Symptom:** `ssh -T git@github.com` responds with a different username than expected.

**Cause:** The SSH agent, or `~/.ssh/config`, is using a key registered to a different
GitHub account.

**Fix:**

1. List loaded keys and their associated GitHub accounts:

   ```bash
   ssh-add -l
   ```

2. Remove all identities from the agent:

   ```bash
   ssh-add -D
   ```

3. Add the correct key:

   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

4. Verify the correct account responds:

   ```bash
   ssh -T git@github.com
   # Hi correct-username! You've successfully authenticated...
   ```

If you manage keys for multiple GitHub accounts on the same machine, use separate key files
and route each hostname alias in `~/.ssh/config`:

```
# Personal account
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal

# Work account
Host github-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
```

Then use the alias as the host when cloning or setting remotes:

```bash
git clone git@github-personal:deilert00/Goald.git
```

---

### Organization SSO restrictions

**Symptom:** SSH key is listed in your account but `git push` returns:

```
ERROR: The `deilert00` organization has enabled or enforced SAML SSO.
To access this repository, visit https://github.com/orgs/deilert00/sso
and authorize your SSH key.
```

**Fix:**

1. Go to `https://github.com/settings/keys`.
2. Find the key you want to use with the organization.
3. Click **Configure SSO** next to the key.
4. Click **Authorize** next to the organization name.

   <!-- Screenshot placeholder: Configure SSO button next to an SSH key -->
   <!-- ![Configure SSO for SSH key](../assets/screenshots/github-ssh-sso-authorize.png) -->

5. Retry your `git push`.

---

## Quick Reference

```bash
# Generate key
ssh-keygen -t ed25519 -C "you@example.com"

# Copy public key (macOS)
pbcopy < ~/.ssh/id_ed25519.pub

# Test connection (shows active GitHub username)
ssh -T git@github.com

# Check which keys are loaded
ssh-add -l

# Switch existing clone from HTTPS to SSH
git remote set-url origin git@github.com:deilert00/Goald.git

# Run the repo helper script
bash scripts/check-ssh.sh
```
