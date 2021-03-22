import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Comparisons,
  FullMetadata,
  MakeError,
  MakeLogger,
  SeqNum,
  SimpleMetadata,
  SongKey,
  Type,
} from '@freik/core-utils';
import { Metadata } from '@freik/media-utils';
import electronIsDev from 'electron-is-dev';
import { Dirent, promises as fsp } from 'fs';
import path from 'path';
import { h32 } from 'xxhashjs';
import { GetMetadataStore, isFullMetadata } from './metadata';
import {
  MusicFragment,
  noArticlesCmp,
  normalizeName,
  ServerSong,
  setIntersection,
  VAType,
} from './MusicScanner';
const log = MakeLogger('new-db', false && electronIsDev);
const err = MakeError('new-db-err');

const setEqual = Comparisons.ArraySetEqual;

const newAlbumKey = SeqNum('L');
const newArtistKey = SeqNum('R');
const existingSongKeys = new Map<number, [string, string]>();

function getSongKey(prefix: string, fragmentNum: number, songPath: string) {
  if (songPath.startsWith(prefix)) {
    let hash = h32(songPath, fragmentNum).toNumber();
    while (existingSongKeys.has(hash)) {
      const val = existingSongKeys.get(hash);
      if (Type.isArray(val) && val[0] === prefix && songPath === val[1]) {
        break;
      }
      err(`songKey hash collision: "${songPath}"`);
      hash = h32(songPath, hash).toNumber();
    }
    existingSongKeys.set(hash, [prefix, songPath]);
    return `S${hash.toString(36)}`;
  }
  throw Error(`Invalid prefix ${prefix} for songPath ${songPath}`);
}

function getOrNewArtist(db: MusicFragment, name: string): Artist {
  const maybeKey: ArtistKey | undefined = db.artistNameIndex.get(
    normalizeName(name),
  );
  if (maybeKey) {
    const art = db.artists.get(maybeKey);
    if (art) {
      return art;
    }
    err("DB inconsistency - artist key by name doesn't exist in key index");
    // Fall-through and just overwrite the artistNameIndex with a new key...
  }
  const key: ArtistKey = newArtistKey();
  db.artistNameIndex.set(normalizeName(name), key);
  const artist: Artist = { name, songs: [], albums: [], key };
  db.artists.set(key, artist);
  return artist;
}

function getOrNewAlbum(
  db: MusicFragment,
  title: string,
  year: number,
  artists: ArtistKey[],
  secondaryArtists: ArtistKey[],
  vatype: VAType,
  dirName: string,
): Album {
  // TODO: This doesn't currently handle vatypes properly :/
  const maybeSharedNames = db.albumTitleIndex.get(normalizeName(title));
  let sharedNames: AlbumKey[];
  if (!maybeSharedNames) {
    sharedNames = [];
    db.albumTitleIndex.set(normalizeName(title), sharedNames);
  } else {
    sharedNames = maybeSharedNames;
  }

  // sharedNames is the list of existing albums with this title
  // It might be empty (coming from a few lines up there ^^^ )
  for (const albumKey of sharedNames) {
    const alb: Album | undefined = db.albums.get(albumKey);
    if (!alb) {
      err(
        `DB inconsistency - album (key: ${albumKey}) by title doesn't exist in index`,
      );
      // We don't have an easy recovery from this particular inconsistency
      continue;
    }
    const check: Album = alb;
    if (noArticlesCmp(check.title, title) !== 0) {
      err(`DB inconsistency - album title index inconsistency`);
      continue;
    }
    if (check.year !== year) {
      continue;
    }
    // For VA type albums, we can ignore the artist list
    if (check.vatype === vatype && vatype.length > 0) {
      return check;
    }
    // Set equality...
    if (!setEqual(check.primaryArtists, artists)) {
      // If the primaryArtists is different, but the files are in the same
      // location, override the VA type update the primaryArtists list and
      // return this one.
      const anotherSong = db.songs.get(check.songs[0]);
      if (!anotherSong) {
        continue;
      }
      /*
      This makes things mess up a bit, so let's not do it...
      if (path.dirname(anotherSong.path) !== dirName) {
        continue;
      }
      */
      // Check to see if there's a common subset of artists
      const commonArtists = setIntersection(check.primaryArtists, artists);
      const demoteArtists = (
        primaryArtists: ArtistKey[],
        secondArtists: ArtistKey[],
      ) => {
        for (let i = primaryArtists.length - 1; i >= 0; i--) {
          if (commonArtists.has(primaryArtists[i])) {
            continue;
          }
          // THIS MUTATES THE TWO ARRAYS! THIS IS BY DESIGN :O
          secondArtists.push(primaryArtists[i]);
          primaryArtists.splice(i, 1);
        }
      };
      if (commonArtists.size > 0) {
        // This means we still have a common set of artists, but we need to
        // "demote" some artists from primary to secondary
        // First, let's demote the song's artists
        demoteArtists(artists, secondaryArtists);
        // Okay, done with the song. For the album, we need to demote primary
        // artists not just for the album, but for any songs already on the
        // album already...
        for (let j = check.primaryArtists.length - 1; j >= 0; j--) {
          if (commonArtists.has(check.primaryArtists[j])) {
            continue;
          }
          // This artist needs to be removed. First, bump it to secondary for
          // each song
          for (const s of check.songs) {
            const sng = db.songs.get(s);
            if (!sng) {
              err('Unable to find a referenced song');
              continue;
            }
            demoteArtists(sng.artistIds, sng.secondaryIds);
          }
        }
        return check;
      }
      if (false) {
        err('Found a likely mismarked VA song:');
        err(check);
        err('For this directory:');
        err(dirName);
        err('Artists:');
        err(artists);
      }
      check.vatype = 'va';
      check.primaryArtists = [];
      return check;
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
    primaryArtists: vatype === '' ? artists : [],
    title,
    vatype,
    songs: [],
    key,
  };
  sharedNames.push(key);
  db.albums.set(key, album);
  return album;
}

function AddSongToDatabase(
  prefix: string,
  md: FullMetadata,
  db: MusicFragment,
) {
  // We need to go from textual metadata to artist, album, and song keys
  // First, get the primary artist
  const tmpArtist: string | string[] = md.artist;
  const artists = typeof tmpArtist === 'string' ? [tmpArtist] : tmpArtist;
  const allArtists = artists.map((a) => getOrNewArtist(db, a));
  const artistIds: ArtistKey[] = allArtists.map((a) => a.key);
  const secondaryIds: ArtistKey[] = [];
  for (const sa of md.moreArtists || []) {
    const moreArt: Artist = getOrNewArtist(db, sa);
    allArtists.push(moreArt);
    secondaryIds.push(moreArt.key);
  }
  const album = getOrNewAlbum(
    db,
    md.album,
    md.year || 0,
    artistIds,
    secondaryIds,
    md.vaType || '',
    path.dirname(md.originalPath),
  );
  const theSong: ServerSong = {
    path: md.originalPath,
    artistIds,
    secondaryIds,
    albumId: album.key,
    track: md.track + (md.disk || 0) * 100,
    title: md.title,
    key: getSongKey(prefix, db.fragmentKey, md.originalPath),
    variations: md.variations,
  };
  album.songs.push(theSong.key);
  allArtists.forEach((artist) => artist.songs.push(theSong.key));
  db.songs.set(theSong.key, theSong);
}

async function HandleAlbumCovers(db: MusicFragment, pics: string[]) {
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
  // Metadata-hosted album covers are only acquired "on demand"?
}

async function fileNamesToFragment(
  prefix: string,
  fragmentKey: number,
  files: string[],
  pics: string[],
): Promise<MusicFragment> {
  const songs = new Map<SongKey, ServerSong>();
  const albums = new Map<AlbumKey, Album>();
  const artists = new Map<ArtistKey, Artist>();
  const albumTitleIndex = new Map<string, AlbumKey[]>();
  const artistNameIndex = new Map<string, ArtistKey>();
  const pictures = new Map<AlbumKey, string>();
  const db: MusicFragment = {
    fragmentKey,
    songs,
    albums,
    artists,
    pictures,
    albumTitleIndex,
    artistNameIndex,
  };

  const now = Date.now();
  const metadataCache = await GetMetadataStore('metadataCache');
  const metadataOverride = await GetMetadataStore('metadataOverride');
  const tryHarder: string[] = [];
  const fileNamesSeen: Set<string> = new Set<string>();
  for (const file of files) {
    // This handles the situation of adding /foo and the /foo/bar
    // as file locations
    if (fileNamesSeen.has(file)) {
      continue;
    }
    fileNamesSeen.add(file);

    // If we've previously failed doing anything with this file, don't keep
    // banging our head against a wall
    if (!metadataCache.shouldTry(file)) {
      continue;
    }
    // Cached data overrides file path acquired metadata
    const mdOverride = metadataOverride.get(file);
    const littlemd: SimpleMetadata | void = Metadata.fromPath(file);
    if (!littlemd) {
      log('Unable to get metadata from file ' + file);
      tryHarder.push(file);
      continue;
    }
    const fullMd = Metadata.FullFromObj(file, littlemd as any);
    const md = { ...fullMd, ...mdOverride };

    if (!isFullMetadata(md)) {
      log('Unable to get full metadata from file ' + file);
      tryHarder.push(file);
      continue;
    }

    // We *could* save this data to disk, but honestly,
    // I don't think it's going to be measurably faster,
    // and I'd rather not waste the space
    AddSongToDatabase(prefix, md, db);
  }

  const fileNameParseTime = Date.now();
  await HandleAlbumCovers(db, pics);
  for (const file of tryHarder) {
    let maybeMetadata = null;
    try {
      maybeMetadata = await Metadata.fromFileAsync(file);
    } catch (e) {
      err(`Failed acquiring metadata from ${file}:`);
      err(e);
    }
    if (!maybeMetadata) {
      log(`Complete metadata failure for ${file}`);
      metadataCache.fail(file);
      continue;
    }
    const fullMd = Metadata.FullFromObj(file, maybeMetadata as any);
    if (!fullMd) {
      log(`Partial metadata failure for ${file}`);
      metadataCache.fail(file);
      continue;
    }
    const mdOverride = metadataOverride.get(file);
    const md = { ...fullMd, ...mdOverride };
    metadataCache.set(file, md);
    AddSongToDatabase(prefix, md, db);
  }
  const fileMetadataParseTime = Date.now();
  log(`File names: ${fileNameParseTime - now}`);
  log(`Metadata  : ${fileMetadataParseTime - fileNameParseTime}`);
  await metadataCache.save();
  return db;
}

const audioTypes = new Set(['.flac', '.mp3', '.aac', '.m4a']);
const imageTypes = new Set(['.png', '.jpg', '.jpeg']);
function isOfType(
  filename: string,
  types: Set<string>,
  hidden?: boolean,
): boolean {
  return (
    (hidden || !path.basename(filename).startsWith('.')) &&
    types.has(path.extname(filename).toLowerCase())
  );
}
const isMusicType = (filename: string) => isOfType(filename, audioTypes);
// Hidden images are fine for cover art (actually, maybe preferred!
const isImageType = (filename: string) => isOfType(filename, imageTypes, true);

function getSharedPrefix(paths: string[]): string {
  let curPrefix: string | null = null;
  for (const filePath of paths) {
    if (curPrefix === null) {
      curPrefix = filePath;
    } else {
      while (!filePath.startsWith(curPrefix)) {
        curPrefix = curPrefix.substr(0, curPrefix.length - 1);
      }
      if (curPrefix.length === 0) {
        return '';
      }
    }
  }
  return curPrefix || '';
}

export async function FindFilesForFragment(
  location: string,
  fragmentHash: number,
): Promise<MusicFragment> {
  const queue: string[] = [location];
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
      err(`Unable to read ${i || '<unknown>'}`);
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
        err('Unable to process dirent:');
        err(dirent);
        continue;
      }
    }
  }
  log(`${songsList.length} songs found during folder scan`);
  log(`${picList.length} images found during folder scan`);
  const prefix = getSharedPrefix(songsList);
  const theDb = await fileNamesToFragment(
    prefix,
    fragmentHash,
    songsList,
    picList,
  );
  log(`${theDb.songs.size} song entries from the fileNamesToDatabase scan`);
  return theDb;
}
