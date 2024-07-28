import { Getter, Setter, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';

export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  return (...args) => {
    fn.apply(args).catch(console.error);
  };
}

type Options = Parameters<typeof useSetAtom>[1];

export function useJotaiCallback<Result, Args extends unknown[]>(
  fn: (get: Getter, set: Setter, ...args: Args) => Result,
  deps: any[],
  options?: Options,
): (...args: Args) => Result {
  return useAtomCallback(useCallback(fn, deps), options);
}

export function useJotaiAsyncCallback<Result, Args extends unknown[]>(
  fn: (get: Getter, set: Setter, ...args: Args) => Promise<Result>,
  deps: any[],
  options?: Options,
): (...args: Args) => Promise<Result> {
  return useAtomCallback(useCallback(fn, deps), options);
}
