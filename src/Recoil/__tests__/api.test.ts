import { snapshot_UNSTABLE } from 'recoil';
import { AddSongs, PlaySongs } from '../api';
import { currentIndexAtom, songListAtom } from '../Local';

it('Adding empty songs does nothing', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(
    initialSnapshot.getLoadable(songListAtom).valueOrThrow(),
  ).toStrictEqual([]);
  expect(
    initialSnapshot.getLoadable(currentIndexAtom).valueOrThrow(),
  ).toStrictEqual(-1);

  const nextSnapshot = snapshot_UNSTABLE(({ set }) => AddSongs([], set));
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual(
    [],
  );
});

it('Adding a songs works properly', () => {
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => AddSongs(['a'], set));
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'a',
  ]);
  expect(
    nextSnapshot.getLoadable(currentIndexAtom).valueOrThrow(),
  ).toStrictEqual(0);

  const finalSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], set);
    AddSongs(['a', 'c'], set);
  });
  expect(finalSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'a',
    'b',
    'a',
    'c',
  ]);
});

it('Playing songs works properly', () => {
  const nextSnapshot = snapshot_UNSTABLE(({ set }) => {
    AddSongs(['a', 'b'], set);
    PlaySongs(['d', 'e'], set);
  });
  expect(nextSnapshot.getLoadable(songListAtom).valueOrThrow()).toStrictEqual([
    'd',
    'e',
  ]);
});
