// TODO: Make this update somehow...

import { SongKey } from '@freik/media-core';
import { isMapOfStrings } from '@freik/typechk';
import { atomFamily } from 'jotai/utils';
import { atomFromIpc } from './Storage';

// Maybe I need new atom helper "atomFromCall" or something similar
export const mediaInfoFuncFam = atomFamily((sk: SongKey) =>
  atomFromIpc(
    'mediainfo', // IpcId.GetMediaInfo,
    isMapOfStrings,
  ),
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
