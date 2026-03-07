import { captureError } from './telemetryService';

let initialized = false;

export function initializeGlobalErrorTracking(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('error', (event) => {
      captureError('window.error', event.error ?? event.message ?? 'Unknown window error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureError('window.unhandledrejection', event.reason ?? 'Unknown rejection reason');
    });
  }

  const globalAny = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
  };

  const errorUtils = globalAny.ErrorUtils;

  if (!errorUtils || typeof errorUtils.setGlobalHandler !== 'function') {
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler?.();

  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    captureError('native.global', error, { isFatal: !!isFatal });

    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  });
}
