import {
  ContextualMenu,
  ContextualMenuItemType,
  DirectionalHint,
  IContextualMenuItem,
  Point,
} from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import { useRecoilCallback } from 'recoil';
import { AddSongs, PlaySongs } from '../Recoil/api';
import { getAlbumByKeyState } from '../Recoil/ReadOnly';
import { SongListDetailClick } from './DetailPanel/Clickers';

const log = MakeLogger('SongMenus'); // eslint-disable-line

export type SongListMenuData = { data: string; spot: Point };

export function SongListMenu({
  title,
  context,
  onClearContext,
}: {
  title?: string;
  context: SongListMenuData;
  onClearContext: () => void;
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
    const alb = cbInterface.snapshot
      .getLoadable(getAlbumByKeyState(context.data))
      .valueMaybe();
    if (alb) {
      AddSongs(cbInterface, alb.songs);
    }
  });
  const onReplace = useRecoilCallback((cbInterface) => () => {
    const alb = cbInterface.snapshot
      .getLoadable(getAlbumByKeyState(context.data))
      .valueMaybe();
    if (alb) {
      PlaySongs(cbInterface, alb.songs);
    }
  });
  const onProps = useRecoilCallback((cbInterface) => () => {
    const alb = cbInterface.snapshot
      .getLoadable(getAlbumByKeyState(context.data))
      .valueMaybe();
    if (alb) {
      SongListDetailClick(cbInterface, alb.songs, false);
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
        // scroll events...
        if (ev?.type !== 'scroll') {
          onClearContext();
        }
      }}
      styles={{ container: { margin: 0, padding: 0, fontSize: 'small' } }}
    />
  );
}
