import { BoolState } from '@freik/web-utils';
import { PrimitiveAtom, WritableAtom, atom, useAtom } from 'jotai';
import { RESET, atomFamily } from 'jotai/utils';

export type SetStateActionWithReset<T> =
  | T
  | typeof RESET
  | ((prev: T) => T | typeof RESET);

export type SetStateAction<T> = T | ((prev: T) => T);

export type WritableAtomType<T> = WritableAtom<
  T | Promise<T>,
  [SetStateActionWithReset<T | Promise<T>>],
  Promise<void>
>;

export type WriteOnlyAtomType<T> = WritableAtom<
  T | Promise<T>,
  [SetStateAction<T | Promise<T>>],
  Promise<void>
>;

export function useBoolAtom(atm: WritableAtomType<boolean>): BoolState {
  const [val, setter] = useAtom(atm);
  return [val, () => setter(false), () => setter(true)];
}

export type SetAtomFamily<T> = [
  WritableAtomType<Set<T>> | PrimitiveAtom<Set<T>>,
  ReturnType<typeof atomFamily<T, WritableAtom<boolean, [boolean], void>>>,
];

export function MakeSetAtomFamily<T>(): SetAtomFamily<T> {
  const theSetState = atom(new Set<T>());
  const theFamily = atomFamily((key: T) =>
    atom(
      (get) => get(theSetState).has(key),
      (get, set, newValue: boolean) => {
        const s = get(theSetState);
        const newS = new Set(s);
        if (newValue) {
          newS.delete(key);
        } else {
          newS.add(key);
        }
        set(theSetState, newS);
      },
    ),
  );
  return [theSetState, theFamily];
}

/*
export function MakeSetSelector<T extends SerializableParam>(
  setOfObjsState: RecoilState<Set<T>>,
  key: string,
): (param: T) => RecoilState<boolean> {
  return selectorFamily<boolean, T>({
    key,
    get:
      (item: T) =>
      ({ get }) =>
        get(setOfObjsState).has(item),
    set:
      (item: T) =>
      ({ set }, newValue) =>
        set(setOfObjsState, (prevVal: Set<T>) => {
          const newSet = new Set<T>(prevVal);
          if (newValue) {
            newSet.delete(item);
          } else {
            newSet.add(item);
          }
          return newSet;
        }),
  });
}

export function MakeSetState<T extends SerializableParam>(
  key: string,
  //  from: RecoilState<Iterable<T>>
): [RecoilState<Set<T>>, (param: T) => RecoilState<boolean>] {
  const theAtom = atom({ key, default: new Set<T>() });
  return [theAtom, MakeSetSelector(theAtom, `${key}:sel`)];
}
*/
