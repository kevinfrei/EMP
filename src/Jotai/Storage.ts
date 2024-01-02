import { Ipc } from '@freik/electron-render';
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

export function getStore(): MyStore {
  return theStore;
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
      } catch (e) {}
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

export function atomWithMainStorage<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainStorage(chk), { getOnInit: true });
}

async function noSetItem<T>(_key: string, _newValue: T): Promise<void> {
  await Promise.resolve();
}

async function noRemoveItem(_key: string): Promise<void> {
  await Promise.resolve();
}

export function getMainReadOnlyStorage<T>(chk: typecheck<T>): AsyncStorage<T> {
  return {
    getItem: makeGetItem(chk),
    setItem: noSetItem,
    removeItem: noRemoveItem,
    subscribe: makeSubscribe(chk),
  };
}

export function atomFromMain<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainReadOnlyStorage(chk));
}

function makeGetItemFromCall<T, U>(
  chk: typecheck<T>,
  xform: (input: T) => U,
): (key: string, initialValue: U) => PromiseLike<U> {
  return async (key: string, initialValue: U): Promise<U> => {
    const maybeBefore = await Ipc.CallMain(key, undefined, chk);
    if (!maybeBefore) {
      return initialValue;
    }
    const maybeValue = xform(maybeBefore);
    return isUndefined(maybeValue) ? initialValue : maybeValue;
  };
}

function makeSubscribeListener<T, U>(
  chk: typecheck<T>,
  xform: (v: T) => U | undefined,
): (key: string, callback: (value: U) => void, initialValue: U) => Unsub {
  return (key: string, callback: (value: U) => void, initialValue: U) => {
    const lk = Ipc.Subscribe(key, (val: unknown) => {
      if (chk(val)) {
        const u = xform(val);
        callback(isUndefined(u) ? initialValue : u);
      } else {
        callback(initialValue);
      }
    });
    return () => Ipc.Unsubscribe(lk);
  };
}

const identity = <T>(a: T) => a;

function getMainIpcListener<T>(chk: typecheck<T>): AsyncStorage<T>;

function getMainIpcListener<T, U>(
  chk: typecheck<T>,
  xform: (v: T) => U,
): AsyncStorage<U>;

function getMainIpcListener<T, U>(
  chk: typecheck<T>,
  xform?: (v: T) => U,
): AsyncStorage<T> | AsyncStorage<U> {
  if (isUndefined(xform)) {
    return {
      getItem: makeGetItemFromCall(chk, identity),
      setItem: noSetItem,
      removeItem: noRemoveItem,
      subscribe: makeSubscribeListener(chk, identity),
    };
  } else {
    return {
      getItem: makeGetItemFromCall(chk, xform),
      setItem: noSetItem,
      removeItem: noRemoveItem,
      subscribe: makeSubscribeListener(chk, xform),
    };
  }
}

export function atomFromIpc<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T>;
export function atomFromIpc<T, U>(
  key: string,
  init: U,
  chk: typecheck<T>,
  xform: (v: T) => U,
): WritableAtomType<U>;

export function atomFromIpc<T, U>(
  key: string,
  init: T,
  chk: typecheck<T>,
  xform?: (v: T) => U,
): WritableAtomType<U> | WritableAtomType<T> {
  if (isUndefined(xform)) {
    return atomWithStorage(key, init, getMainIpcListener(chk), {
      getOnInit: true,
    });
  } else {
    return atomWithStorage(key, xform(init), getMainIpcListener(chk, xform), {
      getOnInit: true,
    });
  }
}
