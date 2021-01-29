import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { MakeLogger, SongKey } from '@freik/core-utils';
import { CallbackInterface, useRecoilCallback } from 'recoil';
import { AddSongs, PlaySongs } from '../Recoil/api';
import { SongListDetailClick } from './DetailPanel/Clickers';

const log = MakeLogger('SongMenus'); // eslint-disable-line

export type SongListMenuData = { data: string; spot: Point };

export function SongListMenu({
  title,
  context,
  onClearContext,
  onGetSongList,
}: {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
  onGetSongList: (
    cbInterface: CallbackInterface,
    data: string,
  ) => SongKey[] | undefined;
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
  const onLove = useRecoilCallback((cbInterface) => () => log('love'));
  const onHate = useRecoilCallback((cbInterface) => () => log('hate'));

  const items: IContextualMenuItem[] = title
    ? [{ key: 'Header', title, itemType: ContextualMenuItemType.Header }]
    : [];
  items.push(
    i('Add to Now Playing', 'Add', onAdd),
    i('Replace current queue', 'DependencyAdd', onReplace),
    d(),
    i('Properties', 'Info', onProps),
    d(),
    i('Love [NYI]', 'Heart', onLove),
    i('Hate [NYI]', 'Dislike', onHate),
  );

  return (
    <ContextualMenu
      directionalHint={DirectionalHint.bottomRightEdge}
      isBeakVisible={true}
      hidden={context.data === ''}
      items={items}
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
