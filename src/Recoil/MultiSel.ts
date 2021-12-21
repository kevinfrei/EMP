import { SongKey } from '@freik/media-core';
import { selectorFamily } from 'recoil';
import { mediaInfoFuncFam } from './ReadOnly';

// This is needed for multi-metadata editing
export const mediaInfoForListFuncFam = selectorFamily<
  Map<string, string>[],
  SongKey[]
>({
  key: 'mediaInfoSelForMany',
  get:
    (skl: SongKey[]) =>
    ({ get }): Map<string, string>[] => {
      return skl.map((val) => get(mediaInfoFuncFam(val)));
    },
});
