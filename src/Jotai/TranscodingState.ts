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
import { atomFamily } from 'jotai/utils';
import { allAlbumsFunc, allArtistsFunc } from './MusicDatabase';
import { allPlaylistsFunc } from './Playlists';
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

const validPlaylist = atomFamily((plName: PlaylistName) =>
  atom(async (get) => {
    return (await get(allPlaylistsFunc)).has(plName);
  }),
);

const validArtist = atomFamily((artistKey: ArtistKey) =>
  atom(async (get) => {
    return (await get(allArtistsFunc)).has(artistKey);
  }),
);

const validAlbum = atomFamily((albumKey: AlbumKey) =>
  atom(async (get) => {
    return (await get(allAlbumsFunc)).has(albumKey);
  }),
);

export const validSourceFunc = atom(async (get) => {
  const sel = get(sourceLocationTypeState);
  switch (sel) {
    case TranscodeSourceType.Playlist:
      return await get(validPlaylist(await get(sourceLocationPlaylistState)));
    case TranscodeSourceType.Artist:
      return await get(validArtist(await get(sourceLocationArtistState)));
    case TranscodeSourceType.Album:
      return await get(validAlbum(await get(sourceLocationAlbumState)));
    case TranscodeSourceType.Disk:
      return (await get(sourceLocationDirState)).length > 0;
  }
});

export const sourceLocationDescriptorFunc = atom(async (get) => {
  let loc: string;
  const type = get(sourceLocationTypeState);
  switch (type) {
    case TranscodeSourceType.Playlist:
      loc = await get(sourceLocationPlaylistState);
      break;
    case TranscodeSourceType.Artist:
      loc = await get(sourceLocationArtistState);
      break;
    case TranscodeSourceType.Album:
      loc = await get(sourceLocationAlbumState);
      break;
    case TranscodeSourceType.Disk:
      loc = await get(sourceLocationDirState);
      break;
  }
  return { type, loc };
});

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
