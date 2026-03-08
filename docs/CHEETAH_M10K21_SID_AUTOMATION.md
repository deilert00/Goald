# Cheetah M10K21 Router — SID Automation Guide

This document explains how the Cheetah M10K21 router web UI authenticates requests,
which network calls are relevant when automating the session ID (SID) lifecycle, and
how to locate and capture the SID issuance flow using browser developer tools.

---

## 1. How the Router Web UI API Works

The Cheetah M10K21 management interface exposes a single HTTP endpoint (typically
`http://192.168.1.1/cgi-bin/luci` or a similar path) that accepts JSON-encoded
requests. Each request body includes at minimum:

```json
{
  "module": "<subsystem>",
  "api": "<operation>",
  "sid": "<session-id>"
}
```

| Field    | Description                                                  |
|----------|--------------------------------------------------------------|
| `module` | Router subsystem (e.g. `ntraffic`, `network`, `system`)      |
| `api`    | Operation within that subsystem (e.g. `get_devices`, `login`)|
| `sid`    | Session identifier issued after successful authentication    |

All data-fetching and configuration calls **require a valid `sid`**.  Without it the
router returns an authentication error (typically `{"code": -1, "msg": "auth fail"}`).

---

## 2. Data Calls vs. the SID Issuance Flow

### 2.1 Data calls (use an existing SID — not issuance)

Calls such as:

```json
{ "module": "ntraffic", "api": "get_devices", "sid": "abc123..." }
{ "module": "network",  "api": "get_wan_info", "sid": "abc123..." }
{ "module": "system",   "api": "get_status",   "sid": "abc123..." }
```

**consume** a SID that was already issued.  Observing these calls in DevTools or a
HAR capture tells you the SID value in use, but they are **not** the calls that
create or issue the SID.  Replaying them without first obtaining a valid SID will
always fail.

### 2.2 SID issuance (the call you actually need to automate)

The SID is issued by the **login / authentication call**, which typically looks like:

```json
{ "module": "system", "api": "login", "username": "admin", "password": "<hash>" }
```

or in some firmware versions:

```json
{ "module": "auth",   "api": "login", "user": "admin", "pass": "<hash>" }
```

The response contains the new SID:

```json
{ "code": 0, "sid": "abc123...", "expires": 1800 }
```

**Only this call issues a SID.**  Every subsequent call reuses the value returned here.

---

## 3. Locating the SID Issuance Flow

### 3.1 Filter Network requests for login/auth/session endpoints

1. Open the router web UI in your browser and open **DevTools** (`F12`).
2. Go to the **Network** tab and tick **Preserve log** (Chrome) or **Persist Logs**
   (Firefox) so requests made during the redirect after login are not lost.
3. Clear the request list, then log in with your admin credentials.
4. In the filter bar, search for any of:
   - `login`
   - `auth`
   - `session`
5. Look for a POST request whose response body contains a `sid` or `token` field —
   that is the issuance call.

### 3.2 Check cookies and localStorage

Some firmware versions store the SID in a browser cookie or in `localStorage`
instead of (or in addition to) returning it in the response body.

**Cookies:**

1. After logging in, open **DevTools → Application → Cookies**.
2. Select the router origin (e.g. `http://192.168.1.1`).
3. Look for a cookie named `sid`, `session`, `sessionid`, or `token`.

**localStorage:**

1. Open **DevTools → Application → Local Storage**.
2. Select the router origin.
3. Look for a key named `sid`, `session`, `auth_token`, or similar.

### 3.3 Identify responses containing `sid` or `token`

If you are unsure which request issues the SID:

1. In the **Network** tab, use the search feature
   (**Ctrl+F** in Chrome DevTools Network tab, or the filter bar in Firefox).
2. Search for `"sid"` or `"token"`.
3. Inspect each matching response — the issuance call will return a **new**, previously
   unseen value, whereas data calls will echo back the SID you already sent.

Alternatively, filter by **XHR / Fetch** requests and sort by time to find the
first authenticated request; the call immediately before it (or a call to a
`login`/`auth` URL) is the issuance call.

---

## 4. Exporting a HAR File for Detailed Analysis

A HAR (HTTP Archive) file captures the full request/response log including headers,
bodies, and timings.  It is the most reliable way to inspect the exact payloads the
router sends and receives.

### Chrome / Edge

1. Open **DevTools → Network**.
2. Tick **Preserve log**.
3. Clear the log, then reproduce the login flow.
4. Right-click anywhere in the request list and choose **Save all as HAR with content**.
5. Open the `.har` file in a text editor or a tool such as
   [har.tech](https://har.tech) / [Google HAR Analyser](https://toolbox.googleapps.com/apps/har_analyzer/).

### Firefox

1. Open **DevTools → Network**.
2. Tick **Persist Logs**.
3. Clear the log, then reproduce the login flow.
4. Click the **gear icon** (⚙) in the Network panel toolbar and choose
   **Save All As HAR**.

### What to look for in the HAR

- Find the request whose URL or body contains `"api": "login"` or `"api": "auth"`.
- Confirm the response body contains a `sid` field.
- Note the **exact** request format (URL, HTTP method, Content-Type, body encoding)
  so you can replicate it in your automation script.
- Compare the `sid` value in that response with the `sid` field in subsequent data
  calls (e.g. `ntraffic/get_devices`) to confirm they match — this validates that
  you have identified the correct issuance call.

---

## 5. Summary Checklist for SID Automation

- [ ] Identify the login endpoint (URL + method + body structure) via Network tab or HAR.
- [ ] Confirm the response contains a `sid` or `token` field.
- [ ] Check cookies and localStorage if the SID is not in the response body.
- [ ] Confirm data calls like `{"module":"ntraffic", "api":"get_devices"}` reuse this SID —
      they do **not** issue a new one.
- [ ] In your automation script, always perform the login call first and extract the
      SID before issuing any data calls.
- [ ] Re-authenticate when a data call returns an auth-fail error code, then retry.

---

## 6. Common Pitfalls

| Pitfall | Explanation |
|---------|-------------|
| Treating `ntraffic/get_devices` as the auth call | It only works with an existing SID; it cannot issue one. |
| Not preserving logs during login redirect | The login response may be lost; enable **Preserve log** before logging in. |
| Password encoding | The router may expect the password as MD5, SHA-256, or a salted hash — inspect the exact value sent in the HAR rather than assuming plaintext. |
| SID expiry | The SID has a TTL (commonly 30 minutes of inactivity).  Your script should handle re-authentication on session expiry. |
| HTTPS vs HTTP | If the router UI is served over HTTPS, ensure your automation client accepts the self-signed certificate or pins the expected cert. |
