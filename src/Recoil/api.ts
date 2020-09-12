import { atom } from 'recoil';

import type { SongKey } from '../MyStore';

export const StartSongPlayingAtom = atom<number>({
  key: 'StartSongPlaying',
  default: -1,
});

// This stops playback and clears the active playlist
export const StopAndClearAtom = atom<boolean>({
  key: 'StopAndClear',
  default: false,
});

export const DeletePlaylistAtom = atom<string>({
  key: 'DeletePlaylist',
  default: '',
});

export const RemoveSongNumberAtom = atom<number>({
  key: 'RemoveSongNumber',
  default: -1,
});

export const AddSongListAtom = atom<SongKey[]>({
  key: 'AddSongList',
  default: [],
});

export const AddSongAtom = atom<SongKey>({
  key: 'AddSong',
  default: '',
});

export const AddAlbumAtom = atom<AlbumKey>({
  key: 'AddAlbum',
  default: '',
});

export const AddArtistAtom = atom<ArtistKey>({
  key: 'AddArtist',
  default: '',
});
