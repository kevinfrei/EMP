import { MakeLog } from '@freik/logger';
import { Pickle, Unpickle, isPromise, isUndefined } from '@freik/typechk';
import { AtomEffectParams, Fail, onRejected } from '@freik/web-utils';
import { AtomEffect, DefaultValue } from 'recoil';
import {
  ReadFromStorage,
  Subscribe,
  Unsubscribe,
  WriteToStorage,
} from './ipc.js';
import { ListenKey } from './types.js';

const { log, wrn } = MakeLog('@freik:elect-render-tools:effects');

/**
 * At atom effect that uses the provided stringification/destringification
 * functions to get/set a value that gets saved & loaded from the app's
 * persistent data storage (implemented in @freik/elect-main-utils)
 *
 * @template T The type of the atom (implied from the to/fromString functions)
 *
 * @param toString Translation function to a string for communication
 * @param fromString Translation function from a string for communication
 * @returns The Recoil effect
 */
export function translateToMain<T>(
  toString: (input: T) => string,
  fromString: (input: string) => T | void,
): AtomEffect<T> {
  return ({ node, trigger, setSelf, onSet }: AtomEffectParams<T>): void => {
    if (trigger === 'get') {
      ReadFromStorage(node.key)
        .then((value) => {
          if (value) {
            const data = fromString(value);
            if (data) {
              setSelf(data);
            }
          }
        })
        .catch(onRejected(`${node.key} Get failed in translateToMainEffect`));
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newStr = toString(newVal);
      if (oldVal instanceof DefaultValue || newStr !== toString(oldVal)) {
        WriteToStorage(node.key, newStr).catch(
          onRejected(`${node.key} save to main failed`),
        );
      }
    });
  };
}

/**
 * At atom effect for pulling data from the IPC channel, with asynchronous
 * setting from the main process, but with no ability to push data *back*
 * through the IPC channel (i.e. one way from Main :)
 *
 * @template T the type of the atom (implied from the getter)
 *
 * @param get The function (or promise) that gets the value
 * @param asyncKey The key for an asynchronous assignment
 * @param asyncDataCoercion The value that takes the message from Main and
 * translates it to the T datatype (or returns nothing if it's incorrect)
 */
export function oneWayFromMain<T>(
  get: () => T | Promise<T>,
  asyncKey: string,
  asyncDataCoercion: (data: unknown) => T | undefined,
): AtomEffect<T>;

/**
 * At atom effect for pulling data from the IPC channel, with no ability to
 * push data *back* through the IPC channel (i.e. one way from Main :)
 *
 * This version doesn't include the ability to update the value asynchronously
 * from the main process.
 *
 * @template T the type of the atom (implied from the getter)
 *
 * @param get The function (or promise) that gets the value
 */
export function oneWayFromMain<T>(get: () => T | Promise<T>): AtomEffect<T>;

export function oneWayFromMain<T>(
  get: () => T | Promise<T>,
  asyncKey?: string,
  asyncDataCoercion?: (data: unknown) => T | undefined,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      const res = get();
      if (!isPromise(res)) {
        setSelf(res);
      } else {
        res
          .then(setSelf)
          .catch(onRejected(`${node.key} Get failed in oneWayFromMain`));
      }
    }
    let lKey: ListenKey | null = null;
    if (asyncKey && asyncDataCoercion) {
      lKey = Subscribe(asyncKey, (val: unknown) => {
        const theRightType = asyncDataCoercion(val);
        if (!isUndefined(theRightType)) {
          log(`Async data for ${node.key}:`);
          log(theRightType);
          setSelf(theRightType);
        } else {
          wrn(`Async invalid data received for ${node.key}:`);
          wrn(val);
        }
      });
    }
    onSet((newVal /* , oldVal */) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      Fail(`Invalid assignment to server-side-only atom ${node.key}`);
    });
    if (asyncKey) {
      return () => {
        if (lKey) {
          log(`Unsubscribing listener for ${asyncKey}`);
          Unsubscribe(lKey);
        }
      };
    }
  };
}

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified, after processing it from the original type to JSON using Pickling.
 *
 * @template T
 * Type of the atom (implied from the function types passed in)
 *
 * @param toPickleable
 * The function to translate the type T to a pickleable type
 * @param fromUnpickled
 * The function to translate from the pickleable type to T
 * @param asyncUpdates
 * Optionally true if you also need to respond to asynchronous server (main)
 * side changes
 *
 * @returns an AtomEffect<T>
 */
export function bidirectionalSyncWithTranslate<T>(
  toPickleable: (val: T) => unknown,
  fromUnpickled: (val: unknown) => T | void,
  asyncUpdates?: boolean,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      log(`Get trigger for ${node.key}`);
      ReadFromStorage(node.key)
        .then((value) => {
          log(`Got a value from the server for ${node.key}`);
          if (value) {
            log(value);
            log('***');
            const data = fromUnpickled(Unpickle(value));
            log(data);
            if (data) {
              log(`Setting Self for ${node.key}`);
              setSelf(data);
            }
          }
        })
        .catch(onRejected(`${node.key} Get failed in bidirectional sync`));
    }
    let lKey: ListenKey | null = null;
    if (asyncUpdates) {
      lKey = Subscribe(node.key, (val: unknown) => {
        const theRightType = fromUnpickled(val);
        if (typeof theRightType !== 'undefined') {
          log(`Async data for ${node.key}:`);
          log(theRightType);
          setSelf(theRightType);
        } else {
          wrn(`Async invalid data received for ${node.key}:`);
          wrn(val);
        }
      });
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newPickled = Pickle(toPickleable(newVal));
      if (
        oldVal instanceof DefaultValue ||
        Pickle(toPickleable(oldVal)) !== newPickled
      ) {
        log(`Saving ${node.key} back to server...`);
        WriteToStorage(node.key, newPickled)
          .then(() => log(`${node.key} saved properly`))
          .catch(onRejected(`${node.key} save to main failed`));
      }
    });

    if (asyncUpdates) {
      return () => {
        if (lKey) {
          log(`Unsubscribing listener for ${node.key}`);
          Unsubscribe(lKey);
        }
      };
    }
  };
}

/**
 * An Atom effect to acquire the value from main, and save it back when
 * modified, after processing it from the original type to JSON using Pickling.
 *
 * @template T the type of the atom
 *
 * @param asyncUpdates
 * Optionally true if you also need to respond to asynchronous server (main)
 * side changes
 */
export function syncWithMain<T>(asyncUpdates?: boolean): AtomEffect<T> {
  return bidirectionalSyncWithTranslate<T>(
    (a) => a as unknown,
    (a) => a as T,
    asyncUpdates,
  );
}
