import { WritableAtom, atom } from 'jotai';

type Unsubscribe = () => void;

type SetStateAction<Value> = Value | ((prev: Value) => Value);

export interface AsyncCallback<Value> {
  getItem: (key: string) => PromiseLike<Value>;
  subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe;
}

export interface SyncCallback<Value> {
  getItem: (key: string) => Value;
  subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe;
}

export function atomFromCallback<Value>(
  key: string,
  storage: AsyncCallback<Value>,
): WritableAtom<
  Value | Promise<Value>,
  [SetStateAction<Value | Promise<Value>>],
  Promise<void>
>;

export function atomFromCallback<Value>(
  key: string,
  storage: SyncCallback<Value>,
): WritableAtom<Value, [SetStateAction<Value>], void>;

export function atomFromCallback<Value>(
  key: string,
  storage: SyncCallback<Value> | AsyncCallback<Value>,
): any {
  const baseAtom = atom(storage.getItem(key) as Value | Promise<Value>);

  baseAtom.onMount = (setAtom) => {
    let unsub: Unsubscribe | undefined;
    if (storage.subscribe) {
      unsub = storage.subscribe(key, setAtom);
    }
    return unsub;
  };

  const anAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: SetStateAction<Value | Promise<Value>>) => {
      const nextValue =
        typeof update === 'function'
          ? (
              update as (prev: Value | Promise<Value>) => Value | Promise<Value>
            )(get(baseAtom))
          : update;
      if (nextValue instanceof Promise) {
        return nextValue.then((resolvedValue) => {
          set(baseAtom, resolvedValue);
        });
      } else {
        set(baseAtom, nextValue);
      }
    },
  );

  return anAtom;
}
