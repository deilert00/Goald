type TelemetryEventName =
  | 'register_attempt'
  | 'register_success'
  | 'register_fail'
  | 'login_attempt'
  | 'login_success'
  | 'login_fail'
  | 'reset_password_requested'
  | 'goal_created'
  | 'deposit_added'
  | 'goal_completed';

interface TelemetryPayload {
  [key: string]: string | number | boolean | null | undefined;
}

const endpoint = process.env.EXPO_PUBLIC_TELEMETRY_ENDPOINT;

async function postEvent(name: TelemetryEventName, payload?: TelemetryPayload): Promise<void> {
  if (!endpoint) {
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        payload: payload ?? {},
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Never throw from telemetry; this must stay non-blocking.
  }
}

export function trackEvent(name: TelemetryEventName, payload?: TelemetryPayload): void {
  postEvent(name, payload).catch(() => {});
}

export function captureError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  postEvent('login_fail', { context, message }).catch(() => {});
}
