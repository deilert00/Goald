#!/usr/bin/env node
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function ensureAdminApp() {
  if (getApps().length > 0) {
    return;
  }

  const clientEmail = requireEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = requireEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');
  const projectId = requireEnv('FIREBASE_ADMIN_PROJECT_ID');

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

async function findUser(identifier) {
  const auth = getAuth();
  if (identifier.includes('@')) {
    return auth.getUserByEmail(identifier);
  }
  return auth.getUser(identifier);
}

async function run() {
  const [, , command, arg] = process.argv;

  if (!command || !arg) {
    console.error('Usage: npm run admin:support -- <status|reset|disable|enable> <email-or-uid>');
    process.exit(1);
  }

  ensureAdminApp();
  const auth = getAuth();
  const user = await findUser(arg);

  if (command === 'status') {
    console.log(JSON.stringify({
      uid: user.uid,
      email: user.email,
      disabled: user.disabled,
      lastSignInTime: user.metadata.lastSignInTime,
      creationTime: user.metadata.creationTime,
    }, null, 2));
    return;
  }

  if (command === 'reset') {
    const link = await auth.generatePasswordResetLink(user.email);
    console.log(JSON.stringify({ uid: user.uid, email: user.email, resetLink: link }, null, 2));
    return;
  }

  if (command === 'disable') {
    await auth.updateUser(user.uid, { disabled: true });
    console.log(`Disabled user ${user.uid}`);
    return;
  }

  if (command === 'enable') {
    await auth.updateUser(user.uid, { disabled: false });
    console.log(`Enabled user ${user.uid}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
