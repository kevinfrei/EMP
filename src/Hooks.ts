import { FTONData } from '@freik/core-utils';
import { useEffect } from 'react';
import { Subscribe, Unsubscribe } from './ipc';

export function useListener(
  message: string,
  listener: (args: FTONData) => void,
): void {
  useEffect(() => {
    const subKey = Subscribe(message, listener);
    return () => Unsubscribe(subKey);
  });
}
