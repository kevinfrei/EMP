import { ToPathSafeName } from '@freik/core-utils';
import { Album } from '@freik/media-core';
import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { getMusicDB } from './MusicAccess';

export type ImageCache<T> = {
  get(key: T): Promise<Buffer | void>;
  put(data: Buffer, key: T): Promise<void>;
  clear(): Promise<void>;
};

function MakeImageStore<T>(
  name: string,
  keyLookup: (key: T) => Promise<string>,
): ImageCache<T> {
  const imageStoreDir = path.join(app.getPath('userData'), name);
  const thePath = async (key: T): Promise<string> => {
    try {
      await fs.mkdir(imageStoreDir, { recursive: true });
    } catch (e) {
      // The dir was already created...
    }
    return path.join(imageStoreDir, ToPathSafeName(await keyLookup(key)));
  };
  return {
    get: async (key: T): Promise<Buffer | void> => {
      try {
        const filepath = await thePath(key);
        return await fs.readFile(filepath);
      } catch (e) {
        // No file found...
      }
    },
    put: async (data: Buffer, key: T): Promise<void> => {
      const filepath = await thePath(key);
      await fs.writeFile(filepath, data);
    },
    clear: async (): Promise<void> => {
      await fs.rmdir(imageStoreDir, { recursive: true });
    },
  };
}

let albumCoverCache: ImageCache<Album> | null = null;
export function AlbumCoverCache(): ImageCache<Album> {
  if (albumCoverCache === null) {
    albumCoverCache = MakeImageStore(
      'albumCoverCache',
      async (album: Album) => {
        const db = await getMusicDB();
        if (db) {
          let artist = 'Compilation';
          if (album.primaryArtists.length > 0) {
            const art = db.artists.get(album.primaryArtists[0]);
            if (art) {
              artist = art.name;
            }
          }
          return `${artist}*${album.title}`;
        }
        return '**' + album.title;
      },
    );
  }
  return albumCoverCache;
}

export async function FlushImageCache(): Promise<void> {
  await AlbumCoverCache().clear();
}
