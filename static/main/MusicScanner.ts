import { promises as fsp } from 'fs';
import path from 'path';
import { Metadata as metadata } from '@freik/media-utils';
import { Comparisons, FTON, Logger, SeqNum } from '@freik/core-utils';

import * as persist from './persist';

import type { FullMetadata, SimpleMetadata } from '@freik/media-utils';
import type { Dirent } from 'fs';

import type {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '../../src/DataSchema';

export interface ServerSong extends Song {
  path: string;
}
const log = Logger.bind('music');
// Logger.enable('music');

const setEqual = Comparisons.SetEqual;

export type VAType = '' | 'ost' | 'va';

export type MusicDB = {
  songs: Map<SongKey, ServerSong>;
  albums: Map<AlbumKey, Album>;
  artists: Map<ArtistKey, Artist>;
  pictures: Map<AlbumKey, string>;
  albumTitleIndex: Map<string, AlbumKey[]>;
  artistNameIndex: Map<string, ArtistKey>;
};

let existingKeys: Map<string, SongKey> | null = null;
const newSongKey = (() => {
  const highestSongKey = persist.getItem('highestSongKey');
  if (highestSongKey) {
    log(`highestSongKey: ${highestSongKey}`);
    return SeqNum('S', highestSongKey);
  } else {
    log('no highest song key found');
    return SeqNum('S');
  }
})();
const newAlbumKey = SeqNum('L');
const newArtistKey = SeqNum('R');

function getSongKey(songPath: string) {
  if (existingKeys) {
    return existingKeys.get(songPath) || newSongKey();
  } else {
    return newSongKey();
  }
}

function getOrNewArtist(db: MusicDB, name: string): Artist {
  const maybeKey: ArtistKey | undefined = db.artistNameIndex.get(
    name.toLowerCase(),
  );
  if (maybeKey) {
    const art = db.artists.get(maybeKey);
    if (art) {
      return art;
    }
    log("DB inconsistency - artist key by name doesn't exist in key index");
    // Fall-through and just overwrite the artistNameIndex with a new key...
  }
  const key: ArtistKey = newArtistKey();
  db.artistNameIndex.set(name.toLowerCase(), key);
  const artist: Artist = { name, songs: [], albums: [], key };
  db.artists.set(key, artist);
  return artist;
}

function getOrNewAlbum(
  db: MusicDB,
  title: string,
  year: number,
  artists: Set<ArtistKey>,
  vatype: VAType,
): Album {
  // TODO: This doesn't currently handle vatypes properly :/
  const maybeSharedNames: AlbumKey[] | undefined = db.albumTitleIndex.get(
    title.toLowerCase(),
  );
  let sharedNames: AlbumKey[];
  if (!maybeSharedNames) {
    sharedNames = [];
    db.albumTitleIndex.set(title.toLowerCase(), sharedNames);
  } else {
    sharedNames = maybeSharedNames;
  }
  // sharedNames is the list of existing albums with this title
  // It might be empty (coming from 5 lines up there ^^^ )
  for (const albumKey of sharedNames) {
    const alb: Album | undefined = db.albums.get(albumKey);
    if (!alb) {
      log(
        `DB inconsistency - album (key: ${albumKey}) by title doesn't exist in index`,
      );
      // We don't have an easy recovery from this particular inconsistency
      continue;
    }
    const check: Album = alb;
    if (check.title.toLowerCase() !== title.toLowerCase()) {
      log(`DB inconsistency - album title index inconsistency`);
      continue;
    }
    if (check.year !== year || check.vatype !== vatype) {
      continue;
    }
    // For VA type albums, we can ignore the artist list
    if (vatype.length > 0) {
      return check;
    }
    // Set equality...
    if (!setEqual(check.primaryArtists, artists)) {
      continue;
    }
    // If we're here, we've found the album we're looking for
    // Before returning, ensure that the artists have this album in their set
    for (const art of artists) {
      const thisArtist: Artist | undefined = db.artists.get(art);
      if (!thisArtist) {
        continue;
      }
      const albums: Set<AlbumKey> = new Set(thisArtist.albums);
      if (albums.has(check.key)) {
        continue;
      }
      thisArtist.albums.push(check.key);
    }
    return check;
  }
  // If we've reached this code, we need to create a new album
  // sharedNames is already the (potentially empty) array of albumKeys
  // for the given title, so we can just add it to that array
  const key: AlbumKey = newAlbumKey();
  const album: Album = {
    year,
    primaryArtists: artists,
    title,
    vatype,
    songs: [],
    key,
  };
  sharedNames.push(key);
  db.albums.set(key, album);
  return album;
}

function AddSongToDatabase(md: FullMetadata, db: MusicDB) {
  // We need to go from textual metadata to artist, album, and song keys
  // First, get the primary artist
  // TODO: FullMetaData doesn't allow for multiple primary artists
  // Check Trent Reznor & Atticus Ross for an example where it kinda matters
  const tmpArtist: string | string[] = md.Artist;
  const artists = typeof tmpArtist === 'string' ? [tmpArtist] : tmpArtist;
  const allArtists = artists.map((a) => getOrNewArtist(db, a));
  const artistIds: ArtistKey[] = allArtists.map((a) => a.key);
  const artistSet: Set<ArtistKey> = new Set(artistIds);
  const album = getOrNewAlbum(
    db,
    md.Album,
    md.Year || 0,
    artistSet,
    md.VAType || '',
  );
  const secondaryIds: ArtistKey[] = [];
  if (md.MoreArtists) {
    for (const sa of md.MoreArtists) {
      const moreArt: Artist = getOrNewArtist(db, sa);
      allArtists.push(moreArt);
      secondaryIds.push(moreArt.key);
    }
  }
  const theSong: ServerSong = {
    path: md.OriginalPath,
    artistIds,
    secondaryIds,
    albumId: album.key,
    track: md.Track,
    title: md.Title,
    key: getSongKey(md.OriginalPath),
  };
  album.songs.push(theSong.key);
  allArtists.forEach((artist) => artist.songs.push(theSong.key));
  db.songs.set(theSong.key, theSong);
}

async function HandleAlbumCovers(db: MusicDB, pics: string[]) {
  // Get all pictures from each directory.
  // Find the biggest and make it the album picture for any albums in that dir
  const dirsToPics = new Map<string, Set<string>>();
  for (const p of pics) {
    const dirName = path.dirname(p);
    const val = dirsToPics.get(dirName);
    if (val) {
      val.add(p);
    } else {
      dirsToPics.set(dirName, new Set([p]));
    }
  }
  const dirsToAlbums = new Map<string, Set<Album>>();
  for (const a of db.albums.values()) {
    for (const s of a.songs) {
      const theSong = db.songs.get(s);
      if (!theSong) {
        continue;
      }
      const thePath = theSong.path;
      const dirName = path.dirname(thePath);
      // We only need to track directories if we found folders in them...
      if (!dirsToPics.has(dirName)) {
        continue;
      }
      const val = dirsToAlbums.get(dirName);
      if (val) {
        val.add(a);
      } else {
        dirsToAlbums.set(dirName, new Set([a]));
      }
    }
  }
  // Now, for each dir, find the biggest file and dump it in the database
  // for each album that has stuff in that directory
  type SizeAndName = { size: number; name: string };
  for (const [dirName, setOfFiles] of dirsToPics) {
    const albums = dirsToAlbums.get(dirName);
    if (!albums || !albums.size) {
      continue;
    }
    let largest: SizeAndName = { size: 0, name: '' };
    for (const cur of setOfFiles.values()) {
      const fileStat = await fsp.stat(cur);
      if (fileStat.size > largest.size) {
        largest = { size: fileStat.size, name: cur };
      }
    }
    for (const album of albums) {
      db.pictures.set(album.key, largest.name);
    }
  }
  // TODO: Look inside song metadata
}

async function fileNamesToDatabase(
  files: string[],
  pics: string[],
): Promise<MusicDB> {
  const songs = new Map<SongKey, ServerSong>();
  const albums = new Map<AlbumKey, Album>();
  const artists = new Map<ArtistKey, Artist>();
  const albumTitleIndex = new Map<string, AlbumKey[]>();
  const artistNameIndex = new Map<string, ArtistKey>();
  const pictures = new Map<AlbumKey, string>();
  const db: MusicDB = {
    songs,
    albums,
    artists,
    pictures,
    albumTitleIndex,
    artistNameIndex,
  };

  // Get the list of existing paths to song-keys
  const shiStr = await persist.getItemAsync('songHashIndex');
  existingKeys = shiStr
    ? (FTON.parse(shiStr) as Map<string, SongKey>)
    : new Map();

  for (const file of files) {
    const littlemd: SimpleMetadata | void = metadata.fromPath(file);
    if (!littlemd) {
      log('Unable to get metadata from file ' + file);
      continue;
    }
    const md: FullMetadata | void = metadata.FullFromObj(file, littlemd as any);
    if (!md) {
      log('Unable to get full metadata from file ' + file);
      continue;
    }
    AddSongToDatabase(md, db);
  }
  await HandleAlbumCovers(db, pics);
  await persist.setItemAsync(
    'songHashIndex',
    FTON.stringify(
      new Map([...db.songs.values()].map((val) => [val.path, val.key])),
    ),
  );
  await persist.setItemAsync('highestSongKey', newSongKey());
  return db;
}

const audioTypes = new Set(['.flac', '.mp3', '.aac', '.m4a']);
const imageTypes = new Set(['.png', '.jpg', '.jpeg']);
const isOfType = (filename: string, types: Set<string>) =>
  !path.basename(filename).startsWith('.') &&
  types.has(path.extname(filename).toLowerCase());
const isMusicType = (filename: string) => isOfType(filename, audioTypes);
const isImageType = (filename: string) => isOfType(filename, imageTypes);

export async function find(locations: string[]): Promise<MusicDB> {
  // If we have too many locations, this is *baaaad* but oh well...
  const queue: string[] = locations;
  const songsList: string[] = [];
  const picList: string[] = [];
  while (queue.length > 0) {
    const i = queue.pop();
    let dirents: Dirent[] | null = null;
    try {
      if (i) {
        dirents = await fsp.readdir(i, { withFileTypes: true });
      } else {
        continue;
      }
    } catch (e) {
      log(`Unable to read ${i || '<unknown>'}`);
      continue;
    }
    if (!dirents) {
      continue;
    }
    for (const dirent of dirents) {
      try {
        if (dirent.isSymbolicLink()) {
          const ap = await fsp.realpath(path.join(i, dirent.name));
          const st = await fsp.stat(ap);
          if (st.isDirectory()) {
            queue.push(ap);
          } else if (st.isFile()) {
            if (isMusicType(ap)) {
              songsList.push(ap);
            } else if (isImageType(ap)) {
              picList.push(ap);
            }
          }
        } else if (dirent.isDirectory()) {
          queue.push(path.join(i, dirent.name));
        } else if (dirent.isFile()) {
          if (isMusicType(dirent.name)) {
            songsList.push(path.join(i, dirent.name));
          } else if (isImageType(dirent.name)) {
            picList.push(path.join(i, dirent.name));
          }
        }
      } catch (e) {
        log('Unable to process dirent:');
        log(dirent);
        continue;
      }
    }
  }
  return await fileNamesToDatabase(songsList, picList);
}
