/*
import { snapshot_UNSTABLE } from 'recoil';
import { currentIndexState, songListState } from '../Local';

jest.mock('../../MyWindow');

it('Adding empty songs does nothing', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(-1);
});

*/
import { MakeError } from '@freik/core-utils';
import { act } from 'react-test-renderer';
import {
  CallbackInterface,
  RecoilState,
  Snapshot,
  snapshot_UNSTABLE,
} from 'recoil';
import { AddSongs } from '../api';
import { currentIndexState, songListState } from '../Local';

const err = MakeError('api.test');

jest.useFakeTimers();
jest.mock('../../MyWindow');

function flushPromisesAndTimers(): Promise<void> {
  // Wrap flush with act() to avoid warning that only shows up in OSS environment
  return act(
    () =>
      new Promise((resolve) => {
        // eslint-disable-next-line no-restricted-globals
        setTimeout(resolve, 100);
        jest.runAllTimers();
      }),
  );
}

function makeCallbackIfc(
  set: <T>(rv: RecoilState<T>, valOrUpdate: ((curVal: T) => T) | T) => void,
  snapshot: Snapshot,
): CallbackInterface {
  return {
    set,
    snapshot,
    reset: (rv: RecoilState<any>) => {
      err("Reset doesn't work in here :(");
      return;
    },
    gotoSnapshot: (sh: Snapshot) => {
      return;
    },
  };
}
it('Adding empty songs does nothing', async () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(-1);

  const nextSnapshot = snapshot_UNSTABLE(
    ({ set }) => void AddSongs([], makeCallbackIfc(set, initialSnapshot)),
  );
  await flushPromisesAndTimers();
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual(
    [],
  );
});

it('Adding song(s) works properly', async () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(initialSnapshot.getLoadable(currentIndexState).valueOrThrow()).toBe(
    -1,
  );
  await flushPromisesAndTimers();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a'], makeCallbackIfc(set, initialSnapshot))
      .then(() => {
        /* nothin' */
      })
      .catch((reason) => {
        err('failed');
        err(reason);
      });
  });
  await flushPromisesAndTimers();
  /*  expect(
    nextSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(0);
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual([
    'a',
  ]);*/
  const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], makeCallbackIfc(set, nextSnapshot))
      .then(() => {
        AddSongs(['a', 'c'], makeCallbackIfc(set, nextSnapshot))
          .then(() => {
            /*     expect(
              finalSnapshot.getLoadable(songListState).valueOrThrow(),
            ).toStrictEqual(['a', 'b', 'a', 'c']);*/
          })
          .catch((reason) => fail(reason));
      })
      .catch((reason) => fail(reason));
  });
});
/*
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
