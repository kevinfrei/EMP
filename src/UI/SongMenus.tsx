import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { MakeLogger, Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { CallbackInterface, useRecoilCallback, useRecoilValue } from 'recoil';
import { AddSongs, PlaySongs } from '../Recoil/api';
import {
  songHateFamily,
  songLikeFamily,
  songLikeNumFromStringFamily,
} from '../Recoil/Likes';
import { SongListDetailClick } from './DetailPanel/Clickers';

const log = MakeLogger('SongMenus'); // eslint-disable-line

export type SongListMenuData = { data: string; spot: Point };

type SongListMenuArgs = {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (
    cbInterface: CallbackInterface,
    data: string,
  ) => SongKey[] | undefined;
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
    onClick: () => void,
    key?: string,
  ): IContextualMenuItem => ({
    name,
    key: key ? key : iconName,
    iconProps: { iconName },
    onClick,
  });
  // This isn't actually a side effect, as it's strictly a function of the
  // input of the menu
  let dk = 0;
  const d = (): IContextualMenuItem => ({
    key: 'divider' + (dk++).toString(),
    itemType: ContextualMenuItemType.Divider,
  });
  const onAdd = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      AddSongs(cbInterface, maybeSongs);
    }
  });
  const onReplace = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      PlaySongs(cbInterface, maybeSongs);
    }
  });
  const onProps = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      SongListDetailClick(cbInterface, maybeSongs, false);
    }
  });
  const onLove = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      const likeVal = cbInterface.snapshot
        .getLoadable(songLikeNumFromStringFamily(context.data))
        .valueOrThrow();
      for (const song of maybeSongs) {
        // Set it to true if there's any song that *isn't* liked
        cbInterface.set(songLikeFamily(song), likeVal !== 1);
      }
    }
  });
  const onHate = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      const hateVal = cbInterface.snapshot
        .getLoadable(songLikeNumFromStringFamily(context.data))
        .valueOrThrow();
      for (const song of maybeSongs) {
        // Set it to true if there's any song that *isn't* hated
        cbInterface.set(songHateFamily(song), hateVal !== 2);
      }
    }
  });
  const likeNum = useRecoilValue(songLikeNumFromStringFamily(context.data));
  const likeIcons = ['Like', 'LikeSolid', 'Like', 'More'];
  const hateIcons = ['Dislike', 'Dislike', 'DislikeSolid', 'More'];

  const realItems: IContextualMenuItem[] = title
    ? [{ key: 'Header', name: title, itemType: ContextualMenuItemType.Header }]
    : [];
  for (const itm of items || ['add', 'rep', '', 'prop', '', 'love', 'hate']) {
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
        case '':
        case '-':
        case '_':
          realItems.push(d());
          break;
        default:
          realItems.push(i(itm, 'Unknown', () => undefined));
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
        // The DetailsList panel wiggles. A lot. So turn off dismissal for
        // scroll events, cuz otherwise, it disappears almost immediately
        if (ev?.type !== 'scroll') {
          onClearContext();
        }
      }}
      styles={{ container: { margin: 0, padding: 0, fontSize: 'small' } }}
    />
  );
}
