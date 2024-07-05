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
import { Catch } from '@freik/web-utils';
import { useAtomValue, useStore } from 'jotai';
import { AsyncHandler } from '../Jotai/Helpers';
import { AddSongs, PlaySongs } from '../Jotai/Interface';
import {
  songHateFuncFam,
  songLikeFuncFam,
  songLikeNumFromStringFuncFam,
} from '../Jotai/Likes';
import { MyStore } from '../Jotai/Storage';
import { SongListDetailClick } from './DetailPanel/Clickers';
import { ErrorBoundary } from './Utilities';

export type SongListMenuData = { data: string; spot?: Point };

type SongListMenuArgs = {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (store: MyStore, data: string) => PromiseLike<SongKey[]>;
  onGetPlaylistName?: (data: string) => string;
  items?: (IContextualMenuItem | string)[];
};

/**
 *
 */
export function SongListMenu({
  title,
  context,
  onClearContext,
  onGetSongList,
  onGetPlaylistName,
  items,
}: SongListMenuArgs): JSX.Element {
  const store = useStore();
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

  const onAdd = AsyncHandler(
    async () =>
      await AddSongs(
        store,
        await onGetSongList(store, context.data),
        onGetPlaylistName ? onGetPlaylistName(context.data) : undefined,
      ),
  );
  const onReplace = AsyncHandler(
    async () =>
      await PlaySongs(
        store,
        await onGetSongList(store, context.data),
        onGetPlaylistName ? onGetPlaylistName(context.data) : undefined,
      ),
  );
  const onProps = AsyncHandler(async () => {
    SongListDetailClick(await onGetSongList(store, context.data), false);
  });
  const onLove = AsyncHandler(async () => {
    const songs = await onGetSongList(store, context.data);
    const likeVal = await store.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* liked
      await store.set(songLikeFuncFam(song), likeVal !== 1);
    }
  });

  const onHate = AsyncHandler(async () => {
    const songs = await onGetSongList(store, context.data);
    const hateVal = await store.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* hated
      await store.set(songHateFuncFam(song), hateVal !== 2);
    }
  });

  const onShow = () => {
    Ipc.InvokeMain(IpcId.ShowLocFromKey, context.data).catch(Catch);
  };
  const likeNum = useAtomValue(songLikeNumFromStringFuncFam(context.data));
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
