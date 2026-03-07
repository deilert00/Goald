# Windows SSH Agent Troubleshooting Guide

This guide helps you diagnose and fix `ssh-agent` startup failures on Windows 10 and Windows 11.
It also covers alternative authentication paths if the Windows OpenSSH `ssh-agent` service cannot
be made to work in your environment.

---

## Quick-Check Commands

Run the following in an **elevated PowerShell** session (Run as Administrator).

### 1. Check service status

```powershell
Get-Service -Name ssh-agent
```

Expected output when healthy:

```
Status   Name               DisplayName
------   ----               -----------
Running  ssh-agent          OpenSSH Authentication Agent
```

If the status shows `Stopped` or the command fails, proceed to the diagnostics below.

---

## Full Diagnostic Walkthrough

### Step 1 — Read the service configuration

```powershell
sc.exe qc ssh-agent
```

Key fields to check:

| Field              | Healthy value                                     |
|--------------------|---------------------------------------------------|
| `START_TYPE`       | `2  AUTO_START` or `3  DEMAND_START`              |
| `BINARY_PATH_NAME` | `C:\Windows\System32\OpenSSH\ssh-agent.exe`       |

If `START_TYPE` is `4  DISABLED`, the service has been explicitly disabled — see
[Fix: Re-enable a disabled service](#fix-re-enable-a-disabled-service).

If `BINARY_PATH_NAME` points to a missing file, the OpenSSH feature is broken or uninstalled — see
[Fix: Reinstall the OpenSSH Client feature](#fix-reinstall-the-openssh-client-feature).

### Step 2 — Query real-time state and exit code

```powershell
sc.exe query ssh-agent
```

Look at `WIN32_EXIT_CODE` and `SERVICE_EXIT_CODE`. A non-zero exit code indicates the service
binary crashed on startup. Common codes:

| Exit Code | Meaning                                                  |
|-----------|----------------------------------------------------------|
| `0`       | No error                                                 |
| `1060`    | Service does not exist — OpenSSH not installed           |
| `1053`    | Service did not respond in time — binary may be corrupt  |
| `5`       | Access denied — permissions or policy issue              |

### Step 3 — Search Windows Event Log for ssh-agent errors

```powershell
Get-WinEvent -LogName System -MaxEvents 500 |
  Where-Object { $_.Message -like '*ssh-agent*' } |
  Select-Object TimeCreated, Id, LevelDisplayName, Message |
  Format-List
```

Also check the Application log:

```powershell
Get-WinEvent -LogName Application -MaxEvents 500 |
  Where-Object { $_.Message -like '*ssh-agent*' -or $_.ProviderName -like '*OpenSSH*' } |
  Select-Object TimeCreated, Id, LevelDisplayName, Message |
  Format-List
```

### Step 4 — Verify the OpenSSH Client Windows capability is installed

```powershell
Get-WindowsCapability -Online | Where-Object { $_.Name -like 'OpenSSH*' }
```

Expected output:

```
Name  : OpenSSH.Client~~~~0.0.1.0
State : Installed

Name  : OpenSSH.Server~~~~0.0.1.0
State : NotPresent
```

If `OpenSSH.Client~~~~0.0.1.0` shows `State : NotPresent`, install it — see below.

---

## Common Causes and Fixes

### Fix: Re-enable a disabled service

The service may have been disabled by a system administrator, Group Policy, or a third-party
security product.

```powershell
# Set the service to start automatically
Set-Service -Name ssh-agent -StartupType Automatic

# Start the service now
Start-Service -Name ssh-agent

# Verify
Get-Service -Name ssh-agent
```

If `Set-Service` is blocked by Group Policy, contact your system administrator. You can check
applied policies with:

```powershell
gpresult /Scope Computer /Z | Select-String -Pattern 'ssh'
```

### Fix: Reinstall the OpenSSH Client feature

If the binary is missing or the capability shows `NotPresent`:

```powershell
# Remove the broken installation (if present)
Get-WindowsCapability -Online |
  Where-Object { $_.Name -like 'OpenSSH.Client*' } |
  Remove-WindowsCapability -Online

# Reinstall
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Confirm
Get-WindowsCapability -Online | Where-Object { $_.Name -like 'OpenSSH.Client*' }

# Start the agent
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service -Name ssh-agent
Get-Service -Name ssh-agent
```

A system **restart** may be required after reinstalling the capability.

### Fix: Repair file permissions on the ssh-agent binary

If the binary exists but access is denied:

```powershell
$binary = 'C:\Windows\System32\OpenSSH\ssh-agent.exe'
Test-Path $binary

# View current ACL
Get-Acl $binary | Format-List

# The SYSTEM account and local Administrators group must have Read + Execute.
# Restoring permissions (run as Administrator):
icacls $binary /grant 'NT AUTHORITY\SYSTEM:(RX)' /grant 'BUILTIN\Administrators:(RX)'
```

---

## Alternative Authentication Paths

If the Windows OpenSSH `ssh-agent` service cannot be restored in your environment, use one of
the following alternatives.

### Option A — Git Credential Manager with HTTPS and a Personal Access Token

Git Credential Manager (GCM) is bundled with Git for Windows and stores credentials securely in
the Windows Credential Manager. No `ssh-agent` is required.

1. Generate a Personal Access Token (PAT) in your provider's web UI with the `repo` scope.
2. Configure the remote to use HTTPS instead of SSH:

   ```powershell
   git remote set-url origin https://github.com/YOUR-ORG/YOUR-REPO.git
   ```

3. Push or pull once — GCM will prompt for your username and the PAT, then cache it.

   ```powershell
   git pull
   ```

4. Verify the credential is stored:

   ```powershell
   git credential-manager list
   ```

### Option B — PuTTY / Pageant

PuTTY provides its own SSH agent (`pageant.exe`) that does not depend on the Windows OpenSSH
service.

1. Download PuTTY from <https://www.putty.org/> and install it.
2. Convert your existing OpenSSH private key to PuTTY format using **PuTTYgen**:
   - Open PuTTYgen → **Conversions** → **Import key** → select your `id_ed25519` or `id_rsa`
   - **Save private key** as a `.ppk` file.
3. Launch Pageant and load the `.ppk` file.
4. Configure Git to use PuTTY's `plink.exe` as the SSH transport:

   ```powershell
   [System.Environment]::SetEnvironmentVariable(
     'GIT_SSH',
     'C:\Program Files\PuTTY\plink.exe',
     'User'
   )
   ```

5. On the first connection, accept the server's host key in the Plink dialog.

### Option C — WSL ssh-agent

If you use Windows Subsystem for Linux (WSL), you can run `ssh-agent` inside WSL and forward the
socket to Windows tools via `npiperelay` or `wsl-ssh-agent`.

**Basic WSL ssh-agent setup:**

```bash
# Inside your WSL terminal (~/.bashrc or ~/.zshrc)
if [ -z "$SSH_AUTH_SOCK" ]; then
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519
fi
```

**Forward the WSL agent socket to Windows (using wsl-ssh-agent):**

1. Download `wsl-ssh-agent` from <https://github.com/rupor-github/wsl-ssh-agent/releases>.
2. Follow the project's README to configure `SSH_AUTH_SOCK` on the Windows side.
3. Set `GIT_SSH` in Windows to the WSL SSH binary if you want `git` in PowerShell to use the
   WSL agent.

---

## Summary: Which Option to Choose

| Situation                                                   | Recommended path          |
|-------------------------------------------------------------|---------------------------|
| Corporate machine, Group Policy blocks OpenSSH service      | Option A (GCM + HTTPS)    |
| Broken OpenSSH install, no admin rights to reinstall        | Option A (GCM + HTTPS)    |
| Need SSH (not HTTPS), no WSL available                      | Option B (PuTTY/Pageant)  |
| WSL already in use for development                          | Option C (WSL ssh-agent)  |
| Have admin rights, OpenSSH intact                           | Re-enable service (above) |

---

## Platform Notes

- All PowerShell commands above require **Windows 10 version 1809** or later / **Windows 11**.
- OpenSSH is a built-in optional feature on these versions; no third-party installer is needed.
- Commands that modify services or capabilities require an **elevated (Administrator)** PowerShell
  session.
- On systems managed by Microsoft Intune or Active Directory Group Policy, service startup type
  changes may be reverted automatically. In these cases, Option A (GCM + HTTPS) is the most
  reliable path.
