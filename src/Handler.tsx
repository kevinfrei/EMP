import { Logger, FTON, Comparisons } from '@freik/core-utils';

import { ValidKeyNames } from './MyStore';

import { PlaysetsComp } from './Sorters';

import type { IpcRendererEvent } from 'electron';
import type { FTONData } from '@freik/core-utils';
import type { StoreState, SongKey, MediaInfo } from './MyStore';
import {
  ClearTimeout,
  IpcOn,
  IpcSend,
  SetPromiseFuncs,
  SetTimeout,
} from './MyWindow';

export type KeyValue = {
  key: string;
  value: unknown;
};
export declare type RemoteDataTypes = SongKey[] &
  string &
  Map<string, SongKey[]> &
  number &
  boolean;

const log = Logger.bind('handler');
Logger.enable('handler');

const DataFromMainHandler = (store: StoreState, message: string) => {
  try {
    const action: FTONData = FTON.parse(message);
    log('Store message from main process:');
    log(action);
    if (
      typeof action === 'object' &&
      action !== null &&
      'key' in action &&
      typeof action.key === 'string' &&
      'value' in action
    ) {
      const key: string = action.key;
      log(`Message to set ${key} to `);
      log(action.value);
      // Validate that the key is valid
      if (ValidKeyNames.indexOf(key) >= 0) {
        store.set(key as any)(action.value);
        return;
      } else {
        log('Invalid key name - reporting it');
      }
    }
  } catch (e) {
    log('Exception!');
    log(e);
  }
  log('An error occurred');
  log(message);
};

// I need a "has this changed" function, along with a debounce config
type HasChangedFunc<T> = (value: T) => boolean;
type Comparer<T> = (v1: T, v2: T) => boolean;
type SaveConfig<T> = {
  key: string;
  hasChanged: HasChangedFunc<T>;
  delay: number;
  maxDelay: number;
  timeout?: number;
  maxtimeout?: number;
};

// This is a helper that saves a default value in the local closure, and
// returns the struture used to decide if we should send this data back to the
// main process to be saved or not
function makeChangeChecker<T>(
  key: string,
  def: T,
  comp: Comparer<T>,
  delay: number,
  maxDelay: number,
): SaveConfig<T> {
  let prevVal = FTON.parse(FTON.stringify(def as any));
  const hasChanged = (obj: T): boolean => {
    if (!comp(prevVal as any, obj)) {
      prevVal = FTON.parse(FTON.stringify(def as any));
      return true;
    }
    return false;
  };
  return { key, hasChanged, delay, maxDelay };
}

// For each key that should be saved to main (and persisted between runs)
// add a "change checker" here.
const PersistedBetweenRuns: SaveConfig<RemoteDataTypes>[] = [
  // makeChangeChecker('locations', null, Comparisons.ArraySetEqual, 1, 10),
  makeChangeChecker<SongKey[]>(
    'songList',
    [],
    Comparisons.ArraySetEqual,
    500,
    1500,
  ),
  makeChangeChecker<string>(
    'activePlaylistName',
    '',
    Comparisons.StringCaseInsensitiveEqual,
    50,
    150,
  ),
  makeChangeChecker<Map<string, SongKey[]>>(
    'Playlists',
    new Map(),
    PlaysetsComp,
    100,
    1000,
  ),
  makeChangeChecker<number>(
    'volume',
    0.8,
    (a, b) => Math.abs(a - b) < 1e-5,
    100,
    1000,
  ),
  makeChangeChecker<boolean>('muted', false, (a, b) => a !== b, 10, 10),
];

// This registers store subscribers for state changes we're watching
// and requests the initial values from the main process
const HandlePersistence = (store: StoreState) => {
  for (const key of PersistedBetweenRuns) {
    log(`key: ${key.key} subscription`);
    // eslint-disable-next-line
    store
      .on((key.key as unknown) as RemoteDataTypes)
      .subscribe((value: RemoteDataTypes) => {
        if (key.hasChanged(value)) {
          // Cancel the current scheduled update
          if (key.timeout !== null) {
            ClearTimeout(key.timeout);
          }
          // Set this to update in key.delay ms
          key.timeout = SetTimeout(() => {
            // send the packet and cancel the maxDelay
            const mto = key.maxtimeout;
            if (!mto) {
              ClearTimeout(mto);
            }
            if (key.hasChanged(value)) {
              IpcSend('set', FTON.stringify({ key: key.key, value }));
            }
          }, key.delay);
          // If we haven't got a maxtimeout counting down, set one of those too
          if (key.maxtimeout === null) {
            key.maxtimeout = SetTimeout(() => {
              delete key.maxtimeout;
              if (key.hasChanged(value)) {
                IpcSend('set', FTON.stringify({ key: key.key, value }));
              }
            }, key.maxDelay);
          }
        }
      });
    IpcSend('get', key.key);
  }
};

// For anything that should be synchronized, update the effects in Effects.js
export function ConfigureIPC(store: StoreState): void {
  // Handle the 'automatic' persistence stuff
  HandlePersistence(store);
  IpcOn('data', (event: IpcRendererEvent, message: string) => {
    DataFromMainHandler(store, message);
  });
  IpcOn('store', (event: IpcRendererEvent, message: string) => {
    DataFromMainHandler(store, message);
  });
  IpcSend('GetDatabase', 'GetDatabase');
  IpcOn('mediainfo', (event: IpcRendererEvent, message: string) => {
    log('mediainfo received');
    log(message);
    const data = FTON.parse(message);
    if (!data) return;
    if (typeof data !== 'object') return;
    if (!('key' in data)) return;
    if (typeof data.key !== 'string') return;
    if (!('data' in data)) return;
    if (typeof data.data !== 'object') return;
    const mi = store.get('MediaInfoCache');
    mi.set(data.key, (data.data as unknown) as MediaInfo);
    store.set('MediaInfoCache' as any)(mi);
  });
  SetPromiseFuncs();
}
