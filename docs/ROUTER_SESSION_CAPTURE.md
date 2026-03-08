# Router Session Capture — Cheetah M10K21

This guide explains how to capture the SID (session identifier) and other session
automation details from the Cheetah M10K21 router web UI using browser DevTools.
Use these steps when you need to script or automate interactions with the router's
HTTP API (e.g. reading RF parameters for the desktop modem-manager tool).

---

## Overview

The Cheetah M10K21 web UI authenticates via a login endpoint that returns a session
identifier (SID). Subsequent API calls include this SID — either as a URL parameter,
a request header, or a cookie — to prove the session is authorised. Capturing the SID
lets you replay authenticated requests programmatically.

---

## Prerequisites

- A browser with DevTools support (Chrome, Edge, or Firefox).
- Network access to the router's web UI (default: `http://192.168.0.1` or the address
  printed on the router label).
- Router admin credentials (username / password).

---

## Step 1 — Open DevTools Before Logging In

Open DevTools **before** you log in so the Network panel captures the login request
and its response.

| Browser | Shortcut |
|---------|----------|
| Chrome / Edge | `F12` or `Ctrl+Shift+I` (Windows/Linux), `Cmd+Option+I` (macOS) |
| Firefox | `F12` or `Ctrl+Shift+I` (Windows/Linux), `Cmd+Option+I` (macOS) |

Switch to the **Network** tab.

---

## Step 2 — Enable "Preserve Log"

By default the Network panel clears its log on every page navigation. If the login
flow redirects the browser to a different URL you will lose the captured entries.
Enable preserve log **before** submitting the login form:

- **Chrome / Edge:** tick the **Preserve log** checkbox at the top of the Network panel.
- **Firefox:** click the gear icon ⚙️ in the Network panel toolbar and enable
  **Persist Logs**.

---

## Step 3 — Filter for Login / Session Endpoints

The router UI typically issues several requests on login. Narrow the view to the
relevant ones:

1. In the filter box at the top of the Network panel type one of these terms:
   - `login`
   - `session`
   - `auth`
   - `/api`
2. Alternatively, select the **XHR** or **Fetch** category button to hide static
   assets and show only API calls.

Typical endpoint patterns for the Cheetah M10K21:

| Purpose | Example path |
|---------|--------------|
| Login / create session | `POST /api/login` or `POST /goform/goform_set_cmd_process` |
| Session validation | `GET /api/get_connected_clients` or `GET /api` |

> **Tip:** If you are unsure of the exact paths, clear the filter after logging in and
> scroll through the captured requests to find the one with a `200` status that carries
> credential fields in the payload.

---

## Step 4 — Submit the Login Form

With DevTools open and "Preserve log" enabled, fill in the router admin credentials
and click **Login** (or the equivalent button).

Watch the Network panel populate with new entries. The login request will appear
within a second or two.

---

## Step 5 — Extract Request URL, Method, and Payload

Click the login request row to open its detail panel. You will see several sub-tabs:

### Headers tab

- **Request URL** — the full URL including path and any query string.
- **Request Method** — typically `POST`.
- **Status Code** — should be `200 OK` for a successful login.

### Payload tab (Chrome/Edge) / Request tab (Firefox)

This shows the body that was sent to the router. For the Cheetah M10K21 the body is
usually `application/x-www-form-urlencoded` and looks like:

```
isTest=false&goformId=LOGIN&password=<hashed-or-plain-password>
```

or for JSON-based firmwares:

```json
{
  "username": "admin",
  "password": "<password>"
}
```

Record the exact form field names — they are required when replaying the request
from a script.

---

## Step 6 — Identify the SID in the Response

The SID can appear in one of three places. Check them in this order:

### 6a — Response body / JSON

Click the **Response** (Chrome/Edge) or **Response** (Firefox) sub-tab of the login
request. Look for a field named `SID`, `sid`, `token`, or `sessionToken`:

```json
{
  "result": "success",
  "SID": "abc123def456"
}
```

Copy the value of that field — this is your session identifier.

### 6b — Cookies

If no SID appears in the response body, open the **Cookies** sub-tab (visible when
you select the request row). Look for a cookie named `SID`, `PHPSESSID`, or
`sessionId`. Note:

- **Name** — the cookie key.
- **Value** — the SID value to use in subsequent requests.
- **Expires / Max-Age** — tells you how long the session is valid (see
  [Troubleshooting](#troubleshooting) if this is very short).

### 6c — localStorage / sessionStorage

Some router firmwares store the SID in browser storage rather than a cookie. Open
the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox), then expand
**Local Storage** or **Session Storage** and select the router's origin. Look for
a key named `SID`, `token`, or similar.

---

## Step 7 — Validate the SID by Calling `/api`

Before scripting further requests, confirm the captured SID is accepted by the
router. Open a new browser tab (or use `curl`) and call a read-only endpoint:

```bash
# Replace <ROUTER_IP> and <YOUR_SID> with actual values

# SID as query parameter (common pattern)
curl "http://<ROUTER_IP>/api?cmd=get_connected_clients&multi_data=1&SID=<YOUR_SID>"

# SID as a cookie
curl --cookie "SID=<YOUR_SID>" "http://<ROUTER_IP>/api?cmd=get_connected_clients&multi_data=1"

# SID as a header
curl -H "Authorization: Bearer <YOUR_SID>" "http://<ROUTER_IP>/api?cmd=get_connected_clients"
```

A successful response returns router data (JSON or XML). An expired or invalid SID
typically returns:

```json
{ "result": "error", "msg": "session expired" }
```

or an HTTP `401 Unauthorized` / redirect to the login page.

---

## Troubleshooting

### SID expires very quickly (within seconds)

Some router firmwares enforce a short idle timeout (as low as 30–60 seconds) or
single-session policies that invalidate the previous SID when a new login occurs.

Mitigation steps:

1. **Keep the router admin tab active** while scripting — some firmwares only
   expire the SID when the original browser tab closes or goes idle.

2. **Re-login programmatically.** In your automation script, catch `session expired`
   responses and re-issue the login request to obtain a fresh SID before retrying.

   Example skeleton (Python):

   ```python
   import os
   import requests

   ROUTER = "http://192.168.0.1"

   # Load credentials from environment variables — never hardcode them.
   # The exact format of the password field depends on firmware:
   # some routers accept the plain-text password; others expect an MD5 hash
   # of the password (check Step 5 to confirm what the browser sends).
   CREDENTIALS = {
       "goformId": "LOGIN",
       "isTest": "false",
       "password": os.getenv("ROUTER_PASSWORD", ""),
   }

   def login() -> str:
       resp = requests.post(f"{ROUTER}/goform/goform_set_cmd_process", data=CREDENTIALS)
       resp.raise_for_status()
       return resp.json()["SID"]   # adjust key to match your firmware

   def get_data(sid: str, cmd: str):
       resp = requests.get(f"{ROUTER}/api", params={"cmd": cmd, "SID": sid})
       if resp.json().get("result") == "error":
           sid = login()           # refresh SID and retry once
           resp = requests.get(f"{ROUTER}/api", params={"cmd": cmd, "SID": sid})
       return resp.json(), sid
   ```

3. **Check for concurrent-session limits.** If logging in from the script
   invalidates the browser session (or vice-versa), avoid running both
   simultaneously.

4. **Extend the session timeout in the router UI** (if supported). Navigate to
   **Administration > Security** (path varies by firmware) and look for
   "Session Timeout" or "Idle Timeout" settings.

### Login request not visible in Network panel

- Confirm **Preserve log** is enabled (Step 2).
- Try clearing the Network log (`Ctrl+L` in the panel) and re-submitting the login
  form without navigating away.
- If the page uses a single-page framework (no full navigation), the request should
  appear immediately without needing preserve log.

### Response body is empty or binary

- The router may be using a non-standard encoding. Switch to the **Preview** or
  **Response** raw sub-tab.
- Some firmwares return the SID only in a `Set-Cookie` header — check the
  **Headers** sub-tab under **Response Headers**.

### CORS or "blocked" requests in DevTools

- DevTools still captures blocked requests; look for red-highlighted rows.
- The SID will still be visible in the captured headers/cookies even if the browser
  blocked the response for CORS reasons.

---

## Quick Reference

| What to capture | Where to find it in DevTools |
|-----------------|------------------------------|
| Login endpoint URL | Network > select login row > Headers > Request URL |
| HTTP method | Network > select login row > Headers > Request Method |
| Request payload | Network > select login row > Payload (Chrome) / Request (Firefox) |
| SID in response JSON | Network > select login row > Response |
| SID as cookie | Network > select login row > Cookies |
| SID in storage | Application > Local Storage / Session Storage (Chrome) |
| Validate session | `curl "http://<router>/api?cmd=...&SID=<sid>"` |
