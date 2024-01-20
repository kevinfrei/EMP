// TODO: Make this update somehow...

import { IpcId } from '@freik/emp-shared';
import { SongKey } from '@freik/media-core';
import { isMapOfStrings } from '@freik/typechk';
import { atomFamily } from 'jotai/utils';
import { atomFromIpc } from './Helpers';

// Maybe I need new atom helper "atomFromCall" or something similar
// TODO: I don't think this is right :/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mediaInfoAtomFam = atomFamily((_sk: SongKey) =>
  atomFromIpc(IpcId.GetMediaInfo, isMapOfStrings),
);

// // Not translated to jotai yet...
// export const picForKeyFam = atomFamily({
//   key: 'picForkey',
//   get:
//     (mk: MediaKey) =>
//       async ({ get }): Promise<string> => {
//         if (isSongKey(mk)) {
//           mk = get(albumKeyForSongKeyFuncFam(mk));
//         }
//         const data = await ipc.GetPicDataUri(mk);
//         return isString(data) ? data : 'error';
//       },
// });
// * /
