import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { SongKey } from '@freik/media-core';
import { isString } from '@freik/typechk';
import {
  Catch,
  MyTransactionInterface,
  useMyTransaction,
} from '@freik/web-utils';
import { useAtomValue, useStore } from 'jotai';
import { AddSongs, PlaySongs } from '../Jotai/API';
import { songListLikeNumberFromStringFam } from '../Jotai/LikesAndHates';
import { SongListDetailClick } from './DetailPanel/Clickers';
import { ErrorBoundary } from './Utilities';

export type SongListMenuData = { data: string; spot?: Point };

type SongListMenuArgs = {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (xact: MyTransactionInterface, data: string) => SongKey[];
  onGetPlaylistName?: (data: string) => string;
  items?: (IContextualMenuItem | string)[];
};

export function SongListMenu({
  title,
  context,
  onClearContext,
  onGetSongList,
  onGetPlaylistName,
  items,
}: SongListMenuArgs): JSX.Element {
  const theStore = useStore();
  const i = (
    name: string,
    iconName: string,
    click: () => void,
    key?: string,
  ): IContextualMenuItem => ({
    name,
    key: key ? key : iconName,
    iconProps: { iconName },
    onClick: () => void click(),
  });
  // This isn't actually a side effect, as it's strictly a function of the
  // input of the menu
  let dk = 0;
  const d = (): IContextualMenuItem => ({
    key: 'divider' + (dk++).toString(),
    itemType: ContextualMenuItemType.Divider,
  });

  const onAdd = useMyTransaction(
    (xact) => () =>
      AddSongs(
        theStore,
        onGetSongList(xact, context.data),
        onGetPlaylistName ? onGetPlaylistName(context.data) : undefined,
      ),
  );
  const onReplace = useMyTransaction(
    (xact) => () =>
      PlaySongs(
        theStore,
        onGetSongList(xact, context.data),
        onGetPlaylistName ? onGetPlaylistName(context.data) : undefined,
      ),
  );
  const onProps = useMyTransaction(
    (xact) => () =>
      SongListDetailClick(onGetSongList(xact, context.data), false),
  );
  // JODO: Update this once we've got the song list from the media interface
  const onLove = () => {}; /*
  useMyTransaction((xact) => () => {
    const songs = onGetSongList(xact, context.data);
    const likeVal = xact.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* liked
      xact.set(songLikeFuncFam(song), likeVal !== 1);
    }
  });*/

  // JODO: Update this once we've got the song list from the media interface
  const onHate = () => {}; /*
  useJotaiCallback((get, set) => useMyTransaction((xact) => () => {
    const songs = onGetSongList(xact, context.data);
    const hateVal = xact.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* hated
      xact.set(songHateFuncFam(song), hateVal !== 2);
    }
  });
  */
  const onShow = () => {
    Ipc.InvokeMain(IpcId.ShowLocFromKey, context.data).catch(Catch);
  };
  const likeNum = useAtomValue(songListLikeNumberFromStringFam(context.data));
  const likeIcons = ['Like', 'LikeSolid', 'Like', 'More'];
  const hateIcons = ['Dislike', 'Dislike', 'DislikeSolid', 'More'];
  if (context.data === '' || context.spot === undefined) {
    return <></>;
  }
  const realItems: IContextualMenuItem[] = title
    ? [{ key: 'Header', name: title, itemType: ContextualMenuItemType.Header }]
    : [];
  for (const itm of items || [
    'add',
    'rep',
    '',
    'prop',
    'show',
    '',
    'love',
    'hate',
  ]) {
    if (isString(itm)) {
      switch (itm.toLowerCase()) {
        case 'add':
          realItems.push(i('Add to Now Playing', 'Add', onAdd));
          break;
        case 'rep':
        case 'replace':
          realItems.push(
            i('Replace current queue', 'DependencyAdd', onReplace),
          );
          break;
        case 'prop':
        case 'props':
        case 'properties':
          realItems.push(i('Properties', 'Info', onProps));
          break;
        case 'love':
        case 'like':
          realItems.push(i('Like', likeIcons[likeNum], onLove, 'like'));
          break;
        case 'hate':
        case 'dislike':
          realItems.push(i('Dislike', hateIcons[likeNum], onHate, 'hate'));
          break;
        case 'show':
          realItems.push(i('Show Location', 'FolderSearch', onShow));
          break;
        case '':
        case '-':
        case '_':
          realItems.push(d());
          break;
        default:
          realItems.push(i(itm, 'Unknown', () => 0));
      }
    } else {
      realItems.push(itm);
    }
  }
  return (
    <ErrorBoundary>
      <ContextualMenu
        directionalHint={DirectionalHint.bottomCenter}
        isBeakVisible={true}
        items={realItems}
        shouldFocusOnMount={true}
        shouldFocusOnContainer={true}
        target={context.spot}
        onDismiss={(ev) => {
          // The DetailsList panel wiggles. A lot.
          // So I had to turn off dismissal for scroll events, cuz otherwise it
          // would disappear almost immediately.
          if (ev?.type !== 'scroll') {
            onClearContext();
          }
        }}
        // Hide the scroll bar on the menu
        styles={{ container: { overflow: 'hidden' } }}
      />
    </ErrorBoundary>
  );
}
