import { IpcId, TranscodeSourceType, TranscodeState } from '@freik/emp-shared';
import {
  AlbumKey,
  ArtistKey,
  PlaylistName,
  isAlbumKey,
  isArtistKey,
} from '@freik/media-core';
import {
  chkArrayOf,
  chkObjectOfType,
  isArrayOfString,
  isNumber,
  isString,
} from '@freik/typechk';
import { atom } from 'jotai';
import { atomFromMain, atomWithMainStorage } from './Storage';

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

// const xcodeErr = (curStatus: string) => ({ ...emptyXcodeInfo, curStatus });

export const transcodeStatusState = atomFromMain(
  IpcId.TranscodingUpdate,
  isTranscodeState,
);

export const sourceLocationTypeState = atom(TranscodeSourceType.Playlist);

export const sourceLocationDirState = atomWithMainStorage(
  'xcodeSrcLocDir',
  '',
  isString,
);

export const sourceLocationPlaylistState = atomWithMainStorage<PlaylistName>(
  'xcodeSrcLocPlaylist',
  '',
  isString,
);

export const sourceLocationArtistState = atomWithMainStorage<ArtistKey>(
  'xcodeSrcLocArtist',
  '',
  isArtistKey,
);

export const sourceLocationAlbumState = atomWithMainStorage<AlbumKey>(
  'xcodeSrcLocAlbum',
  '',
  isAlbumKey,
);

// const validPlaylist = atomFamily<PlaylistName, boolean>(
//   (param: string) =>
//     (plName: PlaylistName) =>
//     ({ get }) => {
//       return get(allPlaylistsFunc).has(plName);
//     },
// });

// const validArtist = selectorFamily<boolean, ArtistKey>({
//   key: 'validArtist',
//   get:
//     (artistKey: ArtistKey) =>
//     ({ get }) => {
//       return get(allArtistsFunc).has(artistKey);
//     },
// });

// const validAlbum = selectorFamily<boolean, AlbumKey>({
//   key: 'validAlbum',
//   get:
//     (albumKey: AlbumKey) =>
//     ({ get }) => {
//       return get(allAlbumsFunc).has(albumKey);
//     },
// });

// export const validSourceFunc = selector<boolean>({
//   key: 'xcodeValidSource',
//   get: ({ get }) => {
//     const sel = get(sourceLocationTypeState);
//     switch (sel) {
//       case TranscodeSourceType.Playlist:
//         return get(validPlaylist(get(sourceLocationPlaylistState)));
//       case TranscodeSourceType.Artist:
//         return get(validArtist(get(sourceLocationArtistState)));
//       case TranscodeSourceType.Album:
//         return get(validAlbum(get(sourceLocationAlbumState)));
//       case TranscodeSourceType.Disk:
//         return get(sourceLocationDirState).length > 0;
//     }
//   },
// });

// export const sourceLocationDescriptorFunc = selector<{
//   type: TranscodeSourceType;
//   loc: string;
// }>({
//   key: 'xcodeSourceLocDescr',
//   get: ({ get }) => {
//     let loc: string;
//     const type = get(sourceLocationTypeState);
//     switch (type) {
//       case TranscodeSourceType.Playlist:
//         loc = get(sourceLocationPlaylistState);
//         break;
//       case TranscodeSourceType.Artist:
//         loc = get(sourceLocationArtistState);
//         break;
//       case TranscodeSourceType.Album:
//         loc = get(sourceLocationAlbumState);
//         break;
//       case TranscodeSourceType.Disk:
//         loc = get(sourceLocationDirState);
//         break;
//     }
//     return { type, loc };
//   },
// });

export const destLocationState = atomWithMainStorage(
  'xcodeDstLoc',
  '',
  isString,
);

export const xcodeBitRateState = atomWithMainStorage(
  'xcodeBitRate',
  128,
  isNumber,
);
