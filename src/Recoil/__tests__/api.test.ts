import {
  CallbackInterface,
  RecoilState,
  Snapshot,
  snapshot_UNSTABLE,
} from 'recoil';
import { AddSongs, PlaySongs } from '../api';
import { currentIndexAtom, songListAtom } from '../Local';

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
    initialSnapshot.getLoadable(songListAtom).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexAtom).valueOrThrow(),
  ).toStrictEqual(-1);

  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs([], makeCallbackIfc(set, initialSnapshot)),
  );
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual(
    [],
  );
});

it('Adding a songs works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs(['a'], makeCallbackIfc(set, initialSnapshot)),
  );
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'a',
  ]);
  expect(
    nextSnapshot.getLoadable(currentIndexAtom).valueOrThrow(),
  ).toStrictEqual(0);

  const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], makeCallbackIfc(set, nextSnapshot));
    AddSongs(['a', 'c'], makeCallbackIfc(set, nextSnapshot));
  });
  expect(finalSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'a',
    'b',
    'a',
    'c',
  ]);
});

it('Playing songs works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], makeCallbackIfc(set, initialSnapshot));
    PlaySongs(['d', 'e'], makeCallbackIfc(set, initialSnapshot));
  });
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'd',
    'e',
  ]);
});
