import { atom } from 'recoil';

import type { SongKey, AlbumKey, ArtistKey } from '../MyStore';

export const startSongPlayingAtom = atom<number>({
  key: 'StartSongPlaying',
  default: -1,
});

// This stops playback and clears the active playlist
export const stopAndClearAtom = atom<boolean>({
  key: 'StopAndClear',
  default: false,
});

export const deletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

export const removeSongNumberAtom = atom<number>({
  key: 'RemoveSongNumber',
  default: -1,
});

export const addSongListAtom = atom<SongKey[]>({
  key: 'AddSongList',
  default: [],
});

export const addSongAtom = atom<SongKey>({
  key: 'AddSong',
  default: '',
});

export const addAlbumAtom = atom<AlbumKey>({
  key: 'AddAlbum',
  default: '',
});

export const addArtistAtom = atom<ArtistKey>({
  key: 'AddArtist',
  default: '',
});

export const startPlaylistAtom = atom<string>({
  key: 'StartPlaylist',
  default: '',
});

export const startNextSongAtom = atom<boolean>({
  key: 'nextTrack',
  default: false,
});

export const startPrevSongAtom = atom<boolean>({
  key: 'prevTrack',
  default: false,
});

export const shuffleNowPlayingAtom = atom<boolean>({
  key: 'shuffleNowPlaying',
  default: false,
});
