// @flow
import React from 'react';
import Store from '../MyStore';
import { GetDataForSong } from '../DataAccess';

const MixedSongLine = ({ songKey }) => {
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
  const albums = store.get('Albums');
  const artists = store.get('Artists');
  const sng = Array.from(songs.values());
  sng.sort((a, b) => {
    const aArt = artists.get(a.artistIds[0]).name.toLowerCase();
    const bArt = artists.get(b.artistIds[0]).name.toLowerCase();
    let res = aArt.localeCompare(bArt);
    if (res !== 0) {
      return res;
    }
    const aAlb = albums.get(a.albumId).title.toLowerCase();
    const bAlb = albums.get(b.albumId).title.toLowerCase();
    res = aAlb.localeCompare(bAlb);
    if (res !== 0) {
      return res;
    }
    if (a.track === b.track) {
      return 0;
    }
    return a.track < b.track ? -1 : 1;
  });
  return (
    <div>
      {sng.map((s) => (
        <MixedSongLine key={s.key} songKey={s.key} />
      ))}
    </div>
  );
};

export default MixedSongsView;
