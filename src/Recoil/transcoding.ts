import { MakeError, Type } from '@freik/core-utils';
import { Effects } from '@freik/elect-render-utils';
import { atom } from 'recoil';
import { IpcId, TranscodeState } from 'shared';

const err = MakeError('transcoding-recoil');

type FailType = { file: string; error: string };

const isFailType = Type.isSpecificTypeFn<FailType>(
  [
    ['file', Type.isString],
    ['error', Type.isString],
  ],
  ['file', 'error'],
);

const isTranscodeState = Type.isSpecificTypeFn<TranscodeState>(
  [
    ['curStatus', Type.isString],
    ['dirsScanned', Type.isArrayOfString],
    ['dirsPending', Type.isArrayOfString],
    ['itemsRemoved', Type.isArrayOfString],
    ['filesTranscoded', Type.isArrayOfString],
    ['filesPending', Type.isNumber],
    ['filesUntouched', Type.isNumber],
    ['filesFailed', Type.isArrayOfFn(isFailType)],
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
        if (isTranscodeState(mxu)) {
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
