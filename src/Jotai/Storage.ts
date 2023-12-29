import { Ipc } from '@freik/electron-render';
import {
  Pickle,
  SafelyUnpickle,
  isString,
  isUndefined,
  typecheck,
} from '@freik/typechk';
import { WritableAtom, createStore } from 'jotai';
import { RESET, atomWithStorage } from 'jotai/utils';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

const theStore = createStore();

export function getStore() {
  return theStore;
}

// This is the simple "sync with main" storage provider for Jotai

function makeGetItem<T>(
  chk: typecheck<T>,
): (key: string, initialValue: T) => PromiseLike<T> {
  return async (key: string, initialValue: T): Promise<T> => {
    const strValue = await Ipc.ReadFromStorage(key);
    if (isString(strValue)) {
      const val = SafelyUnpickle(strValue, chk);
      return isUndefined(val) ? initialValue : val;
    }
    return initialValue;
  };
}

async function setItem<T>(key: string, newValue: T): Promise<void> {
  await Ipc.WriteToStorage(key, Pickle(newValue));
}

async function removeItem(key: string): Promise<void> {
  await Ipc.DeleteFromStorage(key);
}

type Unsub = () => void;
function makeSubscribe<T>(
  chk: typecheck<T>,
): (key: string, callback: (value: T) => void, initialValue: T) => Unsub {
  return (key: string, callback: (value: T) => void, initialValue: T) => {
    const lk = Ipc.Subscribe(key, (val: unknown) =>
      callback(chk(val) ? val : initialValue),
    );
    return () => Ipc.Unsubscribe(lk);
  };
}

export function getMainStorage<T>(chk: typecheck<T>): AsyncStorage<T> {
  return {
    getItem: makeGetItem(chk),
    setItem,
    removeItem,
    subscribe: makeSubscribe(chk),
  };
}

// Jotai should export this type...
type SetStateActionWithReset<T> =
  | T
  | typeof RESET
  | ((prev: T) => T | typeof RESET);

export function atomWithMainStorage<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtom<
  T | Promise<T>,
  [SetStateActionWithReset<T | Promise<T>>],
  Promise<void>
> {
  return atomWithStorage(key, init, getMainStorage(chk), { getOnInit: true });
}
