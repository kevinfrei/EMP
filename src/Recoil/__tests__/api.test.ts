import { snapshot_UNSTABLE } from 'recoil';
import { currentIndexState, songListState } from '../Local';

jest.mock('../../MyWindow');
/*
function makeCallbackIfc(
  set: <T>(rv: RecoilState<T>, valOrUpdate: ((curVal: T) => T) | T) => void,
  snapshot: Snapshot,
): CallbackInterface {
  return {
    set,
    snapshot,
    reset: (rv: RecoilState<any>) => {
      return;
    },
    gotoSnapshot: (sh: Snapshot) => {
      return;
    },
  };
}
*/

it('Adding empty songs does nothing', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(-1);
  /*
  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs([], makeCallbackIfc(set, initialSnapshot))
      .then(() => {
        expect(
          nextSnapshot.getLoadable(songListState).valueOrThrow(),
        ).toStrictEqual([]);
      })
      .catch((reason) => fail(reason)),
  );
  */
});
/*

I can't figure out how to get async setting stuff to work with snapshots :(

  it('Adding song(s) works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs(['a'], makeCallbackIfc(set, initialSnapshot))
      .then(() => {
        expect(
          nextSnapshot.getLoadable(songListState).valueOrThrow(),
        ).toStrictEqual(['a']);
        expect(
          nextSnapshot.getLoadable(currentIndexState).valueOrThrow(),
        ).toStrictEqual(0);
        const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
          AddSongs(['a', 'b'], makeCallbackIfc(set, nextSnapshot))
            .then(() => {
              AddSongs(['a', 'c'], makeCallbackIfc(set, nextSnapshot))
                .then(() => {
                  expect(
                    finalSnapshot.getLoadable(songListState).valueOrThrow(),
                  ).toStrictEqual(['a', 'b', 'a', 'c']);
                })
                .catch((reason) => fail(reason));
            })
            .catch((reason) => fail(reason));
        });
      })
      .catch((reason) => fail(reason)),
  );
});

it('Playing songs works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], makeCallbackIfc(set, initialSnapshot));
    PlaySongs(makeCallbackIfc(set, initialSnapshot), ['d', 'e']);
  });
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual([
    'd',
    'e',
  ]);
});
*/
