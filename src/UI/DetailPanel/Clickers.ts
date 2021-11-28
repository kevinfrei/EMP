import { Song, SongKey } from '@freik/media-core';
import { MyTransactionInterface } from '../../Recoil/api';
import { songDetailState } from '../../Recoil/Local';

export function SongDetailClick(
  { set }: MyTransactionInterface,
  song: Song,
  shift?: boolean,
): void {
  set(songDetailState, prev => {
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

export function SongListDetailClick(
  { set }: MyTransactionInterface,
  songs: SongKey[],
  shift?: boolean,
): void {
  set(songDetailState, prev => {
    if (shift) {
      const vals = new Set(prev);
      SetInvert(vals, songs);
      return vals;
    }
    return new Set(songs);
  });
}

// This is a helper to shift-click for song details
export function SongListDetailContextMenuClick(
  xact: MyTransactionInterface,
  items: SongKey[],
) {
  return (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    const shift = event.shiftKey === true;
    SongListDetailClick(xact, items, shift);
  };
}
