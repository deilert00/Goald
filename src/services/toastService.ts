export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  durationMs: number;
}

type ToastListener = (message: ToastMessage) => void;

let nextToastId = 1;
const listeners = new Set<ToastListener>();

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(
  text: string,
  type: ToastType = 'info',
  durationMs = 2200
): void {
  const message: ToastMessage = {
    id: nextToastId++,
    text,
    type,
    durationMs,
  };

  listeners.forEach((listener) => {
    try {
      listener(message);
    } catch {
      // Keep toast dispatch non-blocking.
    }
  });
}
