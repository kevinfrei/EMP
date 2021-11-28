import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { useRecoilValue } from 'recoil';
import { InvokeMain } from '../MyWindow';
import {
  AddSongs,
  MyTransactionInterface,
  PlaySongs,
  useMyTransaction,
} from '../Recoil/api';
import {
  songHateFuncFam,
  songLikeFuncFam,
  songLikeNumFromStringFuncFam,
} from '../Recoil/Likes';
import { Catch } from '../Tools';
import { SongListDetailClick } from './DetailPanel/Clickers';

export type SongListMenuData = { data: string; spot: Point };

type SongListMenuArgs = {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (xact: MyTransactionInterface, data: string) => SongKey[];
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

  const onAdd = useMyTransaction(xact => () =>
    AddSongs(xact, onGetSongList(xact, context.data)),
  );
  const onReplace = useMyTransaction(xact => () =>
    PlaySongs(xact, onGetSongList(xact, context.data)),
  );
  const onProps = useMyTransaction(xact => () =>
    SongListDetailClick(xact, onGetSongList(xact, context.data), false),
  );
  const onLove = useMyTransaction(xact => () => {
    const songs = onGetSongList(xact, context.data);
    const likeVal = xact.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* liked
      xact.set(songLikeFuncFam(song), likeVal !== 1);
    }
  });

  const onHate = useMyTransaction(xact => () => {
    const songs = onGetSongList(xact, context.data);
    const hateVal = xact.get(songLikeNumFromStringFuncFam(context.data));
    for (const song of songs) {
      // Set it to true if there's any song that *isn't* hated
      xact.set(songHateFuncFam(song), hateVal !== 2);
    }
  });

  const onShow = () => {
    InvokeMain('show-location-from-key', context.data).catch(Catch);
  };
  const likeNum = useRecoilValue(songLikeNumFromStringFuncFam(context.data));
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
          realItems.push(i(itm, 'Unknown', () => 0));
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
      onDismiss={ev => {
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
