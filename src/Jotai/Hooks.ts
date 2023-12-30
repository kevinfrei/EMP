import { BoolState } from '@freik/web-utils';
import { WritableAtom, useAtom } from 'jotai';
import { RESET } from 'jotai/utils';

export type SetStateActionWithReset<T> =
  | T
  | typeof RESET
  | ((prev: T) => T | typeof RESET);

export type WritableAtomType<T> = WritableAtom<
  T | Promise<T>,
  [SetStateActionWithReset<T | Promise<T>>],
  Promise<void>
>;

export function useBoolAtom(atom: WritableAtomType<boolean>): BoolState {
  const [val, setter] = useAtom(atom);
  return [val, () => setter(false), () => setter(true)];
}
