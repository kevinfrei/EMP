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
import { RecoilState, TransactionInterface_UNSTABLE } from 'recoil';

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

type RecoilSetter = <T>(
  rv: RecoilState<T>,
  valOrUpdate: ((curVal: T) => T) | T,
) => void;
type RecoilGetter = <T>(rv: RecoilState<T>) => T;

function makeCallbackIfc(
  set: RecoilSetter,
  get: RecoilGetter,
): TransactionInterface_UNSTABLE {
  return {
    set,
    get,
    reset: (rv: RecoilState<any>) => {
      err("Reset doesn't work in here :(");
      return;
    },
  };
}

it('Need to update this to use the transaction api', () =>
  expect(true).toBeTruthy());
/* 

it('Adding empty songs does nothing', async () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListState).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(-1);

  const nextSnapshot = snapshot_UNSTABLE(({ set }) =>
    AddSongs(makeCallbackIfc(set, initialSnapshot), []),
  );
  expect(nextSnapshot).toBeDefined();
  await flushPromisesAndTimers();
  const finalSnapshot = snapshot_UNSTABLE();
  expect(finalSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual(
    [],
  );
});

it('Adding song(s) works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(initialSnapshot.getLoadable(currentIndexState).valueOrThrow()).toBe(
    -1,
  );
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongsSync(makeCallbackIfc(set, initialSnapshot), ['a']);
  });
  expect(
    nextSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(0);
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual([
    'a',
  ]);

  const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongsSync(makeCallbackIfc(set, nextSnapshot), ['a', 'b']);
    AddSongsSync(makeCallbackIfc(set, nextSnapshot), ['a', 'c']);
  });
  expect(
    finalSnapshot.getLoadable(currentIndexState).valueOrThrow(),
  ).toStrictEqual(0);
  expect(finalSnapshot.getLoadable(songListState).valueMaybe()).toStrictEqual([
    'a',
    'b',
    'a',
    'c',
  ]);
});
it('Playing songs works properly', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongsSync(makeCallbackIfc(set, initialSnapshot), ['a', 'b']);
    PlaySongsSync(makeCallbackIfc(set, initialSnapshot), ['d', 'e']);
  });
  expect(nextSnapshot.getLoadable(songListState).valueOrThrow()).toStrictEqual([
    'd',
    'e',
  ]);
});

*/
