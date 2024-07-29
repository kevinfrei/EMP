import { Ipc } from '@freik/electron-render';
import { StorageIdEnum } from '@freik/emp-shared';
import {
  Pickle,
  SafelyUnpickle,
  isString,
  isUndefined,
  typecheck,
} from '@freik/typechk';
import { createStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';
import { WritableAtomType } from './Hooks';

const theStore = createStore();

export type MyStore = typeof theStore;
export type MaybeStore = MyStore | undefined;

export function getStore(curStore?: MaybeStore): MyStore {
  return curStore || theStore;
}

// This is the simple "sync with main" storage provider for Jotai

function makeGetItem<T>(
  chk: typecheck<T>,
): (key: string, initialValue: T) => PromiseLike<T> {
  return async (key: string, initialValue: T): Promise<T> => {
    const strValue = await Ipc.ReadFromStorage(key);
    if (isString(strValue)) {
      try {
        const val = SafelyUnpickle(strValue, chk);
        return isUndefined(val) ? initialValue : val;
      } catch {
        /* */
      }
    }
    return initialValue;
  };
}

function makeGetTranslatedItem<T, U>(
  chk: typecheck<U>,
  xlate: (val: U) => T,
): (key: string, initialValue: T) => PromiseLike<T> {
  return async (key: string, initialValue: T): Promise<T> => {
    const strValue = await Ipc.ReadFromStorage(key);
    if (isString(strValue)) {
      try {
        const val = SafelyUnpickle(strValue, chk);
        return isUndefined(val) ? initialValue : xlate(val);
      } catch {
        /* */
      }
    }
    return initialValue;
  };
}

async function setItem<T>(key: string, newValue: T): Promise<void> {
  await Ipc.WriteToStorage(key, Pickle(newValue));
}

async function setTranslatedItem<T, U>(
  key: string,
  newValue: T,
  xlate: (val: T) => U,
): Promise<void> {
  await Ipc.WriteToStorage(key, Pickle(xlate(newValue)));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function noSetItem<T>(_key: string, _newValue: T): Promise<void> {
  await Promise.resolve();
}

async function removeItem(key: string): Promise<void> {
  await Ipc.DeleteFromStorage(key);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function noRemoveItem(_key: string): Promise<void> {
  await Promise.resolve();
}

type Unsub = () => void;
type Subscriber<T> = (
  key: string,
  callback: (value: T) => void,
  initVal: T,
) => Unsub;
function makeSubscribe<T>(chk: typecheck<T>): Subscriber<T> {
  return (key: string, callback: (value: T) => void, initialValue: T) => {
    const lk = Ipc.Subscribe(key, (val: unknown) =>
      callback(chk(val) ? val : initialValue),
    );
    return () => Ipc.Unsubscribe(lk);
  };
}

function makeTranslatedSubscribe<T, U>(
  chk: typecheck<U>,
  xlate: (val: U) => T,
): Subscriber<T> {
  return (key: string, callback: (value: T) => void, initialValue: T) => {
    const lk = Ipc.Subscribe(key, (val: unknown) => {
      if (chk(val)) {
        callback(xlate(val));
      } else {
        callback(initialValue);
      }
    });
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

export function getMainReadOnlyStorage<T>(chk: typecheck<T>): AsyncStorage<T> {
  return {
    getItem: makeGetItem(chk),
    setItem: noSetItem,
    removeItem: noRemoveItem,
    subscribe: makeSubscribe(chk),
  };
}

export function atomWithMainStorage<T>(
  key: StorageIdEnum,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainStorage(chk), { getOnInit: true });
}

export function atomFromMain<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainReadOnlyStorage(chk));
}

function getTranslatedMainStorage<T, U>(
  chk: typecheck<U>,
  fromMain: (val: U) => T,
  toMain: (val: T) => U,
): AsyncStorage<T> {
  return {
    getItem: makeGetTranslatedItem(chk, fromMain),
    setItem: async (k, v) => setTranslatedItem(k, toMain(v), fromMain),
    removeItem,
    subscribe: makeTranslatedSubscribe(chk, fromMain),
  };
}

function getTranslatedMainReadOnlyStorage<T, U>(
  chk: typecheck<U>,
  fromMain: (val: U) => T,
): AsyncStorage<T> {
  return {
    getItem: makeGetTranslatedItem(chk, fromMain),
    setItem: noSetItem,
    removeItem: noRemoveItem,
    subscribe: makeTranslatedSubscribe(chk, fromMain),
  };
}

export function atomWithTranslatedStorageInMain<T, U>(
  key: string,
  init: T,
  chk: typecheck<U>,
  toMain: (val: T) => U,
  fromMain: (val: U) => T,
): WritableAtomType<T> {
  return atomWithStorage(
    key,
    init,
    getTranslatedMainStorage<T, U>(chk, fromMain, toMain),
  );
}

export function atomFromTranslatedStorageFromMain<T, U>(
  key: string,
  init: T,
  chk: typecheck<U>,
  fromMain: (val: U) => T,
): WritableAtomType<T> {
  return atomWithStorage(
    key,
    init,
    getTranslatedMainReadOnlyStorage<T, U>(chk, fromMain),
  );
}
