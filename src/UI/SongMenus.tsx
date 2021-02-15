import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { MakeLogger, SongKey, Type } from '@freik/core-utils';
import { CallbackInterface, useRecoilCallback, useRecoilValue } from 'recoil';
import { AddSongs, PlaySongs } from '../Recoil/api';
import {
  songHateFamily,
  songLikeFamily,
  songLikeFromStringFamily,
} from '../Recoil/ReadWrite';
import { SongListDetailClick } from './DetailPanel/Clickers';

const log = MakeLogger('SongMenus'); // eslint-disable-line

export type SongListMenuData = { data: string; spot: Point };

export function SongListMenu({
  title,
  context,
  onClearContext,
  onGetSongList,
  items,
}: {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (
    cbInterface: CallbackInterface,
    data: string,
  ) => SongKey[] | undefined;
  items?: (IContextualMenuItem | string)[];
}): JSX.Element {
  const i = (
    name: string,
    iconName: string,
    onClick: () => void,
  ): IContextualMenuItem => ({
    name,
    key: iconName,
    iconProps: { iconName },
    onClick,
  });
  // Does this 'side effect' actually matter?
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
      for (const song of maybeSongs) {
        cbInterface.set(songLikeFamily(song), (pv) => !pv);
      }
    }
  });
  const onHate = useRecoilCallback((cbInterface) => () => {
    const maybeSongs = onGetSongList(cbInterface, context.data);
    if (maybeSongs) {
      for (const song of maybeSongs) {
        cbInterface.set(songHateFamily(song), (pv) => !pv);
      }
    }
  });
  const like = 1 + useRecoilValue(songLikeFromStringFamily(context.data));
  const likeIcons = ['LikeSolid', 'More', 'Like'];
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
          realItems.push(i('Like [NYI]', likeIcons[like], onLove));
          break;
        case 'hate':
        case 'dislike':
          realItems.push(i('Disklie [NYI]', 'Dislike', onHate));
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
