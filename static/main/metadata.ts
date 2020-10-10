import { MakeLogger, ObjUtil, Type } from '@freik/core-utils';
import { MD } from '@freik/media-utils';

const log = MakeLogger('metadata');

/*
function addCommas(val: string): string {
  let res = '';
  let i: number;
  for (i = val.length - 3; i > 0; i -= 3) {
    res = ',' + val.substr(i, 3) + res;
  }
  res = val.substr(0, i + 3) + res;
  if (res.startsWith(',')) {
    res = res.substr(1);
  }
  return res;
}

function secondsToHMS(vals: string): string {
  const decimal = vals.indexOf('.');
  let suffix: string = decimal > 0 ? vals.substr(decimal) : '';
  suffix = suffix.replace(/0+$/g, '');
  suffix = suffix.length === 1 ? '' : suffix;
  const val = parseInt(vals, 10);
  const expr = new Date(val * 1000).toISOString();
  if (val < 600) {
    return expr.substr(15, 4) + suffix;
  } else if (val < 3600) {
    return expr.substr(14, 5) + suffix;
  } else if (val < 36000) {
    return expr.substr(12, 7) + suffix;
  } else {
    return expr.substr(11, 8) + suffix;
  }
}

function divGrand(val: string): string {
  let flt = (parseFloat(val) / 1000.0).toFixed(3);
  flt = flt.replace(/0+$/g, '');
  flt = flt.endsWith('.') ? flt.substr(0, flt.length - 1) : flt;
  return flt;
}

function toKhz(val: string): string {
  return divGrand(val) + ' KHz';
}

function toKbps(val: string): string {
  return divGrand(val) + ' Kbps';
}

function cleanupName(val: string): string {
  return val.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ': ');
}

const mediaInfoTranslation = new Map([
  ['FileSize', addCommas],
  ['Duration', secondsToHMS],
  ['SamplingRate', toKhz],
  ['BitRate', toKbps],
]);

function objToMap(o: { [key: string]: string | number }): Map<string, string> {
  const res = new Map<string, string>();
  for (const i in o) {
    if (typeof i === 'string' && i.length > 0 && !i.startsWith('@') && i in o) {
      const type = typeof o[i];
      if (type === 'string' || type === 'number') {
        const translator = mediaInfoTranslation.get(i) || ((j) => j);
        res.set(cleanupName(i), translator(o[i].toString()));
      }
    }
  }
  return res;
}

const toRemove = [
  'Audio Count',
  'Cover',
  'Cover: Type',
  'Cover: Mime',
  'Stream Size',
  'Header Size',
  'Data Size',
  'Footer Size',
  'Overall Bit Rate',
  'Overall Bit Rate: Mode',
  'Codec ID: Compatible',
  'Is Streamable',
  'Encoded: Application',
  'Encoded: Library',
  'Encoded: Library: Name',
  'Encoded: Library: Date',
  'Encoded: Library: Version',
  'Samples Per Frame',
  'Sampling Count',
  'Frame Rate',
  'Frame Count',
  'Stream Size',
  'Stream Size: Proportion',
  'Duration: Last Frame',
  'Stream Order',
];

const toChange = new Map([
  [
    'track',
    (data: FTONData): string => {
      if (ObjUtil.has('no', data) && Type.isNumber(data.no)) {
        return data.no.toString();
      }
      return '';
    },
  ],
]);
*/

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
  if (!Type.isObjectNonNull(trackInfo)) {
    log('Bad metadata');
    return new Map();
  } else {
    delete trackInfo.native;
    delete trackInfo.quality;
    log('good metadata:');
    log(trackInfo);
    const res = flatten(trackInfo as NestedObject);
    res.set('File path', mediaPath);
    return res;
  }
}
