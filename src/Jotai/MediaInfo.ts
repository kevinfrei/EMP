import { MakeLog } from '@freik/logger';
import { SongKey } from '@freik/media-core';
import { Fail } from '@freik/web-utils';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import * as ipc from '../ipc';
import { diskNumName, MetadataProps, SongInfo } from '../MusicLibrarySchema';
import { albumByKey } from './Albums';
import { artistStringStateFamily } from './Artists';
import { songByKey } from './Songs';

const { log } = MakeLog('EMP:render:Jotai:MediaInfo');

export const mediaInfoStateFamily = atomFamily((sk: SongKey) =>
  atom(async () => {
    if (!sk) return new Map<string, string>();
    const result = await ipc.GetMediaInfo(sk);
    if (!result) {
      Fail(sk, 'Unfound song key');
    }
    log(`Got media info for ${sk}:`);
    log(result);
    return result;
  }),
);

export const commonMetadataFromSongKeys = atomFamily((keys: SongKey[]) =>
  atom(async (get) => {
    const theSongsData: SongInfo[] = await Promise.all(
      keys.map(async (songKey) => {
        const song = await get(songByKey(songKey));
        const artists = await get(artistStringStateFamily(song.artistIds));
        const moreArtists = await get(
          artistStringStateFamily(song.secondaryIds),
        );
        const album = await get(albumByKey(song.albumId));
        return { song, artists, moreArtists, album };
      }),
    );
    let artist: string | null = null;
    let albumTitle: string | null = null;
    let year: string | null = null;
    let va: 'va' | 'ost' | '' | null = null;
    let moreArtistsList: string | null = null;
    let variations: string | null = null;
    let albumId: string | null = null;
    let diskNum: string | null = null;
    let diskName: string | null = null;
    let first = true;
    for (const songData of theSongsData) {
      if (first) {
        artist = songData.artists;
        albumTitle = songData.album.title;
        year =
          songData.album.year !== 0 ? songData.album.year.toString() : null;
        va = songData.album.vatype;
        moreArtistsList = songData.moreArtists;
        variations = songData.song.variations
          ? songData.song.variations.join(';')
          : null;
        albumId = songData.album.key;
        first = false;
        [diskNum, diskName] = diskNumName(songData);
      } else {
        if (artist !== songData.artists) artist = null;
        if (albumTitle !== songData.album.title) albumTitle = null;
        if (year !== songData.album.year.toString()) year = null;
        if (va !== songData.album.vatype) va = null;
        if (moreArtistsList !== songData.moreArtists) moreArtistsList = null;
        if (variations !== songData.song.variations?.join(';'))
          variations = null;
        if (albumId !== songData.album.key) albumId = null;
        const [thisDiskNum, thisDiskName] = diskNumName(songData);
        if (diskNum !== thisDiskNum) diskNum = null;
        if (diskName !== thisDiskName) diskName = null;
      }
    }
    const props: MetadataProps = {};
    if (artist !== null) {
      props.artist = artist;
    }
    if (albumTitle !== null) {
      props.album = albumTitle;
    }
    if (year !== null) {
      props.year = year;
    }
    if (va !== null) {
      props.va = va;
    }
    if (variations !== null) {
      props.variations = variations;
    }
    if (moreArtistsList !== null) {
      props.moreArtists = moreArtistsList;
    }
    if (albumId !== null) {
      props.albumId = albumId;
    }
    if (diskName !== null) {
      props.diskName = diskName;
    }
    return props;
  }),
);
