import { SongKey } from '@freik/media-core';
import { selectorFamily } from 'recoil';
import { getMediaInfoFamily } from './ReadOnly';

// This is needed for multi-metadata editing
export const getMediaInfoForListFamily = selectorFamily<
  Map<string, string>[],
  SongKey[]
>({
  key: 'mediaInfoSelForMany',
  get:
    (skl: SongKey[]) =>
    ({ get }): Map<string, string>[] => {
      return skl.map((val) => get(getMediaInfoFamily(val)));
    },
});
