import {
  DetailsRow,
  getTheme,
  IColumn,
  IDetailsGroupDividerProps,
  IDetailsGroupRenderProps,
  IDetailsHeaderProps,
  IDetailsRowProps,
  IDetailsRowStyles,
  IGroup,
  IRenderFunction,
  Sticky,
  StickyPositionType,
  TooltipHost,
} from '@fluentui/react';
import { MakeError, Type } from '@freik/core-utils';
import { AlbumKey, ArtistKey, Song } from '@freik/media-core';
import { Dispatch, SetStateAction } from 'react';
import { useRecoilValue } from 'recoil';
import { getAlbumByKeyFamily, getArtistStringFamily } from '../Recoil/ReadOnly';
import { SortKey } from '../Sorting';

const err = MakeError('SongList-err');

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
    render?: (song: T, index?: number) => JSX.Element,
  ][],
  getSort: () => SortKey,
  performSort: (sort: SortKey) => void,
  groupField?: string,
  sorters?: {
    isSorted: (sort: SortKey, key: string) => boolean;
    isSortedDescending: (sort: SortKey, key: string) => boolean;
    setSortOrder: (key: string) => SortKey;
  },
): IColumn[] {
  const onColumnClick = sorters
    ? sorters.setSortOrder
    : (which: string) => getSort().newSortOrder(which);
  const isSorted = sorters
    ? sorters.isSorted
    : (sort: SortKey, key: string) => sort.isSorted(key);
  const isSortedDescending = sorters
    ? sorters.isSortedDescending
    : (sort: SortKey, key: string) => sort.isSortedDescending(key);
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

// This does the light/dark swapping, with the current song in bold
export function altRowRenderer(
  isBold?: (props: IDetailsRowProps) => boolean,
): IRenderFunction<IDetailsRowProps> {
  return (props) => {
    if (!props) return null;
    const customStyles: Partial<IDetailsRowStyles> = {
      root: {
        backgroundColor:
          props.itemIndex % 2 === 0 ? theme.palette.themeLighterAlt : '',
        fontWeight: isBold && isBold(props) ? 'bold' : 'normal',
      },
    };
    return <DetailsRow {...props} styles={customStyles} />;
  };
}

export function ArtistName({
  artistIds,
}: {
  artistIds: ArtistKey[];
}): JSX.Element {
  return <>{useRecoilValue(getArtistStringFamily(artistIds))}</>;
}

function AlbumName({ song }: { song: Song }): JSX.Element {
  const album = useRecoilValue(getAlbumByKeyFamily(song.albumId));
  const diskNum = Math.floor(song.track / 100);
  if (
    diskNum > 0 &&
    Type.has(album, 'diskNames') &&
    Type.isArrayOfString(album.diskNames) &&
    album.diskNames.length >= diskNum &&
    album.diskNames[diskNum - 1].length > 0
  ) {
    return (
      <>
        {album.title}: {album.diskNames[diskNum - 1]}
      </>
    );
  }
  return <>{album.title}</>;
}

function AlbumYear({ albumId }: { albumId: AlbumKey }): JSX.Element {
  const album = useRecoilValue(getAlbumByKeyFamily(albumId));
  return <>{album.year !== 0 ? album.year : ''}</>;
}

export function ArtistsFromSongRender(theSong: Song): JSX.Element {
  return <ArtistName artistIds={theSong.artistIds} />;
}

export function AlbumFromSongRender(song: Song): JSX.Element {
  return <AlbumName song={song} />;
}

export function YearFromSongRender(song: Song): JSX.Element {
  return <AlbumYear albumId={song.albumId} />;
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
 * @param {?number} keyLength - The number of characters in the group sort order
 *
 * @returns {[IColumn[], IGroup[], IDetailsGroupRenderProps]} - returns a tuple
 *    of the list of IColumns, IGroups, and the GroupRenderProps
 */
export function GetSongGroupData<T>(
  sortedSongs: T[],
  [curExpandedSet, setExpandedSet]: [
    curExpandedSet: Set<string>,
    setExpandedSet: (set: Set<string>) => void,
  ],
  getGroupId: (obj: T) => string,
  getGroupName: (groupId: string) => string,
  groupFieldName: string,
  renderers: [
    key: string,
    fieldName: string,
    name: string,
    minWidth: number,
    maxWidth?: number,
    render?: (song: T) => JSX.Element,
  ][],
  getSort: () => SortKey,
  performSort: (sort: SortKey) => void,
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
      const gidCount = allGroupIds.size;
      allGroupIds.add(lastGroupId);
      if (gidCount === allGroupIds.size) {
        err(`Found a duplicate groupId: ${lastGroupId}`);
      }
    }
    lastGroupId = thisId;
  }
  const renderProps: IDetailsGroupRenderProps = {
    onToggleCollapseAll: (isAllCollapsed: boolean) => {
      setExpandedSet(new Set<string>(isAllCollapsed ? [] : allGroupIds.keys()));
    },
    headerProps: {
      onToggleCollapse: (group: IGroup) => {
        const newSet = new Set<ArtistKey>(curExpandedSet);
        if (newSet.has(group.key)) {
          newSet.delete(group.key);
        } else {
          newSet.add(group.key);
        }
        setExpandedSet(newSet);
      },
    },
  };
  const columns = MakeColumns(renderers, getSort, performSort, groupFieldName);
  return [columns, groups, renderProps];
}

/**
 * Throw this on a DetailsList that's located inside a ScrollablePane and it
 * will make the header of the DetailsList stay at the top of the pane
 */
export function StickyRenderDetailsHeader(
  theProps?: IDetailsHeaderProps,
  defaultRender?: (p?: IDetailsHeaderProps) => JSX.Element | null,
): JSX.Element | null {
  if (!theProps || !defaultRender) {
    return null;
  }
  // This makes the header not have a bunch of extra whitespace above the header
  theProps.styles = { root: { padding: '0px' } };
  return (
    <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
      {defaultRender({
        ...theProps,
        onRenderColumnHeaderTooltip: (props) => <TooltipHost {...props} />,
      })}
    </Sticky>
  );
}

/**
 * Use this for a group expander thing: It will save & restore which ones are
 * curently expanded automagically
 */
export function HeaderExpanderClick(
  props: IDetailsGroupDividerProps,
  [theSet, setTheSet]: [Set<string>, Dispatch<SetStateAction<Set<string>>>],
): void {
  if (props.group) {
    const newSet = new Set<string>(theSet);
    if (props.group.isCollapsed) {
      newSet.add(props.group.key);
    } else {
      newSet.delete(props.group.key);
    }
    setTheSet(newSet);
    props.onToggleCollapse!(props.group);
  }
}
