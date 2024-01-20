import { Ipc } from '@freik/electron-render';
import { IpcId, StorageKey } from '@freik/emp-shared';
import {
  Pickle,
  SafelyUnpickle,
  isDefined,
  isNull,
  isString,
  isUndefined,
  typecheck,
} from '@freik/typechk';
import { BoolState, Catch, Fail } from '@freik/web-utils';
import { PrimitiveAtom, WritableAtom, atom, createStore, useAtom } from 'jotai';
import { RESET, atomFamily, atomWithStorage } from 'jotai/utils';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

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

type Unsubscribe = () => void;

export interface AsyncCallback<Value> {
  getItem: (key: string) => PromiseLike<Value>;
  subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe;
}

export interface SyncCallback<Value> {
  getItem: (key: string) => Value;
  subscribe?: (key: string, callback: (value: Value) => void) => Unsubscribe;
}

export function atomFromCallback<Value>(
  key: IpcId,
  storage: AsyncCallback<Value>,
): WritableAtom<
  Value | Promise<Value>,
  [SetStateAction<Value | Promise<Value>>],
  Promise<void>
>;

export function atomFromCallback<Value>(
  key: IpcId,
  storage: SyncCallback<Value>,
): WritableAtom<Value, [SetStateAction<Value>], void>;

export function atomFromCallback<Value>(
  key: IpcId,
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

export function AsyncHandler<Args extends unknown[], Res>(
  fn: (...args: Args) => Promise<Res>,
): (...args: Args) => void {
  return (...arg) => {
    // eslint-disable-next-line no-console
    fn.apply(arg).catch(console.error);
  };
}

const theStore = createStore();

export type MyStore = typeof theStore;

export function getStore(): MyStore {
  return theStore;
}

// This is the simple "sync with main" storage provider for Jotai

function makeGetItem<T>(
  chk: typecheck<T>,
): (key: StorageKey, initialValue: T) => PromiseLike<T> {
  return async (key: StorageKey, initialValue: T): Promise<T> => {
    const strValue = await Ipc.ReadFromStorage(key);
    if (isString(strValue)) {
      try {
        const val = SafelyUnpickle(strValue, chk);
        return isUndefined(val) ? initialValue : val;
      } catch (e) {
        Catch(e);
      }
    }
    return initialValue;
  };
}

function makeGetReadOnlyItem<T>(
  chk: typecheck<T>,
): (key: StorageKey) => PromiseLike<T> {
  return async (key: StorageKey): Promise<T> => {
    const strValue = await Ipc.ReadFromStorage(key);
    if (isString(strValue)) {
      const val = SafelyUnpickle(strValue, chk);
      if (isDefined(val)) {
        return val;
      }
    }
    Fail(
      'getReadonlyItem',
      `Got invalid value from Ipc.ReadFromStorage(${key})`,
    );
  };
}

async function setItem<T>(key: StorageKey, newValue: T): Promise<void> {
  await Ipc.WriteToStorage(key, Pickle(newValue));
}

async function removeItem(key: StorageKey): Promise<void> {
  await Ipc.DeleteFromStorage(key);
}

type Unsub = () => void;

function makeSubscribe<T>(
  chk: typecheck<T>,
): (key: StorageKey, callback: (value: T) => void, initialValue: T) => Unsub {
  return (key: StorageKey, callback: (value: T) => void, initialValue: T) => {
    const lk = Ipc.Subscribe(key, (val: unknown) =>
      callback(chk(val) ? val : initialValue),
    );
    return () => Ipc.Unsubscribe(lk);
  };
}

function makeReadOnlySubscribe<T>(
  chk: typecheck<T>,
): (key: StorageKey, callback: (value: T) => void) => Unsub {
  return (key: StorageKey, callback: (value: T) => void) => {
    const lk = Ipc.Subscribe(key, (val: unknown) => {
      if (chk(val)) {
        callback(val);
      }
    });
    return () => Ipc.Unsubscribe(lk);
  };
}

export type AsyncGetInit<T> = (key: string, initialVal: T) => PromiseLike<T>;
export type AsyncGet<T> = (key: string) => PromiseLike<T>;
export type AsyncSet<T> = (key: string, val: T) => PromiseLike<void>;
export type AsyncRemove = (key: string) => PromiseLike<void>;
export type AsyncSubscribeInit<T> = (
  key: string,
  cb: (val: T) => void,
  init: T,
) => () => void;
export type AsyncSubscribe<T> = (
  key: string,
  cb: (val: T) => void,
) => () => void;

export function getMainStorage<T>(chk: typecheck<T>): AsyncStorage<T> {
  return {
    getItem: makeGetItem(chk) as AsyncGetInit<T>,
    setItem: setItem as AsyncSet<T>,
    removeItem: removeItem as AsyncRemove,
    subscribe: makeSubscribe(chk) as AsyncSubscribe<T>,
  };
}

export function atomWithMainStorage<T>(
  key: StorageKey,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainStorage(chk), { getOnInit: true });
}

export function getMainReadOnlyStorage<T>(chk: typecheck<T>): AsyncCallback<T> {
  return {
    getItem: makeGetReadOnlyItem(chk) as AsyncGet<T>,
    subscribe: makeReadOnlySubscribe(chk) as AsyncSubscribe<T>,
  };
}

export function atomFromMain<T>(
  key: IpcId,
  chk: typecheck<T>,
): WriteOnlyAtomType<T> {
  return atomFromCallback(key, getMainReadOnlyStorage(chk));
}

function makeGetItemFromCall<T, U>(
  chk: typecheck<T>,
  xform: (input: T) => U | undefined,
): (key: IpcId) => PromiseLike<U> {
  return async (key: IpcId): Promise<U> => {
    const maybeBefore = await Ipc.CallMain(key, undefined, chk);
    if (!maybeBefore && (isUndefined(maybeBefore) || isNull(maybeBefore))) {
      Fail(`Invalid call IPC result from CallMain with ${key}`);
    } else {
      const maybeValue = xform(maybeBefore as Awaited<T>);
      if (isUndefined(maybeValue)) {
        Fail(`Invalid coercien for IPC call result form CallMain with ${key}`);
      } else {
        return maybeValue;
      }
    }
  };
}

function makeSubscribeForCallback<T, U>(
  chk: typecheck<T>,
  xform: (v: T) => U | undefined,
): (key: IpcId, callback: (value: U) => void) => Unsub {
  return (key: IpcId, callback: (value: U) => void) => {
    const lk = Ipc.Subscribe(key, (val: unknown) => {
      if (chk(val)) {
        const u = xform(val);
        if (!isUndefined(u)) {
          callback(u);
        }
      }
    });
    return () => Ipc.Unsubscribe(lk);
  };
}

const identity = <T>(a: T) => a;

function getMainIpcListener<T>(chk: typecheck<T>): AsyncCallback<T>;

function getMainIpcListener<T, U>(
  chk: typecheck<T>,
  xform: (v: T) => U,
): AsyncCallback<U>;

function getMainIpcListener<T, U>(
  chk: typecheck<T>,
  xform?: (v: T) => U,
): AsyncCallback<T> | AsyncCallback<U> {
  if (isUndefined(xform)) {
    return {
      getItem: makeGetItemFromCall(chk, identity) as AsyncGet<T> | AsyncGet<U>,
      subscribe: makeSubscribeForCallback(chk, identity) as
        | AsyncSubscribe<T>
        | AsyncSubscribe<U>,
    } as AsyncCallback<T>;
  } else {
    return {
      getItem: makeGetItemFromCall(chk, xform) as AsyncGet<T> | AsyncGet<U>,
      subscribe: makeSubscribeForCallback(chk, xform) as
        | AsyncSubscribe<T>
        | AsyncSubscribe<U>,
    } as AsyncCallback<U>;
  }
}

export function atomFromIpc<T>(
  key: IpcId,
  chk: typecheck<T>,
): WritableAtomType<T>;
export function atomFromIpc<T, U>(
  key: IpcId,
  chk: typecheck<T>,
  xform: (v: T) => U,
): WritableAtomType<U>;

export function atomFromIpc<T, U>(
  key: IpcId,
  chk: typecheck<T>,
  xform?: (v: T) => U,
): WriteOnlyAtomType<U> | WriteOnlyAtomType<T> {
  if (isUndefined(xform)) {
    return atomFromCallback(key, getMainIpcListener(chk));
  } else {
    return atomFromCallback(key, getMainIpcListener(chk, xform));
  }
}
