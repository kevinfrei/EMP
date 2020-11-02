import {
  DetailsRow,
  getTheme,
  IColumn,
  IDetailsGroupRenderProps,
  IDetailsHeaderProps,
  IDetailsListProps,
  IDetailsRowStyles,
  IGroup,
  Sticky,
  StickyPositionType,
  TooltipHost,
} from '@fluentui/react';
import { Album, AlbumKey, ArtistKey, Song } from '@freik/media-utils';
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
export function MakeColumns(
  renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: Song) => JSX.Element,
  ][],
  getSort: () => string,
  performSort: (sort: string) => void,
  groupField?: string,
  sorters?: {
    isSorted: (sort: string, key: string) => boolean;
    isSortedDescending: (sort: string, key: string) => boolean;
    setSortOrder: (key: string) => string;
  },
): IColumn[] {
  const onColumnClick = sorters
    ? sorters.setSortOrder
    : (which: string) => {
        const curSort = getSort();
        // This rearranges the sort order string
        return NewSortOrder(which, curSort);
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
            onColumnClick: () => performSort(onColumnClick(key)),
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

/**
 * @function NewSortOrder
 * Updates the sorting string to be arranged & capitalized properly give a
 * 'click' on the new key
 *
 * @param {string} which - the lowercase letter for the header clicked on
 * @param {string} curSort - the string representing the current sort order
 * @returns {string} the updated sort order string
 */
function NewSortOrder(which: string, curSort: string): string {
  // Handle clicking twice to invert the order
  const sort = curSort.startsWith(which) ? which.toUpperCase() : which;
  return (
    sort + curSort.replaceAll(which, '').replaceAll(which.toUpperCase(), '')
  );
}

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
  return <ArtistName artistIds={album.primaryArtists} />;
}

/**
 * Build out the song list, group list, and group header properties for a
 * grouped hierarchy of songs
 *
 * @function GetSongGroupData<T>
 * @param {Song[]} sortedSongs - the sorted list of songs
 * @param {[Set<string>, (Set<string>)=>void]} expandedState - A React state
 *                        pair for a set of keys used to keep track of which
 *                        containers are currently expanded
 * @param getGroupId - a lambda to get the container key from a song
 * @param getGroupName - a labmda to get the group title from a song
 * @param groupKey - the lowercase character for the grouped field's sort order
 * @param groupFieldName - the name of the grouped field
 * @param {[key:string,
 *          fieldName: string,
 *          name: string,
 *          minWidth: number,
 *          maxWidth?: number,
 *          render?:(s:Song) => JSX.Element][]} renderers - data for the columns
 * @param {() => string} getSort - a function to get the sorting string
 * @param {(sort: string) => void} performSort - the function to actually sort
 *                                               the song list
 *
 * @returns {[IColumn[], IGroup[], IDetailsGroupRenderProps]} - returns a tuple
 *    of the list of IColumns, IGroups, and the GroupRenderProps
 */
export function GetSongGroupData(
  sortedSongs: Song[],
  [curExpandedSet, setExpandedSet]: [
    curExpandedSet: Set<string>,
    setExpandedSet: (set: Set<string>) => void,
  ],
  getGroupId: (obj: Song) => string,
  getGroupName: (groupId: string) => string,
  groupKey: string,
  groupFieldName: string,
  renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: Song) => JSX.Element,
  ][],
  getSort: () => string,
  performSort: (sort: string) => void,
): [IColumn[], IGroup[], IDetailsGroupRenderProps] {
  const groups: IGroup[] = [];
  let startGroup = 0;
  let lastGroupId: string | null = null;
  const allGroupIds = new Set<string>();
  // Walk the sorted list of songs, creating groups when the groupId changes
  // This has the down-side of making multiple groups with the same key if the
  // list isn't primarily sorted by the groupId, so you'd better make sure it's
  // sorted
  for (let i = 0; i <= sortedSongs.length; i++) {
    const thisId = i === sortedSongs.length ? null : getGroupId(sortedSongs[i]);
    if (lastGroupId !== null && thisId !== lastGroupId) {
      groups.push({
        startIndex: startGroup,
        count: i - startGroup,
        key: lastGroupId,
        name: getGroupName(lastGroupId),
        isCollapsed: !curExpandedSet.has(lastGroupId),
      });
      startGroup = i;
      allGroupIds.add(lastGroupId);
    }
    lastGroupId = thisId;
  }
  const renderProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(new Set<string>(isAllCollapsed ? [] : allGroupIds.keys()));
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
  const columns = MakeColumns(renderers, getSort, performSort, groupFieldName, {
    isSorted: (sort: string, key: string): boolean => {
      if (key === groupKey) {
        return sort.toLowerCase().startsWith(groupKey);
      } else {
        return sort.length > 1 && sort[1].toLowerCase() === key;
      }
    },
    isSortedDescending: (sort: string, key: string): boolean => {
      if (key === groupKey) {
        return sort.startsWith(groupKey.toUpperCase());
      } else {
        return sort.length > 1 && sort[1] === key.toUpperCase();
      }
    },
    setSortOrder: (which: string): string => {
      // If they clicked the grouped header, swap the front
      const curSort = getSort();
      const gkUp = groupKey.toUpperCase();
      if (which === groupKey) {
        if (curSort.startsWith(groupKey)) {
          return gkUp + curSort.substr(1);
        } else {
          return groupKey + curSort.substr(1);
        }
      }
      return curSort[0] + NewSortOrder(which, curSort.substr(1));
    },
  });
  return [columns, groups, renderProps];
}

/**
 * Throw this on a DetailsList that's locationed inside a ScrollablePane and it
 * will make the header of the DetailsList stay at the top of the pane
 */
export function StickyRenderDetailsHeader(
  theProps?: IDetailsHeaderProps,
  defaultRender?: (p?: IDetailsHeaderProps) => JSX.Element | null,
): JSX.Element | null {
  if (!theProps) {
    return null;
  }
  // This makes the header not have a bunch of extra whitespace above the header
  theProps.styles = { root: { padding: '0px' } };
  return (
    <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
      {defaultRender!({
        ...theProps,
        onRenderColumnHeaderTooltip: (props) => <TooltipHost {...props} />,
      })}
    </Sticky>
  );
}
