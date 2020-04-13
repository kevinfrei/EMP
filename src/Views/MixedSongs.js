// @flow
import React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';

import type { SongKey, Song } from '../MyStore';

const MixedSongLine = ({ songKey }: { songKey: SongKey }) => {
  const store = Store.useStore();
  const setter = store.set('curSong');
  const { title, track, album, artist } = GetDataForSong(store, songKey);
  return (
    <div onClick={() => setter(songKey)}>
      <div>{`${artist} - ${album}: ${track} - ${title}`}</div>
    </div>
  );
};

const MixedSongsView = () => {
  let store = Store.useStore();
  const songs = store.get('Songs');
  const sngs: Array<SongKey> = Array.from(songs.values()).map((s:Song) => s.key);
  sngs.sort((a: SongKey, b: SongKey) => {
    const {
      title: aTitle,
      track: aTrack,
      album: aAlbum,
      artist: aArtist,
    } = GetDataForSong(store, a);
    const {
      title: bTitle,
      track: bTrack,
      album: bAlbum,
      artist: bArtist,
    } = GetDataForSong(store, b);
    let res = aArtist
      .toLocaleLowerCase()
      .localeCompare(bArtist.toLocaleLowerCase());
    if (res !== 0) {
      return res;
    }
    res = aAlbum.toLocaleLowerCase().localeCompare(bAlbum.toLocaleLowerCase());
    if (res !== 0) {
      return res;
    }
    return aTrack - bTrack;
  });
  return (
    <div>
      {sngs.map((s) => (
        <MixedSongLine key={s} songKey={s} />
      ))}
    </div>
  );
};

export default MixedSongsView;
