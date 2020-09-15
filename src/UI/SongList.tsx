import React from 'react';
import {
  DetailsRow,
  getTheme,
  IColumn,
  IDetailsListProps,
  IDetailsRowStyles,
} from '@fluentui/react';

import type { AlbumKey, ArtistKey, Song } from '../DataSchema';
import { useRecoilValue } from 'recoil';
import { albumByKeySel, artistStringSel } from '../Recoil/MusicDbAtoms';

export function makeColumns(
  getSort: () => string,
  setSort: (key: string) => void,
  performSort: (srt: string) => void,
  ...renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: Song) => JSX.Element,
  ][]
): IColumn[] {
  const localSort = (which: string) => {
    const curSort = getSort();
    // This rearranges the sort order string
    let sort = which;
    // Handle clicking twice to invert the order
    const flip = curSort.toLowerCase().startsWith(which);
    if (flip && curSort === which) {
      sort = sort.toUpperCase();
    }
    const newSort = curSort
      .replaceAll(which.toLowerCase(), '')
      .replaceAll(which.toUpperCase(), '');
    // set the sort order
    setSort(sort + newSort);
    performSort(sort + newSort);
  };

  return renderers.map(
    ([key, fieldName, name, minWidth, maxWidth, onRender]) => ({
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
    }),
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

export function ArtistName({ artists }: { artists: ArtistKey[] }): JSX.Element {
  return <>{useRecoilValue(artistStringSel(artists))}</>;
}

export function AlbumName({ albumId }: { albumId: AlbumKey }): JSX.Element {
  return <>{useRecoilValue(albumByKeySel(albumId)).title}</>;
}
