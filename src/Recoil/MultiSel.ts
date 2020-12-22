import { SongKey } from '@freik/core-utils';
import { selectorFamily } from 'recoil';
import { getMediaInfoState } from './ReadOnly';

// This is needed for multi-metadata editing
export const getMediaInfoForListState = selectorFamily<
  Map<string, string>[],
  SongKey[]
>({
  key: 'mediaInfoSelForMany',
  get: (skl: SongKey[]) => ({ get }): Map<string, string>[] => {
    return skl.map((val) => get(getMediaInfoState(val)));
  },
});
