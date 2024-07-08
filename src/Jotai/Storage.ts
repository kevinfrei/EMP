import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import {
  Pickle,
  SafelyUnpickle,
  isDefined,
  isNull,
  isString,
  isUndefined,
  typecheck,
} from '@freik/typechk';
import { Fail } from '@freik/web-utils';
import { createStore } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';
import { AsyncCallback, atomFromCallback } from './FromCallback';
import { WritableAtomType, WriteOnlyAtomType } from './Hooks';

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
      } catch (e) {
        /* */
      }
    }
    return initialValue;
  };
}

function makeGetReadOnlyItem<T>(
  chk: typecheck<T>,
): (key: string) => PromiseLike<T> {
  return async (key: string): Promise<T> => {
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

function makeReadOnlySubscribe<T>(
  chk: typecheck<T>,
): (key: string, callback: (value: T) => void) => Unsub {
  return (key: string, callback: (value: T) => void) => {
    const lk = Ipc.Subscribe(key, (val: unknown) => {
      if (chk(val)) {
        callback(val);
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

export function atomWithMainStorage<T>(
  key: string,
  init: T,
  chk: typecheck<T>,
): WritableAtomType<T> {
  return atomWithStorage(key, init, getMainStorage(chk), { getOnInit: true });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function noSetItem<T>(_key: string, _newValue: T): Promise<void> {
  await Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function noRemoveItem(_key: string): Promise<void> {
  await Promise.resolve();
}

export function getMainReadOnlyStorage<T>(chk: typecheck<T>): AsyncStorage<T> {
  return {
    getItem: makeGetReadOnlyItem(chk),
    setItem: noSetItem,
    removeItem: noRemoveItem,
    subscribe: makeReadOnlySubscribe(chk),
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
): (key: string) => PromiseLike<U> {
  return async (key: string): Promise<U> => {
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
): (key: string, callback: (value: U) => void) => Unsub {
  return (key: string, callback: (value: U) => void) => {
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
      getItem: makeGetItemFromCall(chk, identity),
      subscribe: makeSubscribeForCallback(chk, identity),
    };
  } else {
    return {
      getItem: makeGetItemFromCall(chk, xform),
      subscribe: makeSubscribeForCallback(chk, xform),
    };
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
