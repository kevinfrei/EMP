import { useEffect } from 'react';
import { Subscribe, Unsubscribe } from './ipc';

export function useListener(
  message: string,
  listener: (args: unknown) => void,
): void {
  useEffect(() => {
    const subKey = Subscribe(message, listener);
    return () => Unsubscribe(subKey);
  });
}
