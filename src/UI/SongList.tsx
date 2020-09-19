// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import {
  DetailsRow,
  getTheme,
  IColumn,
  IDetailsListProps,
  IDetailsRowStyles,
} from '@fluentui/react';

import type { Album, AlbumKey, ArtistKey, Song, SongKey } from '../DataSchema';
import { useRecoilValue } from 'recoil';
import {
  albumByKeySel,
  artistStringSel,
  songFromKey,
} from '../Recoil/MusicDbAtoms';

export function makeColumns<T>(
  getSort: () => string,
  performSort: (srt: string) => void,
  ...renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: T) => JSX.Element,
  ][]
): IColumn[] {
  const localSort = (which: string) => {
    const curSort = getSort();
    // This rearranges the sort order string
    let sort = which;
    // Handle clicking twice to invert the order
    const flip = curSort.toLowerCase().startsWith(which.toLowerCase());
    if (flip && curSort.startsWith(which.toLowerCase())) {
      sort = sort.toUpperCase();
    }
    const newSort =
      sort +
      curSort
        .replaceAll(which.toLowerCase(), '')
        .replaceAll(which.toUpperCase(), '');
    // set the sort order
    performSort(newSort);
  };

  return renderers.map(([key, fieldName, name, minWidth, maxWidth, onRender]) =>
    fieldName !== ''
      ? {
          key,
          name,
          fieldName,
          minWidth,
          maxWidth,
          onRender,
          isResizable: true,
          isSorted: getSort().toLowerCase().startsWith(key),
          isSortedDescending: getSort().startsWith(key.toUpperCase()),
          onColumnClick: () => localSort(key),
        }
      : { key, name, minWidth, maxWidth, onRender, isResizable: true },
  );
}

const theme = getTheme();

export const renderAltRow: IDetailsListProps['onRenderRow'] = (props) => {
  const customStyles: Partial<IDetailsRowStyles> = {};
  if (props) {
    if (props.itemIndex % 2 === 0) {
      // Every other row renders with a different background color
      customStyles.root = { backgroundColor: theme.palette.themeLighterAlt };
    }
    return <DetailsRow {...props} styles={customStyles} />;
  }
  return null;
};

export function ArtistName({
  artistIds,
}: {
  artistIds: ArtistKey[];
}): JSX.Element {
  return <>{useRecoilValue(artistStringSel(artistIds))}</>;
}

export function AlbumName({ albumId }: { albumId: AlbumKey }): JSX.Element {
  return <>{useRecoilValue(albumByKeySel(albumId)).title}</>;
}

export function ArtistsFromSong(theSong: Song): JSX.Element {
  return <ArtistName artistIds={theSong.artistIds} />;
}

export function AlbumFromSong(song: Song): JSX.Element {
  return <AlbumName albumId={song.albumId} />;
}

export function ArtistsFromAlbum(album: Album): JSX.Element {
  return <ArtistName artistIds={[...album.primaryArtists]} />;
}
