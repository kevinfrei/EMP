import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { CallbackInterface, useRecoilCallback, useRecoilValue } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { AddSongs, PlaySongs } from '../Recoil/api';
import {
  songHateFamily,
  songLikeFamily,
  songLikeNumFromStringFamily,
} from '../Recoil/Likes';
import { SongListDetailClick } from './DetailPanel/Clickers';

export type SongListMenuData = { data: string; spot: Point };

type SongListMenuArgs = {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (
    cbInterface: CallbackInterface,
    data: string,
  ) => Promise<SongKey[]>;
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
  items,
}: SongListMenuArgs): JSX.Element {
  const i = (
    name: string,
    iconName: string,
    click: () => Promise<void>,
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

  const onAdd = useRecoilCallback(
    (cbInterface) => async () =>
      AddSongs(cbInterface, await onGetSongList(cbInterface, context.data)),
  );
  const onReplace = useRecoilCallback(
    (cbInterface) => async () =>
      PlaySongs(cbInterface, await onGetSongList(cbInterface, context.data)),
  );
  const onProps = useRecoilCallback(
    (cbInterface) => async () =>
      SongListDetailClick(
        cbInterface,
        await onGetSongList(cbInterface, context.data),
        false,
      ),
  );
  const onLove = useRecoilCallback((cbInterface) => async () => {
    const release = cbInterface.snapshot.retain();
    try {
      const songs = await onGetSongList(cbInterface, context.data);
      const likeVal = await cbInterface.snapshot.getPromise(
        songLikeNumFromStringFamily(context.data),
      );
      for (const song of songs) {
        // Set it to true if there's any song that *isn't* liked
        cbInterface.set(songLikeFamily(song), likeVal !== 1);
      }
    } finally {
      release();
    }
  });

  const onHate = useRecoilCallback((cbInterface) => async () => {
    const release = cbInterface.snapshot.retain();
    try {
      const songs = await onGetSongList(cbInterface, context.data);
      const hateVal = await cbInterface.snapshot.getPromise(
        songLikeNumFromStringFamily(context.data),
      );
      for (const song of songs) {
        // Set it to true if there's any song that *isn't* hated
        cbInterface.set(songHateFamily(song), hateVal !== 2);
      }
    } finally {
      release();
    }
  });

  const onShow = () =>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    InvokeMain('show-location-from-key', context.data).then(() => {});
  const likeNum = useRecoilValue(songLikeNumFromStringFamily(context.data));
  const likeIcons = ['Like', 'LikeSolid', 'Like', 'More'];
  const hateIcons = ['Dislike', 'Dislike', 'DislikeSolid', 'More'];

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
    if (Type.isString(itm)) {
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
          realItems.push(i(itm, 'Unknown', () => new Promise(() => 0)));
      }
    } else {
      realItems.push(itm);
    }
  }

  return (
    <ContextualMenu
      directionalHint={DirectionalHint.bottomRightEdge}
      isBeakVisible={true}
      hidden={context.data === ''}
      items={realItems}
      target={context.spot}
      onDismiss={(ev) => {
        // The DetailsList panel wiggles. A lot.
        // So I had to turn off dismissal for scroll events, cuz otherwise it
        // would disappear almost immediately.
        if (ev?.type !== 'scroll') {
          onClearContext();
        }
      }}
      styles={{ container: { margin: 0, padding: 0, fontSize: 'small' } }}
    />
  );
}
