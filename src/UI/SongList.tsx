import {
  DetailsRow,
  getTheme,
  IColumn,
  IDetailsGroupRenderProps,
  IDetailsListProps,
  IDetailsRowStyles,
  IGroup,
} from '@fluentui/react';
import { Album, AlbumKey, ArtistKey, Song, SongKey } from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { albumByKeySel, artistStringSel } from '../Recoil/ReadOnly';

/**
 * Make a set of IColumns for a DetailsLists
 *
 * @param {[key:string,
 *          fieldName: string,
 *          name: string,
 *          minWidth: number,
 *          maxWidth?: number,
 *          render?:(s:Song) => JSX.Element][]} renderers - data for the columns
 * @param {() => string} getSort - a function to get the sorting string
 * @param {(sort: string) => void} performSort - the function to actually sort
 *                                               the song list
 * @param {string?} groupField? - the fieldName that is grouped
 * @param {isSorted: (sort: string, key: string) => boolean,
 *         isSortedDescending: (sort: string, key: string) => boolean} sorters -
 *        the pair of functions to determine whether to display this column as
 *        sorted ascending or descending
 *
 * @returns
 */
export function MakeColumns<T>(
  renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: T) => JSX.Element,
  ][],
  getSort: () => string,
  performSort: (sort: string) => void,
  groupField?: string,
  sorters?: {
    isSorted: (sort: string, key: string) => boolean;
    isSortedDescending: (sort: string, key: string) => boolean;
  },
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
  const isSorted = sorters
    ? sorters.isSorted
    : (sort: string, key: string) => sort.toLowerCase().startsWith(key);
  const isSortedDescending = sorters
    ? sorters.isSortedDescending
    : (sort: string, key: string) => sort.startsWith(key.toUpperCase());
  return renderers.map(
    ([key, fieldName, name, minWidth, maxWidth, onRender], index) =>
      fieldName !== ''
        ? {
            key,
            name,
            fieldName,
            minWidth,
            maxWidth,
            onRender,
            isGrouped: fieldName === groupField,
            isResizable: true,
            isSorted: isSorted(getSort(), key),
            isSortedDescending: isSortedDescending(getSort(), key),
            onColumnClick: () => localSort(key),
          }
        : {
            key,
            name,
            minWidth,
            maxWidth,
            onRender,
            isGrouped: fieldName === groupField,
            isResizable: true,
          },
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

/**
 * Build out the song list, group list, and group header properties for a
 * grouped hierarchy of songs
 *
 * @function GetSongGroupData<T>
 * @param {Map<string, T>} allTs - the map from key to grouped container (Album/Artist)
 * @param allSongs {Map<SongKey, Song>} - the map from SongKey to Songs
 * @param expandedState - A React state pair for a set of keys used to keep
 *                        track of which containers are currently expanded
 * @param getSongs - a lambda to get the song list from the container
 * @param getTitle - a labmda to get the title of each group
 *
 * @returns {[Song[], IGroup[], IDetailsGroupRenderProps]} - returns a tuple
 *    of the list of songs, the list of IGroups, and the GroupRenderProps
 */
export function GetSongGroupData<T>(
  allTs: Map<string, T>,
  allSongs: Map<SongKey, Song>,
  [curExpandedSet, setExpandedSet]: [
    curExpandedSet: Set<string>,
    setExpandedSet: (set: Set<string>) => void,
  ],
  getSongs: (obj: T) => SongKey[],
  getTitle: (obj: T) => string,
): [Song[], IGroup[], IDetailsGroupRenderProps] {
  const groups: IGroup[] = [];
  const songs: Song[] = [];
  let runningTotal = 0;
  for (const [key, thing] of allTs) {
    const theSongs = getSongs(thing);
    const group: IGroup = {
      count: theSongs.length,
      key,
      name: getTitle(thing),
      startIndex: runningTotal,
      isCollapsed: !curExpandedSet.has(key),
    };
    groups.push(group);
    runningTotal += group.count;
    songs.push(
      ...(theSongs
        .map((v) => allSongs.get(v))
        .filter((value) => !!value) as Song[]),
    );
  }
  const renderProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(new Set<string>(isAllCollapsed ? [] : allTs.keys()));
    },
    headerProps: {
      onToggleCollapse: (group: IGroup) => {
        if (curExpandedSet.has(group.key)) {
          curExpandedSet.delete(group.key);
        } else {
          curExpandedSet.add(group.key);
        }
        setExpandedSet(curExpandedSet);
      },
    },
  };
  return [songs, groups, renderProps];
}
