import { ComboBox, IComboBox, IComboBoxOption } from '@fluentui/react';
import { AlbumKey, Artist, ArtistKey, PlaylistName } from '@freik/media-core';
import { isDefined, isString } from '@freik/typechk';
import { useAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { WritableAtomType } from '../../../Jotai/Hooks';
import {
  AlbumDescriptionWithKey,
  albumByKeyFuncFam,
  allAlbumsDataFunc,
  artistByKeyFuncFam,
  filteredArtistsFunc,
} from '../../../Jotai/MusicDatabase';
import { playlistNamesFunc } from '../../../Jotai/Playlists';

export function PlaylistSelector({
  value,
}: {
  value: WritableAtomType<PlaylistName>;
}): JSX.Element {
  const [getValue, setValue] = useAtom(value);
  const playlists = useAtomValue(playlistNamesFunc);
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
      selectedKey={getValue}
      onChange={onChange}
    />
  );
}

export function ArtistSelector({
  value,
}: {
  value: WritableAtomType<ArtistKey>;
}): JSX.Element {
  const selArtistKey = useAtomValue(value);
  const artists = useAtomValue(filteredArtistsFunc);
  const theList: IComboBoxOption[] = artists.map((r: Artist) => ({
    key: r.key,
    text: r.name,
  }));
  const onChange = useAtomCallback(
    useCallback(
      async (
        get,
        set,
        event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        index?: number,
        newValue?: string,
      ) => {
        if (isDefined(option) && isString(option.key) && isString(newValue)) {
          try {
            const art = await get(artistByKeyFuncFam(option.key));
            if (art.key === option.key) {
              set(value, art.key);
            }
          } catch (e) {
            /* */
          }
        }
      },
      [value],
    ),
  );
  return (
    <ComboBox
      label="Which Artist?"
      autoComplete="on"
      options={theList}
      selectedKey={selArtistKey}
      onChange={(ev, opt, idx, newV) => void onChange(ev, opt, idx, newV)}
    />
  );
}

export function AlbumSelector({
  value,
}: {
  value: WritableAtomType<AlbumKey>;
}): JSX.Element {
  const selAlbumKey = useAtomValue(value);
  const albums = useAtomValue(allAlbumsDataFunc);
  const theList: IComboBoxOption[] = albums.map(
    (r: AlbumDescriptionWithKey) => ({
      key: r.key,
      text: `${r.artist}: ${r.album} ${
        r.year ? '(' + r.year.toString() + ')' : ''
      }`,
    }),
  );
  const onChange = useAtomCallback(
    useCallback(
      async (
        get,
        set,
        event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        index?: number,
        newValue?: string,
      ) => {
        if (isDefined(option) && isString(option.key) && isString(newValue)) {
          try {
            const alb = await get(albumByKeyFuncFam(option.key));
            if (alb.key === option.key) {
              set(value, alb.key);
            }
          } catch (e) {
            /* */
          }
        }
      },
      [value],
    ),
  );
  return (
    <ComboBox
      label="Which Album?"
      autoComplete="on"
      options={theList}
      selectedKey={selAlbumKey}
      onChange={(ev, opt, idx, newV) => void onChange(ev, opt, idx, newV)}
    />
  );
}
