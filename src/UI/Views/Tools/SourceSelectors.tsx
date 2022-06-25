import { ComboBox, IComboBox, IComboBoxOption } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { AlbumKey, Artist, ArtistKey, PlaylistName } from '@freik/media-core';
import { useMyTransaction } from '@freik/web-utils';
import { RecoilState, useRecoilValue } from 'recoil';
import { playlistNamesFunc } from '../../../Recoil/PlaylistsState';
import {
  albumByKeyFuncFam,
  AlbumDescriptionWithKey,
  allAlbumsDataFunc,
  artistByKeyFuncFam,
  filteredArtistsFunc,
} from '../../../Recoil/ReadOnly';

export function PlaylistSelector({
  value,
}: {
  value: RecoilState<PlaylistName>;
}): JSX.Element {
  const get = useRecoilValue(value);
  const playlists = useRecoilValue(playlistNamesFunc);
  const theList: IComboBoxOption[] = [...playlists]
    .sort()
    .map((name) => ({ key: name, text: name }));
  const onChange = useMyTransaction(
    ({ set }) =>
      (
        event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        index?: number,
        val?: string,
      ): void => {
        if (
          !Type.isUndefined(option) &&
          Type.isString(val) &&
          playlists.has(val)
        ) {
          set(value, val);
        }
      },
  );
  return (
    <ComboBox
      label="Which Playlist?"
      autoComplete="on"
      options={theList}
      selectedKey={get}
      onChange={onChange}
    />
  );
}

export function ArtistSelector({
  value,
}: {
  value: RecoilState<ArtistKey>;
}): JSX.Element {
  const selArtistKey = useRecoilValue(value);
  const artists = useRecoilValue(filteredArtistsFunc);
  const theList: IComboBoxOption[] = artists.map((r: Artist) => ({
    key: r.key,
    text: r.name,
  }));
  const onChange = useMyTransaction(
    ({ get, set }) =>
      (
        event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        index?: number,
        newValue?: string,
      ) => {
        if (
          !Type.isUndefined(option) &&
          Type.isString(option.key) &&
          Type.isString(newValue)
        ) {
          try {
            const art = get(artistByKeyFuncFam(option.key));
            if (art.key === option.key) {
              set(value, art.key);
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
      selectedKey={selArtistKey}
      onChange={onChange}
    />
  );
}

export function AlbumSelector({
  value,
}: {
  value: RecoilState<AlbumKey>;
}): JSX.Element {
  const selAlbumKey = useRecoilValue(value);
  const albums = useRecoilValue(allAlbumsDataFunc);
  const theList: IComboBoxOption[] = albums.map(
    (r: AlbumDescriptionWithKey) => ({
      key: r.key,
      text: `${r.artist}: ${r.album} ${
        r.year ? '(' + r.year.toString() + ')' : ''
      }`,
    }),
  );
  const onChange = useMyTransaction(
    ({ get, set }) =>
      (
        event: React.FormEvent<IComboBox>,
        option?: IComboBoxOption,
        index?: number,
        newValue?: string,
      ) => {
        if (
          !Type.isUndefined(option) &&
          Type.isString(option.key) &&
          Type.isString(newValue)
        ) {
          try {
            const alb = get(albumByKeyFuncFam(option.key));
            if (alb.key === option.key) {
              set(value, alb.key);
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
      selectedKey={selAlbumKey}
      onChange={onChange}
    />
  );
}
