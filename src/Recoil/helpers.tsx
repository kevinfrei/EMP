import {
  atom,
  RecoilState,
  selectorFamily,
  SerializableParam,
  SetterOrUpdater,
} from 'recoil';

export type StatePair<T> = [T, SetterOrUpdater<T>];

// [state, show (set true), hide (set false)]
export type BoolState = [boolean, () => void, () => void];

export type DialogData = [boolean, () => void];
// A simplifier for dialogs: [0] shows the dialog, [1] is used in the dialog
export type DialogState = [() => void, DialogData];

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
  return [theAtom, MakeSetSelector(theAtom, key + ':sel')];
}
