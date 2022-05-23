import { MakeError, Type } from '@freik/core-utils';
import { Effects } from '@freik/elect-render-utils';
import { atom } from 'recoil';
import { IpcId, TranscodeState } from 'shared';

const err = MakeError('transcoding-recoil');

function isFailType(obj: unknown): obj is { file: string; error: string } {
  return Type.isSpecificType(
    obj,
    [
      ['file', Type.isString],
      ['error', Type.isString],
    ],
    ['file', 'error'],
  );
  return true;
}

function checkArrayOf<T>(
  checker: (obj: unknown) => obj is T,
): (obj: unknown) => obj is T[] {
  return (o: unknown): o is T[] => Type.isArrayOf(o, checker);
}

function IsTranscodeState(val: unknown): val is TranscodeState {
  return Type.isSpecificType(
    val,
    [
      ['curStatus', Type.isString],
      ['dirsScanned', Type.isArrayOfString],
      ['dirsPending', Type.isArrayOfString],
      ['itemsRemoved', Type.isArrayOfString],
      ['filesTranscoded', Type.isArrayOfString],
      ['filesPending', Type.isNumber],
      ['filesUntouched', Type.isNumber],
      ['filesFailed', checkArrayOf(isFailType)],
    ],
    [
      'curStatus',
      'dirsScanned',
      'dirsPending',
      'filesTranscode',
      'filesPending',
      'filesUntouched',
    ],
  );
}

const emptyXcodeInfo: TranscodeState = {
  curStatus: '',
  dirsScanned: [],
  dirsPending: [],
  filesTranscoded: [],
  filesPending: 0,
  filesUntouched: 0,
};

export const transcodeStatusState = atom<TranscodeState>({
  key: IpcId.TranscodingUpdate,
  default: emptyXcodeInfo,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  effects_UNSTABLE: [
    Effects.oneWayFromMain(
      // TODO: I don't think I need to initialize this thing...
      (): TranscodeState => ({
        ...emptyXcodeInfo,
        curStatus: 'Transcoding currently inactive',
      }),
      IpcId.TranscodingUpdate,
      (mxu: unknown) => {
        if (IsTranscodeState(mxu)) {
          return mxu;
        } else {
          err('Invalid transcode state received:');
          err(mxu);
          return {
            ...emptyXcodeInfo,
            curStatus: 'Invalid Transcode state from backend :/',
          };
        }
      },
    ),
  ],
});
