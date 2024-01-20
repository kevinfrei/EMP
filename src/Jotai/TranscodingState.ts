import {
  IpcId,
  StorageKey,
  TranscodeSourceType,
  TranscodeState,
} from '@freik/emp-shared';
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
import { atomFromMain, atomWithMainStorage } from './Helpers';
import { allAlbumsAtom, allArtistsAtom } from './MusicDatabase';
import { allPlaylistsAtom } from './Playlists';

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

export const transcodeStatusAtom = atomFromMain(
  IpcId.TranscodingUpdate,
  isTranscodeState,
);

export const sourceLocationTypeAtom = atom(TranscodeSourceType.Playlist);

export const sourceLocationDirState = atomWithMainStorage(
  StorageKey.TranscodeSrcDir,
  '',
  isString,
);

export const sourceLocationPlaylistAtom = atomWithMainStorage<PlaylistName>(
  StorageKey.TranscodeSrcPlaylist,
  '',
  isString,
);

export const sourceLocationArtistAtom = atomWithMainStorage<ArtistKey>(
  StorageKey.TranscodeSrcArtist,
  '',
  isArtistKey,
);

export const sourceLocationAlbumAtom = atomWithMainStorage<AlbumKey>(
  StorageKey.TranscodeSrcAlbum,
  '',
  isAlbumKey,
);

const validPlaylistAtomFam = atomFamily((plName: PlaylistName) =>
  atom(async (get) => {
    return (await get(allPlaylistsAtom)).has(plName);
  }),
);

const validArtistAtomFam = atomFamily((artistKey: ArtistKey) =>
  atom(async (get) => {
    return (await get(allArtistsAtom)).has(artistKey);
  }),
);

const validAlbumAtomFam = atomFamily((albumKey: AlbumKey) =>
  atom(async (get) => {
    return (await get(allAlbumsAtom)).has(albumKey);
  }),
);

export const validSourceAtom = atom(async (get) => {
  const sel = get(sourceLocationTypeAtom);
  switch (sel) {
    case TranscodeSourceType.Playlist:
      return await get(
        validPlaylistAtomFam(await get(sourceLocationPlaylistAtom)),
      );
    case TranscodeSourceType.Artist:
      return await get(validArtistAtomFam(await get(sourceLocationArtistAtom)));
    case TranscodeSourceType.Album:
      return await get(validAlbumAtomFam(await get(sourceLocationAlbumAtom)));
    case TranscodeSourceType.Disk:
      return (await get(sourceLocationDirState)).length > 0;
  }
});

export const sourceLocationDescriptorAtom = atom(async (get) => {
  let loc: string;
  const type = get(sourceLocationTypeAtom);
  switch (type) {
    case TranscodeSourceType.Playlist:
      loc = await get(sourceLocationPlaylistAtom);
      break;
    case TranscodeSourceType.Artist:
      loc = await get(sourceLocationArtistAtom);
      break;
    case TranscodeSourceType.Album:
      loc = await get(sourceLocationAlbumAtom);
      break;
    case TranscodeSourceType.Disk:
      loc = await get(sourceLocationDirState);
      break;
  }
  return { type, loc };
});

export const destLocationAtom = atomWithMainStorage(
  StorageKey.TranscodeDest,
  '',
  isString,
);

export const xcodeBitRateAtom = atomWithMainStorage(
  StorageKey.TranscodeBitRate,
  128,
  isNumber,
);
