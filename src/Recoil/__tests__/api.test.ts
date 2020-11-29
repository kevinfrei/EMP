import {
  CallbackInterface,
  RecoilState,
  Snapshot,
  snapshot_UNSTABLE,
} from 'recoil';
import { AddSongs, PlaySongs } from '../api';
import { currentIndexState, songListState } from '../Local';

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

it('Adding empty songs does nothing', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(-1);

  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs([], makeCallbackIfc(set, initialSnapshot)),
  );
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual(
    [],
  );
});

it('Adding a songs works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs(['a'], makeCallbackIfc(set, initialSnapshot)),
  );
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual([
    'a',
  ]);
  expect(
    nextSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(0);

  const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], makeCallbackIfc(set, nextSnapshot));
    AddSongs(['a', 'c'], makeCallbackIfc(set, nextSnapshot));
  });
  expect(
    finalSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual(['a', 'b', 'a', 'c']);
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
