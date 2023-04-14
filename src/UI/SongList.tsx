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
import { ArtistKey } from '@freik/media-core';
import { hasFieldType, isDefined } from '@freik/typechk';
import { Dispatch, SetStateAction } from 'react';
import { SortKey } from '../Sorting';

type ColumnRenderTuple<T> = [
  string, // key
  string, // fieldName
  string, // "title"/name
  number, // minWidth
  number?, // maxWidth
  ((item: T) => JSX.Element)?, // render func
];

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
  renderers: ColumnRenderTuple<T>[],
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
  return renderers.map(([key, fieldName, name, minWidth, maxWidth, onRender]) =>
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
      // This lets me render over the top of the "indent" area of grouped stuff
      /*    
      Note to self: This is a very bad idea. Don't do it.
      cell: {
        overflow: 'visible',
      },
      */
    };
    return <DetailsRow {...props} styles={customStyles} />;
  };
}

/**
 * Build out the song list, group list, and group header properties for a
 * grouped hierarchy of songs
 *
 * @function ProcessSongGroupData<T>
 * @param {IGroup[]} sortedGroups - the sorted list of groups
 * @param {[Set<string>, (Set<string>)=>void]} expandedState - A React state
 *                        pair for a set of keys used to keep track of which
 *                        containers are currently expanded
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
 * @returns {[IColumn[], IDetailsGroupRenderProps]} - returns a tuple
 *    of the list of IColumns and the GroupRenderProps
 */
export function ProcessSongGroupData<T>(
  sortedGroups: IGroup[],
  [curExpandedSet, setExpandedSet]: [Set<string>, (set: Set<string>) => void],
  groupFieldName: string,
  // [key, fieldname, name, minWidth, maxWidth?, render?]
  renderers: [
    string,
    string,
    string,
    number,
    number?,
    ((song: T, index?: number) => JSX.Element)?,
  ][],
  headerRenderer: (group: IGroup) => JSX.Element,
  getSort: () => SortKey,
  performSort: (sort: SortKey) => void,
): [IColumn[], IDetailsGroupRenderProps] {
  const allGroupIds = new Set<string>(sortedGroups.map((val) => val.key));

  // Walk the sorted list of songs, creating groups when the groupId changes
  // This has the down-side of making multiple groups with the same key if the
  // list isn't primarily sorted by the groupId, so you'd better make sure it's
  // sorted
  sortedGroups.forEach((val) => {
    val.isCollapsed = !curExpandedSet.has(val.key);
  });
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
    onRenderHeader: (props?: IDetailsGroupDividerProps) => {
      return hasFieldType(props, 'group', isDefined)
        ? headerRenderer(props.group)
        : null;
    },
  };
  const columns = MakeColumns(renderers, getSort, performSort, groupFieldName);
  return [columns, renderProps];
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
