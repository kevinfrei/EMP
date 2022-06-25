import { MakeError, Type } from '@freik/core-utils';
import { Effects } from '@freik/elect-render-utils';
import { AlbumKey, ArtistKey, PlaylistName } from '@freik/media-core';
import { atom, selector } from 'recoil';
import { IpcId, TranscodeState } from 'shared';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    ['filesFound', Type.isNumber],
    ['filesPending', Type.isNumber],
    ['filesTranscoded', Type.isArrayOfString],
    ['filesUntouched', Type.isNumber],
    ['filesFailed', Type.isArrayOfFn(isFailType)],
    ['itemsRemoved', Type.isArrayOfString],
  ],
  [
    'curStatus',
    'filesFound',
    'filesTranscoded',
    'filesPending',
    'filesUntouched',
  ],
);

const emptyXcodeInfo: TranscodeState = {
  curStatus: '',
  filesFound: 0,
  filesPending: 0,
  filesUntouched: 0,
  filesTranscoded: [],
};

const xcodeErr = (curStatus: string) => ({ ...emptyXcodeInfo, curStatus });

export const transcodeStatusState = atom<TranscodeState>({
  key: IpcId.TranscodingUpdate,
  default: emptyXcodeInfo,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  effects: [
    Effects.oneWayFromMain(
      // TODO: I don't think I need to initialize this thing...
      (): TranscodeState => xcodeErr('Transcoding currently inactive'),
      IpcId.TranscodingUpdate,
      (mxu: unknown) =>
        isTranscodeState(mxu)
          ? mxu
          : xcodeErr('Invalid Transcode state from backend :/'),
    ),
  ],
});

export const sourceLocationTypeState = atom<'p' | 'r' | 'l' | 'd'>({
  key: 'xcodeSrcLocType',
  default: 'p',
});

export const sourceLocationDirState = atom<string>({
  key: 'xcodeSrcLocDir',
  default: '',
  effects: [Effects.syncWithMain<string>()],
});

export const sourceLocationPlaylistState = atom<PlaylistName>({
  key: 'xcodeSrcLocPlaylist',
  default: '',
  effects: [Effects.syncWithMain<PlaylistName>()],
});

export const sourceLocationArtistState = atom<ArtistKey>({
  key: 'xcodeSrcLocArtist',
  default: '',
  effects: [Effects.syncWithMain<ArtistKey>()],
});

export const sourceLocationAlbumState = atom<AlbumKey>({
  key: 'xcodeSrcLocAlbum',
  default: '',
  effects: [Effects.syncWithMain<AlbumKey>()],
});

export const validSourceState = selector<boolean>({
  key: 'xcodeValidSource',
  get: ({ get }) => {
    const sel = get(sourceLocationTypeState);
    switch (sel) {
      case 'p':
        return get(sourceLocationPlaylistState).length > 0;
      case 'r':
        return get(sourceLocationArtistState).length > 0;
      case 'l':
        return get(sourceLocationAlbumState).length > 0;
      case 'd':
        return get(sourceLocationDirState).length > 0;
    }
  },
});

export const sourceLocationDescriptorState = selector<{
  type: 'p' | 'd' | 'r' | 'l';
  loc: string;
}>({
  key: 'xcodeSourceLocDescr',
  get: ({ get }) => {
    let loc: string;
    const type = get(sourceLocationTypeState);
    switch (type) {
      case 'p':
        loc = get(sourceLocationPlaylistState);
        break;
      case 'r':
        loc = get(sourceLocationArtistState);
        break;
      case 'l':
        loc = get(sourceLocationAlbumState);
        break;
      case 'd':
        loc = get(sourceLocationDirState);
        break;
    }
    return { type, loc };
  },
});

export const destLocationState = atom<string>({
  key: 'xcodeDstLoc',
  default: '',
  effects: [Effects.syncWithMain<string>()],
});

export const xcodeBitRateState = atom<number>({
  key: 'xcodeBitRate',
  default: 128,
  effects: [Effects.syncWithMain<number>()],
});
