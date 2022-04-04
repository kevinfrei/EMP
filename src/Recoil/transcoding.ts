import { MakeError, Type } from '@freik/core-utils';
import { Effects } from '@freik/elect-render-utils';
import { atom } from 'recoil';
import { IpcId, TranscodeState } from 'shared';

const err = MakeError('transcoding-recoil');

function IsTranscodeState(val: unknown): val is TranscodeState {
  return Type.isSpecificType(
    val,
    [
      ['completed', Type.isNumber],
      ['failed', Type.isNumber],
      ['pending', Type.isNumber],
      ['status', Type.isArrayOfString],
      ['errors', Type.isArrayOfString],
    ],
    ['completed', 'failed', 'pending', 'status', 'errors'],
  );
}

const emptyXcode = {
  completed: 0,
  failed: 0,
  pending: 0,
  status: [],
  errors: [],
};
export const transcodingState = atom<TranscodeState>({
  key: 'transcodeState',
  default: { completed: 0, failed: 0, pending: 0, status: [], errors: [] },
  effects_UNSTABLE: [
    Effects.oneWayFromMain(
      async (): Promise<TranscodeState> => {
        return Promise.resolve({ ...emptyXcode });
      },
      IpcId.TranscodingUpdate,
      (mxu: unknown) => {
        if (IsTranscodeState(mxu)) {
          return mxu;
        }
        err('Invalid result from music-xcode-update:');
        err(mxu);
      },
    ),
  ],
});
