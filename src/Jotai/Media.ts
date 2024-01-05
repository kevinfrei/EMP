/*
// TODO: Not working at all. Need new atom helper "atomFromCall" or something similar
export const mediaInfoFuncFam = atomFamily<SongKey, Map<string, string>>(
  (sk: SongKey) =>
    atomFromIpc(
      'mediainfo',
      async (): Promise<Map<string, string>> => {
        if (!sk) return new Map<string, string>();
        const result = await ipc.GetMediaInfo(sk);
        if (!result) {
          Fail(sk, 'Unfound song key');
        }
        log(`Got media info for ${sk}:`);
        log(result);
        return result;
      },
    ),
);

// Not translated to jotai yet...
export const picForKeyFam = selectorFamily<string, MediaKey>({
  key: 'picForkey',
  get:
    (mk: MediaKey) =>
      async ({ get }): Promise<string> => {
        if (isSongKey(mk)) {
          mk = get(albumKeyForSongKeyFuncFam(mk));
        }
        const data = await ipc.GetPicDataUri(mk);
        return isString(data) ? data : 'error';
      },
});
*/
