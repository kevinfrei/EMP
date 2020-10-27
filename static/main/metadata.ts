import { FTON, FTONData, MakeLogger, ObjUtil, Type } from '@freik/core-utils';
import { Attributes, FullMetadata, MD } from '@freik/media-utils';
import * as persist from './persist';

const log = MakeLogger('metadata', true);

declare type NestedValue =
  | NestedObject
  | NestedValue[]
  | number
  | string
  | boolean;
declare type NestedObject = { [key: string]: NestedValue };

function flatten(obj: NestedObject): Map<string, string> {
  const result = new Map<string, string>();
  const walkChildren = (prefix: string, data: NestedValue) => {
    if (Type.isNumber(data)) {
      result.set(prefix, data.toString());
    } else if (Type.isBoolean(data)) {
      result.set(prefix, data ? 'true' : 'false');
    } else if (Type.isString(data)) {
      result.set(prefix, data);
    } else {
      const pfx = prefix.length > 0 ? prefix + '.' : prefix;
      if (Type.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          walkChildren(`${pfx}${i}`, data[i]);
        }
      } else if (Type.isObject(data)) {
        for (const i in data) {
          if (ObjUtil.has(i, data)) {
            walkChildren(`${pfx}${i}`, data[i]);
          }
        }
      }
    }
  };
  walkChildren('', obj);
  return result;
}

export async function getMediaInfo(
  mediaPath: string,
): Promise<Map<string, string>> {
  const trackInfo = await MD.RawMetadata(mediaPath);
  const maybeSimple = await MD.fromFileAsync(mediaPath);
  const simple: NestedObject = ((maybeSimple as any) as NestedObject) || {};
  const maybeFull = maybeSimple
    ? MD.FullFromObj(mediaPath, (maybeSimple as any) as Attributes)
    : null;
  const full: NestedObject = ((maybeFull as any) as NestedObject) || {};
  let res: Map<string, string>;
  if (Type.isObjectNonNull(trackInfo)) {
    delete trackInfo.native;
    delete trackInfo.quality;
    log('good metadata:');
    log(trackInfo);
    trackInfo.simple = simple;
    trackInfo.full = full;
    delete trackInfo.full.originalPath;
    res = flatten(trackInfo as NestedObject);
  } else {
    log('Bad metadata');
    delete full.originalPath;
    res = flatten({ simple, full });
  }
  res.set('File Path', mediaPath);
  return res;
}

export type MetadataCache = {
  get: (path: string) => FullMetadata | void;
  set: (path: string, md: FullMetadata) => void;
  fail: (path: string) => void;
  shouldTry: (path: string) => boolean;
  save: () => Promise<void>;
  load: () => Promise<boolean>;
};

export function isFullMetadata(obj: unknown): obj is FullMetadata {
  // TODO: Make this thing actually check :)
  return true;
}

function MakeMetadataCache() {
  // The lookup for metadata
  const cache = new Map<string, FullMetadata>();
  // A flag to keep track of if we've changed anything
  let dirty = false;
  // The set of stuff we've already attempted and failed to get MD for
  const stopTrying = new Set<string>();

  function get(path: string) {
    return cache.get(path);
  }
  function set(path: string, md: FullMetadata) {
    const curMd = get(path);
    if (
      curMd &&
      FTON.stringify(curMd as FTONData) === FTON.stringify(md as FTONData)
    ) {
      return;
    }
    dirty = true;
    cache.set(path, md);
    stopTrying.delete(path);
  }
  function fail(path: string) {
    if (stopTrying.has(path)) {
      return;
    }
    dirty = true;
    stopTrying.add(path);
  }
  function shouldTry(path: string) {
    return !stopTrying.has(path);
  }
  async function save() {
    if (!dirty) {
      log('Not saving: Cache is not dirty');
      return;
    }
    log('Saving cache back to disk');
    const valueToSave = {
      cache: [...cache.values()] as FTONData,
      fails: [...stopTrying],
    };
    dirty = false;
    await persist.setItemAsync('metadataCache', FTON.stringify(valueToSave));
  }
  async function load() {
    const fromFile = await persist.getItemAsync('metadataCache');
    if (!fromFile) {
      log('MDC File Not Found');
      return false;
    }
    const valuesToRestore = FTON.parse(fromFile);
    if (
      !Type.has(valuesToRestore, 'cache') ||
      !Type.has(valuesToRestore, 'fails')
    ) {
      log('MDC: Format failure');
      return false;
    }
    if (
      !Type.isArray(valuesToRestore.cache) ||
      !Type.isArrayOf(valuesToRestore.fails, Type.isString)
    ) {
      log('MDC: Deep format failure');
      return false;
    }
    cache.clear();
    let okay = true;
    valuesToRestore.cache.forEach((val: unknown) => {
      if (isFullMetadata(val)) {
        cache.set(val.originalPath, val);
      } else {
        log(`MDC: failure for ${FTON.stringify(val as FTONData)}`);
        okay = false;
      }
    });
    stopTrying.clear();
    valuesToRestore.fails.forEach((val) => stopTrying.add(val));
    dirty = !okay;
    log(`MDC Load ${okay ? 'Success' : 'Failure'}`);
    return okay;
  }
  return { get, set, fail, shouldTry, save, load };
}

export async function GetMetadataCache(): Promise<MetadataCache> {
  const res = MakeMetadataCache();
  if (!(await res.load())) log('Loading Metadata Cache failed');
  return res;
}
