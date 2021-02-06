import { MakeLogger, SongKey, Type } from '@freik/core-utils';
import * as persist from './persist';

const log = MakeLogger('SongLikesAndHates'); // eslint-disable-line

async function getSongPrefs(which: string): Promise<SongKey[]> {
  log('getSongPrefs');
  const songList = await persist.getItemAsync(which);
  if (Type.isString(songList)) {
    return songList.split('\n');
  }
  return [];
}

export async function getSongLikes(): Promise<SongKey[]> {
  return await getSongPrefs('likes');
}

export async function getSongHates(): Promise<SongKey[]> {
  return await getSongPrefs('hates');
}

export async function setSongLikes(keys: SongKey[]): Promise<void> {
  const likes = new Set<SongKey>(await getSongLikes());
  const hates = new Set<SongKey>(await getSongHates());
  const likeCount = likes.size;
  const hateCount = hates.size;
  for (const nu of keys) {
    likes.add(nu);
    hates.delete(nu);
  }
  if (likes.size !== likeCount) {
    await persist.setItemAsync('likes', [...likes.keys()].join('\n'));
  }
  if (hates.size !== hateCount) {
    await persist.setItemAsync('hates', [...hates.keys()].join('\n'));
  }
}

export async function setSongHates(keys: SongKey[]): Promise<void> {
  const likes = new Set<SongKey>(await getSongLikes());
  const hates = new Set<SongKey>(await getSongHates());
  const likeCount = likes.size;
  const hateCount = hates.size;
  for (const nu of keys) {
    likes.delete(nu);
    hates.add(nu);
  }
  if (likes.size !== likeCount) {
    await persist.setItemAsync('likes', [...likes.keys()].join('\n'));
  }
  if (hates.size !== hateCount) {
    await persist.setItemAsync('hates', [...hates.keys()].join('\n'));
  }
}

export async function clearSongLikes(keys: SongKey[]): Promise<void> {
  const likes = new Set<SongKey>(await getSongLikes());
  const likeCount = likes.size;
  for (const nu of keys) {
    likes.delete(nu);
  }
  if (likes.size !== likeCount) {
    await persist.setItemAsync('likes', [...likes.keys()].join('\n'));
  }
}

export async function clearSongHates(keys: SongKey[]): Promise<void> {
  const hates = new Set<SongKey>(await getSongHates());
  const hateCount = hates.size;
  for (const nu of keys) {
    hates.delete(nu);
  }
  if (hates.size !== hateCount) {
    await persist.setItemAsync('hates', [...hates.keys()].join('\n'));
  }
}
