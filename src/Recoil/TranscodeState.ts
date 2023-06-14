import { Effects } from '@freik/elect-render-utils';
import { AlbumKey, ArtistKey, PlaylistName } from '@freik/media-core';
import {
  chkArrayOf,
  chkObjectOfType,
  isArrayOfString,
  isNumber,
  isString,
} from '@freik/typechk';
import { atom, selector, selectorFamily } from 'recoil';
import { IpcId, TranscodeSourceType, TranscodeState } from 'shared';
import { allPlaylistsFunc } from './PlaylistsState';
import { allAlbumsFunc, allArtistsFunc } from './ReadOnly';

// const { err, log } = MakeLog('EMP:render:TranscodingState');

type FailType = { file: string; error: string };

const isFailType = chkObjectOfType<FailType>({
  file: isString,
  error: isString,
});

const isTranscodeState = chkObjectOfType<TranscodeState>(
  {
    curStatus: isString,
    filesFound: isNumber,
    filesPending: isNumber,
    filesTranscoded: isArrayOfString,
    filesUntouched: isNumber,
  },
  {
    filesFailed: chkArrayOf<FailType>(isFailType),
    itemsRemoved: isArrayOfString,
  },
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

export const sourceLocationTypeState = atom<TranscodeSourceType>({
  key: 'xcodeSrcLocType',
  default: TranscodeSourceType.Playlist,
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

const validPlaylist = selectorFamily<boolean, PlaylistName>({
  key: 'validPlaylist',
  get:
    (plName: PlaylistName) =>
    ({ get }) => {
      return get(allPlaylistsFunc).has(plName);
    },
});

const validArtist = selectorFamily<boolean, ArtistKey>({
  key: 'validArtist',
  get:
    (artistKey: ArtistKey) =>
    ({ get }) => {
      return get(allArtistsFunc).has(artistKey);
    },
});

const validAlbum = selectorFamily<boolean, AlbumKey>({
  key: 'validAlbum',
  get:
    (albumKey: AlbumKey) =>
    ({ get }) => {
      return get(allAlbumsFunc).has(albumKey);
    },
});

export const validSourceFunc = selector<boolean>({
  key: 'xcodeValidSource',
  get: ({ get }) => {
    const sel = get(sourceLocationTypeState);
    switch (sel) {
      case TranscodeSourceType.Playlist:
        return get(validPlaylist(get(sourceLocationPlaylistState)));
      case TranscodeSourceType.Artist:
        return get(validArtist(get(sourceLocationArtistState)));
      case TranscodeSourceType.Album:
        return get(validAlbum(get(sourceLocationAlbumState)));
      case TranscodeSourceType.Disk:
        return get(sourceLocationDirState).length > 0;
    }
  },
});

export const sourceLocationDescriptorFunc = selector<{
  type: TranscodeSourceType;
  loc: string;
}>({
  key: 'xcodeSourceLocDescr',
  get: ({ get }) => {
    let loc: string;
    const type = get(sourceLocationTypeState);
    switch (type) {
      case TranscodeSourceType.Playlist:
        loc = get(sourceLocationPlaylistState);
        break;
      case TranscodeSourceType.Artist:
        loc = get(sourceLocationArtistState);
        break;
      case TranscodeSourceType.Album:
        loc = get(sourceLocationAlbumState);
        break;
      case TranscodeSourceType.Disk:
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
