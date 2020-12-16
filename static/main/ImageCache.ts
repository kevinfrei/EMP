import { Album } from '@freik/core-utils';
import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

export type ImageCache = {
  get(album: Album): Promise<Buffer | void>;
  put(data: Buffer, album: Album): Promise<void>;
  clear(): Promise<void>;
};

function MakeImageStore(name: string): ImageCache {
  //  const artSN = SeqNum('ART');
  const imageStoreDir = path.join(app.getPath('userData'), name);
  const thePath = async (album: Album): Promise<string> => {
    try {
      await fs.mkdir(imageStoreDir, { recursive: true });
    } catch (e) {
      // The dir was already created...
    }
    return path.join(imageStoreDir, album.key);
  };
  return {
    get: async (album: Album): Promise<Buffer | void> => {
      try {
        const filepath = await thePath(album);
        return await fs.readFile(filepath);
      } catch (e) {
        // No file found...
      }
    },
    put: async (data: Buffer, album: Album): Promise<void> => {
      const filepath = await thePath(album);
      await fs.writeFile(filepath, data);
    },
    clear: async (): Promise<void> => {
      await fs.rmdir(imageStoreDir, { recursive: true });
    },
  };
}

let theCache: ImageCache | null = null;
export function GetImageCache(): ImageCache {
  if (theCache === null) {
    theCache = MakeImageStore('albumCoverCache');
  }
  return theCache;
}

export async function FlushImageCache(): Promise<void> {
  await GetImageCache().clear();
}
