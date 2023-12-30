import { Song, SongKey } from '@freik/media-core';
import { songDetailState } from '../../Jotai/Local';
import { getStore } from '../../Jotai/Storage';

export function SongDetailClick(song: Song, shift?: boolean): void {
  const store = getStore();
  store.set(songDetailState, (prev) => {
    const vals = new Set(shift ? prev : []);
    if (shift && prev.has(song.key)) {
      vals.delete(song.key);
    } else {
      vals.add(song.key);
    }
    return vals;
  });
}

function SetInvert<T>(theSet: Set<T>, toToggle: Iterable<T>): void {
  for (const item of toToggle) {
    if (theSet.has(item)) {
      theSet.delete(item);
    } else {
      theSet.add(item);
    }
  }
}

export function SongListDetailClick(songs: SongKey[], shift?: boolean): void {
  const store = getStore();
  store.set(songDetailState, (prev) => {
    if (shift) {
      const vals = new Set(prev);
      SetInvert(vals, songs);
      return vals;
    }
    return new Set(songs);
  });
}

// This is a helper to shift-click for song details
export function SongListDetailContextMenuClick(items: SongKey[]) {
  return (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    const shift = event.shiftKey === true;
    SongListDetailClick(items, shift);
  };
}
