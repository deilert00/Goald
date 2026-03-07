# Admin Support Runbook

This runbook provides baseline account-support operations via Firebase Admin SDK.

## Prerequisites

Set these environment variables before using the script:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Note:
- Keep the private key secure.
- Replace newline characters in the private key with escaped `\\n` if exported inline.

## Commands

Check user status:

```bash
npm run admin:support -- status <email-or-uid>
```

Generate password reset link:

```bash
npm run admin:support -- reset <email-or-uid>
```

Disable a user:

```bash
npm run admin:support -- disable <email-or-uid>
```

Enable a user:

```bash
npm run admin:support -- enable <email-or-uid>
```

## Incident Response Notes

For auth incidents:

1. Run `status` to verify account state.
2. If user is locked out and account is valid, issue `reset`.
3. If account compromise is suspected, run `disable` and escalate.
4. Re-enable only after verification.
