import { Album, AlbumKey, SongKey } from '@freik/media-core';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  AlbumDescriptionWithKey,
  SongDescription,
} from '../MusicLibrarySchema';
import { albumByKey, allAlbumsState } from './Albums';
import { artistStringStateFamily } from './Artists';
import { maybeSongByKey } from './Songs';

export const descriptionFromAlbumKey = atomFamily((ak: AlbumKey) =>
  atom(async (get): Promise<AlbumDescriptionWithKey> => {
    const res = { artist: '', album: '', year: '', key: '' };
    if (!ak) {
      return res;
    }
    const album: Album = await get(albumByKey(ak));
    if (album) {
      res.album = album.title;
      res.year = album.year ? album.year.toString() : '';
    }
    res.key = ak;
    if (album.primaryArtists.length) {
      const maybeArtistName = await get(
        artistStringStateFamily(album.primaryArtists),
      );
      if (maybeArtistName) {
        res.artist = maybeArtistName;
      }
    } else if (album.vatype === 'ost') {
      res.artist = 'Soundtrack';
    } else if (album.vatype === 'va') {
      res.artist = 'Compilation';
    } else {
      res.artist = '???';
    }
    return res;
  }),
);

export const allAlbumDescriptionsState = atom(
  async (get): Promise<AlbumDescriptionWithKey[]> => {
    const allAlbums = await get(allAlbumsState);
    return await Promise.all(
      [...allAlbums.keys()].map((l: AlbumKey) =>
        get(descriptionFromAlbumKey(l)),
      ),
    );
  },
);

export const songDescriptionFromSongKey = atomFamily((sk: SongKey) =>
  atom(async (get): Promise<SongDescription> => {
    const res = { title: '', track: 0, artist: '', album: '', year: '' };

    if (sk.length === 0) {
      return res;
    }
    const song = await get(maybeSongByKey(sk));
    if (!song) {
      return res;
    }
    const title = song.title;
    const track = song.track;

    return {
      title,
      track,
      ...(await get(descriptionFromAlbumKey(song.albumId))),
    };
  }),
);

export const songDescriptionFromSongList = atomFamily((sks: SongKey[]) =>
  atom(
    async (get): Promise<SongDescription[]> =>
      Promise.all(
        sks.map((sk: SongKey) => get(songDescriptionFromSongKey(sk))),
      ),
  ),
);

export const maybeDataForSongFunc = atomFamily((sks: SongKey[]) =>
  atom(async (get): Promise<SongDescription | null> => {
    if (sks.length !== 1) {
      return null;
    }
    return await get(songDescriptionFromSongKey(sks[0]));
  }),
);
