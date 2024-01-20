import { ComboBox, IComboBox, IComboBoxOption } from '@fluentui/react';
import { Artist, PlaylistName } from '@freik/media-core';
import { isDefined, isString } from '@freik/typechk';
import { useAtomValue, useStore } from 'jotai';
import { AsyncHandler } from '../../../Jotai/Helpers';
import {
  AlbumDescriptionWithKey,
  albumByKeyAtomFam,
  allAlbumsDataAtom,
  artistByKeyAtomFam,
  filteredArtistsAtom,
} from '../../../Jotai/MusicDatabase';
import { playlistNamesAtom } from '../../../Jotai/Playlists';

export function PlaylistSelector({
  value,
}: {
  value: [PlaylistName, (val: PlaylistName) => void | PromiseLike<void>];
}): JSX.Element {
  const [theValue, setValue] = value;
  const playlists = useAtomValue(playlistNamesAtom);
  const theList: IComboBoxOption[] = [...playlists]
    .sort()
    .map((name) => ({ key: name, text: name }));
  const onChange = (
    event: React.FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    val?: string,
  ): void => {
    if (isDefined(option) && isString(val) && playlists.has(val)) {
      void setValue(val);
    }
  };

  return (
    <ComboBox
      label="Which Playlist?"
      autoComplete="on"
      options={theList}
      selectedKey={theValue}
      onChange={onChange}
    />
  );
}

export function ArtistSelector({
  value,
}: {
  value: [PlaylistName, (val: PlaylistName) => void | PromiseLike<void>];
}): JSX.Element {
  const [theValue, setValue] = value;
  const artists = useAtomValue(filteredArtistsAtom);
  const store = useStore();
  const theList: IComboBoxOption[] = artists.map((r: Artist) => ({
    key: r.key,
    text: r.name,
  }));
  const onChange = AsyncHandler(
    async (option?: IComboBoxOption, newValue?: string) => {
      if (isDefined(option) && isString(option.key) && isString(newValue)) {
        try {
          const art = await store.get(artistByKeyAtomFam(option.key));
          if (art.key === option.key) {
            await setValue(art.key);
          }
        } catch (e) {
          /* */
        }
      }
    },
  );
  return (
    <ComboBox
      label="Which Artist?"
      autoComplete="on"
      options={theList}
      selectedKey={theValue}
      onChange={(ev, opt, idx, newV) => void onChange(opt, newV)}
    />
  );
}

export function AlbumSelector({
  value,
}: {
  value: [PlaylistName, (val: PlaylistName) => void | PromiseLike<void>];
}): JSX.Element {
  const [theValue, setValue] = value;
  const albums = useAtomValue(allAlbumsDataAtom);
  const store = useStore();
  const theList: IComboBoxOption[] = albums.map(
    (r: AlbumDescriptionWithKey) => ({
      key: r.key,
      text: `${r.artist}: ${r.album} ${
        r.year ? '(' + r.year.toString() + ')' : ''
      }`,
    }),
  );
  const onChange = AsyncHandler(
    async (option?: IComboBoxOption, newValue?: string) => {
      if (isDefined(option) && isString(option.key) && isString(newValue)) {
        try {
          const alb = await store.get(albumByKeyAtomFam(option.key));
          if (alb.key === option.key) {
            await setValue(alb.key);
          }
        } catch (e) {
          /* */
        }
      }
    },
  );
  return (
    <ComboBox
      label="Which Album?"
      autoComplete="on"
      options={theList}
      selectedKey={theValue}
      onChange={(ev, opt, idx, newV) => void onChange(opt, newV)}
    />
  );
}
