# Windows SSH Setup Guide

This guide covers how to clone and authenticate with GitHub using SSH on Windows,
including how to enable the `ssh-agent` service when it is disabled, and how to fall
back to HTTPS with a Personal Access Token (PAT) if you prefer not to use SSH.

---

## Prerequisites

- Windows 10 (version 1803 or later) or Windows 11
- OpenSSH client installed (built-in on Windows 10 1803+ and Windows 11)
  - Verify: open a terminal and run `ssh -V`
  - If missing, install via **Settings → Apps → Optional features → Add a feature → OpenSSH Client**
- Git for Windows — download from <https://git-scm.com/download/win>
- A GitHub account with a verified email address

---

## Option A: SSH Authentication

### 1. Check the `ssh-agent` Service Status

Open a **non-elevated** PowerShell and run:

```powershell
Get-Service -Name ssh-agent | Select-Object Name, Status, StartType
```

If `StartType` is `Disabled`, the service cannot be started until it is re-enabled.
Proceed to step 2. If `StartType` is already `Manual` or `Automatic` and `Status` is
`Running`, skip to step 4.

---

### 2. Enable the `ssh-agent` Service (Elevated PowerShell Required)

Both methods below require an **elevated (Run as Administrator) PowerShell session**.

**Right-click the Start Menu → "Windows Terminal (Admin)"** or search for
"PowerShell", right-click, and choose **"Run as administrator"**.

#### Method 1 — `Set-Service` (recommended)

```powershell
# Change start type from Disabled to Manual
Set-Service -Name ssh-agent -StartupType Manual

# Verify the change
Get-Service -Name ssh-agent | Select-Object Name, Status, StartType
```

#### Method 2 — `sc config` (classic command-line)

```powershell
# Use 'demand' for Manual start type
sc.exe config ssh-agent start=demand
```

> **Why elevated?**  Changing a Windows service's start type requires local
> administrator privileges. Without elevation, both commands will return an
> `Access is denied` error.

---

### 3. Start the `ssh-agent` Service

After enabling the service you can start it in the **same elevated session**:

```powershell
Start-Service ssh-agent

# Confirm it is running
Get-Service -Name ssh-agent
```

Expected output:

```
Status   Name               DisplayName
------   ----               -----------
Running  ssh-agent          OpenSSH Authentication Agent
```

To avoid repeating this after every reboot, set the start type to `Automatic`:

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
```

---

### 4. Generate an SSH Key (skip if you already have one)

In a **regular** PowerShell or Command Prompt:

```powershell
ssh-keygen -t ed25519 -C "user@example.com"
```

Accept the default path (`C:\Users\<you>\.ssh\id_ed25519`) or provide a custom one.
Setting a passphrase is strongly recommended.

---

### 5. Add the Key to `ssh-agent`

```powershell
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

List loaded keys to verify:

```powershell
ssh-add -l
```

---

### 6. Add the Public Key to GitHub

Copy the public key to the clipboard:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

Then in GitHub:

1. Go to **Settings → SSH and GPG keys → New SSH key**
2. Give it a title and paste the key
3. Click **Add SSH key**

---

### 7. Test the Connection

```powershell
ssh -T git@github.com
```

Expected response:

```
Hi <username>! You've successfully authenticated, but GitHub does not provide shell access.
```

---

### 8. Clone the Repository via SSH

```bash
git clone git@github.com:deilert00/Goald.git
```

---

## Option B: HTTPS Authentication with a Personal Access Token (PAT)

If you prefer not to configure SSH — or if you are on a managed machine where service
changes are restricted — use HTTPS with a PAT.

### 1. Create a PAT on GitHub

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** (or Classic tokens)
2. Click **Generate new token**
3. Set an expiration date and grant the **Contents** (read/write) scope (or `repo` for classic tokens)
4. Copy the token immediately — GitHub shows it only once

### 2. Clone with HTTPS

```bash
git clone https://github.com/deilert00/Goald.git
```

When prompted for credentials:

- **Username:** your GitHub username
- **Password:** paste the PAT (not your GitHub account password)

### 3. Store Credentials (optional, avoids re-entering the PAT)

```powershell
# Enable Git Credential Manager (included with Git for Windows)
git config --global credential.helper manager
```

After the first successful HTTPS operation, Git Credential Manager stores the PAT in
the Windows Credential Store and you will not be prompted again.

---

## Troubleshooting

### `OpenSSH SSH client does not exist at 'C:\Windows\System32\OpenSSH\ssh.exe'`

OpenSSH is not installed. Install it via:

```powershell
# Elevated PowerShell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

---

### `Error connecting to agent: No such file or directory` or `Error connecting to agent: Connection refused`

The `ssh-agent` service is not running. Start it:

```powershell
# Elevated PowerShell (to change start type if Disabled)
Set-Service -Name ssh-agent -StartupType Manual
Start-Service ssh-agent
```

---

### `Permission denied (publickey)` when connecting to GitHub

1. Confirm the key is loaded in the agent: `ssh-add -l`
2. Confirm the correct public key is added to your GitHub account
3. Run `ssh -vT git@github.com` and check the debug output for the key being offered

---

### `Access is denied` when running `Set-Service` or `sc config`

You are not in an elevated session. Re-open PowerShell with **Run as Administrator**
and retry the command.

---

### PAT Authentication Failing

- Confirm the token has not expired (check **GitHub → Settings → Developer settings → Personal access tokens**)
- Confirm you are using the PAT as the **password**, not your GitHub account password
- If using a fine-grained token, confirm the **Contents** permission is granted for the repository

---

## Summary

| Method | Requires Elevation | Credential Storage | Notes |
|---|---|---|---|
| SSH (`ssh-agent` enabled) | Yes, to enable the service | SSH key in agent | Recommended for daily dev |
| HTTPS + PAT | No | Windows Credential Manager (via GCM) | Best for managed/locked-down machines |
