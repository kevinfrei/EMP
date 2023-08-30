import { MakeMultiMap, MultiMap, isMultiMapOf } from '@freik/containers';
import {
  ArrayIntersection,
  ArraySetEqual,
  SetIntersection,
} from '@freik/helpers';
import { MakeLog } from '@freik/logger';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  FullMetadata,
  MediaKey,
  SongKey,
  isAlbum,
  isAlbumKey,
  isArtist,
  isArtistKey,
  isSong,
  isSongKey,
} from '@freik/media-core';
import {
  MakePersistence,
  PathUtil,
  Persist,
  Watcher,
  PathUtil as path,
} from '@freik/node-utils';
import { MakeSearchable } from '@freik/search';
import { MakeSingleWaiter } from '@freik/sync';
import {
  NoArticlesNormalizedStringCompare,
  NormalizeText,
  StripInitialArticles,
  ToB64,
} from '@freik/text';
import {
  Pickle,
  Unpickle,
  chkBothOf,
  chkMapOf,
  chkObjectOfType,
  chkStrField,
  hasField,
  hasFieldType,
  isArray,
  isArrayOf,
  isDefined,
  isMapOf,
  isNumber,
  isString,
  isUndefined,
} from '@freik/typechk';
import { promises as fsp } from 'fs';
import { h32 } from 'xxhashjs';
import {
  AudioFileIndex,
  AudioFileIndexOptions,
  GetIndexForKey,
  GetIndexForPath,
  MakeAudioFileIndex,
} from './AudioFileIndex.js';
import { MakeBlobStore } from './BlobStore.js';
import { MusicSearch, SearchResults } from './MusicSearch.js';
import type { IgnoreType, SongWithPath, VAType } from './types.js';

const { log, wrn } = MakeLog('AudioDatabase');

/**
 * FlatAudioDatabase
 *
 * A 'flat' collection of `SongWithPath`s, `Artist`s, and `Album`s
 *
 * @public
 */
export type FlatAudioDatabase = {
  songs: SongWithPath[];
  artists: Artist[];
  albums: Album[];
};

export type AudioDatabase = {
  // Database API
  getSong(key: SongKey): SongWithPath | void;
  getAlbum(key: AlbumKey): Album | void;
  getArtist(key: ArtistKey): Artist | void;
  getSongFromPath(filepath: string): SongKey;
  searchIndex(substring: boolean, term: string): SearchResults;

  // Full File Index stuff
  addAudioFileIndex(idx: AudioFileIndex): Promise<boolean>;
  removeAudioFileIndex(idx: AudioFileIndex): Promise<boolean>;

  // "Implied" File Index stuff
  addFileLocation(str: string): Promise<boolean>;
  removeFileLocation(str: string): Promise<boolean>;
  getLocations(): string[];

  // Pictures
  getAlbumPicture(key: AlbumKey): Promise<Buffer | void>;
  setAlbumPicture(key: AlbumKey, filepath: Buffer): Promise<void>;
  getArtistPicture(key: ArtistKey): Promise<Buffer | void>;
  setArtistPicture(key: ArtistKey, filepath: Buffer): Promise<void>;
  getSongPicture(key: SongKey): Promise<Buffer | void>;
  setSongPicture(key: SongKey, filepath: Buffer): Promise<void>;

  // Not sure about exposing these three
  // addSongFromPath(filepath: string): void; // Some Testing
  // delSongByPath(filepath: string): boolean; // Some Testing
  // delSongByKey(key: SongKey): boolean; // Some Testing

  // Ignoring stuff:
  addIgnoreItem(which: IgnoreType, value: string): void;
  removeIgnoreItem(which: IgnoreType, value: string): boolean;
  getIgnoreItems(): IterableIterator<[IgnoreType, string]>;

  // For all the 'parsed' data
  getFlatDatabase(): FlatAudioDatabase; // Some Testing

  // Loading from/saving to persistence
  load(): Promise<boolean>; // Some Testing
  save(): Promise<void>; // Some Testing

  // Updating
  refresh(): Promise<boolean>;

  // Metadata
  updateMetadata(fullPath: string, newMetadata: Partial<FullMetadata>): boolean;
  getMetadata(fullPathOrKey: string): Promise<FullMetadata | void>;
  getCanonicalFileName(song: SongKey): string | void;
  // addOrUpdateSong(md: FullMetadata): void;
};

function normalizeName(n: string): string {
  return NormalizeText(StripInitialArticles(n));
}

type PrivateAudioData = {
  dbAudioIndices: Map<string, AudioFileIndex>;
  dbSongs: Map<SongKey, SongWithPath>;
  dbAlbums: Map<AlbumKey, Album>;
  dbArtists: Map<ArtistKey, Artist>;
  albumTitleIndex: MultiMap<string, AlbumKey>;
  artistNameIndex: Map<string, ArtistKey>;
  keywordIndex: MusicSearch | null;
  ignoreInfo: MultiMap<IgnoreType, string>;
};

const artistHash = new Map<number, string>();
function newArtistKey(artistName: string): string {
  const name = normalizeName(artistName);
  let hashNum = h32().update(name).digest().toNumber();
  while (artistHash.has(hashNum)) {
    const checkName = artistHash.get(hashNum);
    if (checkName === name) {
      break;
    }
    // There's a hash conflict :/
    log('ArtistKey conflict discovered!');
    hashNum = h32(hashNum).update(name).digest().toNumber();
  }
  artistHash.set(hashNum, name);
  return `R${ToB64(hashNum)}`;
}

const albumHash = new Map<number, string>();
function newAlbumKey(
  albumName: string,
  artistName: string,
  year: number,
): string {
  const artistSummary = `${normalizeName(albumName)}*${normalizeName(
    artistName,
  )}*${year}`;
  let hashNum = h32().update(artistSummary).digest().toNumber();
  while (albumHash.has(hashNum)) {
    const checkName = albumHash.get(hashNum);
    if (checkName === artistSummary) {
      break;
    }
    // There's a hash conflict :/
    log('AlbumKey conflict discovered!');
    hashNum = h32(hashNum).update(artistSummary).digest().toNumber();
  }
  artistHash.set(hashNum, artistSummary);
  return `L${ToB64(hashNum)}`;
}

// Make sure we've got the disk name array filled in (at least with empties)
function EnsureDiskNums(album: Album, diskNum?: number, diskName?: string) {
  if (isNumber(diskNum)) {
    album.diskNames = hasFieldType(album, 'diskNames', isArray)
      ? album.diskNames
      : [];
    for (let i = 0; i < diskNum; i++) {
      // Fill in disk names. If we're creating new disk names, make them empty
      // If we've already got an empty disk name, update it to a "correct" disk
      // name if we see one
      if (
        !isString(album.diskNames[i]) ||
        (album.diskNames[i].length === 0 &&
          isString(diskName) &&
          diskName.length > 0)
      ) {
        album.diskNames[i] = i + 1 === diskNum ? diskName || '' : '';
      }
    }
  }
}

export type AudioDatabaseOptions = AudioFileIndexOptions & { audioKey: string };

function getPersistenceIdName(options: AudioDatabaseOptions): string {
  return options.audioKey;
}

function makeFullOptions(
  extraIgnoreFunc: Watcher,
  options?: Partial<AudioDatabaseOptions>,
): AudioDatabaseOptions {
  const func: Watcher | undefined =
    isDefined(options) && hasField(options, 'fileWatchFilter')
      ? options.fileWatchFilter
      : undefined;
  const fileWatchFilter: Watcher = isUndefined(func)
    ? extraIgnoreFunc
    : (filepath: string) => extraIgnoreFunc(filepath) && func(filepath);
  return {
    // Defaults:
    readOnlyFallbackLocation: 'read-only-stuff',
    audioKey: 'audio-database',
    watchHidden: false,
    // User stuff:
    ...options,
    // Overrides what's in options (because we combine them)
    fileWatchFilter,
  };
}

/**
 * This creates an Audio Database
 * @param localStorageLocation The location to store stuff outside of any particular Audio File Index *or* the Persist object to store stuff in
 * @param audioKey
 * @returns An AudioDatabase
 */
export async function MakeAudioDatabase(
  localStorageLocation: string | Persist,
  opts?: Partial<AudioDatabaseOptions>,
): Promise<AudioDatabase> {
  const fullOpts = makeFullOptions(ignoreWatchFilter, opts);
  const persistenceIdName = getPersistenceIdName(fullOpts);
  const persist = isString(localStorageLocation)
    ? MakePersistence(localStorageLocation)
    : localStorageLocation;
  const loc = PathUtil.join(persist.getLocation(), 'artists');
  try {
    await fsp.mkdir(loc, { recursive: true });
  } catch (e) {
    /* */
  }
  log('Artist Store Location: ' + loc);
  const artistStore = await MakeBlobStore<Artist>(
    (r: Artist) => r.name.toLowerCase(),
    loc,
  );

  /*
   * Private member data
   */
  const data: PrivateAudioData = {
    dbAudioIndices: new Map<string, AudioFileIndex>(),
    dbSongs: new Map<SongKey, SongWithPath>(),
    dbAlbums: new Map<AlbumKey, Album>(),
    dbArtists: new Map<ArtistKey, Artist>(),
    albumTitleIndex: MakeMultiMap<string, AlbumKey>(),
    artistNameIndex: new Map<string, ArtistKey>(),
    keywordIndex: null,
    ignoreInfo: MakeMultiMap<IgnoreType, string>(),
  };

  function getSongKey(songPath: string): string {
    const index = GetIndexForPath(songPath);
    if (!index) {
      throw new Error(`Can't find an index for the path ${songPath}`);
    }
    return index.makeSongKey(songPath);
  }

  const singleWaiter = MakeSingleWaiter(100);
  /*
   * Member functions
   */
  async function getPicture(key: MediaKey): Promise<Buffer | void> {
    if (isAlbumKey(key)) {
      const album = data.dbAlbums.get(key);
      if (album) {
        for (const songKey of album.songs) {
          const res = await getPicture(songKey);
          if (res instanceof Buffer) {
            return res;
          }
        }
      }
    } else if (isArtistKey(key)) {
      const artist = data.dbArtists.get(key);
      if (artist) {
        const res = await artistStore.get(artist);
        if (res instanceof Buffer) {
          return res;
        }
      }
    } else if (isSongKey(key)) {
      const idx = GetIndexForKey(key);
      const song = data.dbSongs.get(key);
      if (idx && song) {
        return idx.getImageForSong(song.path);
      }
    }
    // TODO: Return the default picture?
  }

  async function setPicture(key: MediaKey, buf: Buffer): Promise<void> {
    // TODO: This is *not* correct for non-Song keys.
    // Need more capabilities from AFI
    const afi = GetIndexForKey(key);
    if (afi) {
      if (isSongKey(key)) {
        await afi.setImageForSong(key, buf);
      } else if (isAlbumKey(key)) {
        const album = data.dbAlbums.get(key);
        if (album) {
          await Promise.all(
            album.songs.map((k) => afi.setImageForSong(k, buf)),
          );
        }
      } else if (isArtistKey(key)) {
        log('Saving artist...');
        const artist = data.dbArtists.get(key);
        log(artist);
        if (artist) {
          log(artist);
          await artistStore.put(buf, artist);
          // await artistStore.flush();
          /*  
          await Promise.all(
            artist.songs.map((k) => afi.setImageForSong(k, buf)),
          );
          */
        }
      } else {
        wrn('Unknown key type:', key);
      }
    } else {
      wrn(`Didn\'t get the AFI for ${key}`);
    }
  }

  function getOrNewArtist(name: string): Artist {
    const maybeKey: ArtistKey | undefined = data.artistNameIndex.get(
      normalizeName(name),
    );
    if (maybeKey) {
      const art = data.dbArtists.get(maybeKey);
      if (art) {
        return art;
      }
      wrn("DB inconsistency - artist key by name doesn't exist in key index");
      // Fall-through and just overwrite the artistNameIndex with a new key...
    }
    const key: ArtistKey = newArtistKey(name);
    data.artistNameIndex.set(normalizeName(name), key);
    const artist: Artist = { name, songs: [], albums: [], key };
    data.dbArtists.set(key, artist);
    return artist;
  }

  function getOrNewAlbum(
    title: string,
    year: number,
    artists: ArtistKey[],
    secondaryArtists: ArtistKey[],
    vatype: VAType,
    dirName: string,
    diskNum?: number,
    diskName?: string,
  ): Album {
    const sharedNames =
      data.albumTitleIndex.get(normalizeName(title)) || new Set<AlbumKey>();
    // sharedNames is the list of existing albums with this title
    // It might be empty (coming from a few lines up there ^^^ )
    for (const albumKey of sharedNames) {
      const alb: Album | undefined = data.dbAlbums.get(albumKey);
      if (!alb) {
        wrn(
          `DB inconsistency - album (key: ${albumKey}) by title doesn't exist in index`,
        );
        // We don't have an easy recovery from this particular inconsistency
        continue;
      }
      const check: Album = alb;
      if (NoArticlesNormalizedStringCompare(check.title, title) !== 0) {
        wrn(`DB inconsistency - album title index inconsistency`);
        continue;
      }
      if (check.year !== year) {
        continue;
      }
      // For VA type albums, we can ignore the artist list
      if (check.vatype === vatype && vatype.length > 0) {
        EnsureDiskNums(check, diskNum, diskName);
        return check;
      }
      // Set equality...
      if (!ArraySetEqual(check.primaryArtists, artists)) {
        // If the primaryArtists is different, but the files are in the same
        // location, override the VA type update the primaryArtists list and
        // return this one.
        const anotherSong = data.dbSongs.get(check.songs[0]);
        if (!anotherSong) {
          continue;
        }

        // TODO: This is an old comment that needs investigation:
        // This makes things mess up a bit, apparently:
        if (path.dirname(anotherSong.path) !== dirName) {
          continue;
        }

        // Check to see if there's a common subset of artists
        const commonArtists = ArrayIntersection(check.primaryArtists, artists);
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
              const sng = data.dbSongs.get(s);
              if (!sng) {
                wrn('Unable to find a referenced song');
                continue;
              }
              demoteArtists(sng.artistIds, sng.secondaryIds);
            }
          }
          EnsureDiskNums(check, diskNum, diskName);
          return check;
        }
        if (false) {
          wrn('Found a likely mismarked VA song:');
          wrn(check);
          wrn('For this directory:');
          wrn(dirName);
          wrn('Artists:');
          wrn(artists);
        }
        check.vatype = 'va';
        check.primaryArtists = [];
        EnsureDiskNums(check, diskNum, diskName);
        return check;
      }
      // If we're here, we've found the album we're looking for
      // Before returning, ensure that the artists have this album in their set
      for (const art of artists) {
        const thisArtist: Artist | undefined = data.dbArtists.get(art);
        if (!thisArtist) {
          continue;
        }
        const albums: Set<AlbumKey> = new Set(thisArtist.albums);
        if (albums.has(check.key)) {
          continue;
        }
        thisArtist.albums.push(check.key);
      }
      EnsureDiskNums(check, diskNum, diskName);
      return check;
    }
    // If we've reached this code, we need to create a new album
    // sharedNames is already the (potentially empty) array of albumKeys
    // for the given title, so we can just add it to that array
    const key: AlbumKey = newAlbumKey(
      title,
      vatype === '' ? artists.join('/') : vatype,
      year,
    );
    const album: Album = {
      year,
      primaryArtists: vatype === '' ? artists : [],
      title,
      vatype,
      songs: [],
      key,
    };
    data.albumTitleIndex.set(normalizeName(title), key);
    data.dbAlbums.set(key, album);
    EnsureDiskNums(album, diskNum, diskName);
    return album;
  }

  function addOrUpdateSong(md: FullMetadata) {
    // TODO: Make this remove an existing song if it conflicts, maybe?
    // We need to go from textual metadata to artist, album, and song keys
    // First, get the primary artist
    const tmpArtist: string | string[] = md.artist;
    const artists = typeof tmpArtist === 'string' ? [tmpArtist] : tmpArtist;
    const allArtists = artists.map((a) => getOrNewArtist(a));
    const artistIds: ArtistKey[] = allArtists.map((a) => a.key);
    const secondaryIds: ArtistKey[] = [];
    for (const sa of md.moreArtists || []) {
      const moreArt: Artist = getOrNewArtist(sa);
      allArtists.push(moreArt);
      secondaryIds.push(moreArt.key);
    }
    const album = getOrNewAlbum(
      md.album,
      md.year || 0,
      artistIds,
      secondaryIds,
      md.vaType || '',
      path.dirname(md.originalPath),
      md.disk,
      md.diskName,
    );
    const theSong: SongWithPath = {
      path: md.originalPath,
      artistIds,
      secondaryIds,
      albumId: album.key,
      track: md.track + (md.disk || 0) * 100,
      title: md.title,
      key: getSongKey(md.originalPath),
    };
    if (md.variations !== undefined) {
      theSong.variations = md.variations;
    }
    album.songs.push(theSong.key);
    allArtists.forEach((artist) => {
      artist.songs.push(theSong.key);
      if (artist.albums.indexOf(album.key) < 0) {
        artist.albums.push(album.key);
      }
    });
    data.dbSongs.set(theSong.key, theSong);
  }

  function delSongByKey(key: SongKey): boolean {
    // First, remove the song itself, then remove the reference to the artist
    // and album. If the artist & album are now "empty" remove them as well

    const theSong = data.dbSongs.get(key);
    if (theSong === undefined) {
      return false;
    }
    if (!data.dbSongs.delete(key)) {
      wrn(`Unabled to delete the song:${theSong.title}`);
      return false;
    }
    // Remove the song from the album
    const theAlbum = data.dbAlbums.get(theSong.albumId);
    if (theAlbum) {
      const theEntry = theAlbum.songs.indexOf(key);
      if (theEntry >= 0) {
        theAlbum.songs.splice(theEntry, 1);
        if (theAlbum.songs.length === 0) {
          // Delete the album (shouldn't need to remove artists?)
          if (!data.dbAlbums.delete(theAlbum.key)) {
            wrn(`Unable to delete the artist ${theAlbum.title}`);
          }
          // Delete the album from the name index
          const normAlbumTitle = normalizeName(theAlbum.title);
          const nameElem = data.albumTitleIndex.get(normAlbumTitle);
          if (nameElem === undefined) {
            wrn(`Unable to find ${theAlbum.title} in the title index`);
          } else {
            data.albumTitleIndex.remove(normAlbumTitle, theAlbum.key);
          }
        }
      } else {
        wrn(`Can't remove song ${theSong.title} from album ${theAlbum.title}`);
      }
    }
    const artists = new Set([...theSong.artistIds, ...theSong.secondaryIds]);
    for (const artistKey of artists) {
      const theArtist = data.dbArtists.get(artistKey);
      if (theArtist) {
        const theEntry = theArtist.songs.indexOf(key);
        if (theEntry >= 0) {
          theArtist.songs.splice(theEntry, 1);
          if (theArtist.songs.length === 0) {
            if (!data.dbArtists.delete(theArtist.key)) {
              wrn(`Unable to delete the artist ${theArtist.name}`);
            }
            // Remove the artist from the artist name index
            if (!data.artistNameIndex.delete(normalizeName(theArtist.name))) {
              wrn(
                `Unable to delete the artist ${theArtist.name} from name index`,
              );
            }
          } else {
            // Having removed the song, we still need to check all the
            // albums to see if there are songs on those albums that have this
            // artist. If not, remove the artist from those album lists
            for (const albKey of theArtist.albums) {
              const album = data.dbAlbums.get(albKey);
              if (!album) {
                // This must be the album that was already removed, yes?
                continue;
              }
              let removeFromAlbum = true;
              for (const k of album.songs) {
                const sng = data.dbSongs.get(k);
                if (!sng) {
                  wrn(`Unable to get song ${k} for album ${album.title}`);
                  continue;
                }
                if (
                  sng.artistIds.indexOf(artistKey) >= 0 ||
                  sng.secondaryIds.indexOf(artistKey) >= 0
                ) {
                  removeFromAlbum = false;
                  break;
                }
              }
              // We didn't find a song on this album with this artist
              // Go ahead and remove the artist from the album list
              if (removeFromAlbum) {
                const albIdx = album.primaryArtists.indexOf(theArtist.key);
                if (albIdx >= 0) {
                  album.primaryArtists.splice(albIdx, 1);
                }
              }
            }
          }
        } else {
          wrn(`Can't remove the song ${theSong.title} from ${theArtist.name}`);
        }
      } else {
        wrn(`Can't find artist ${artistKey} for song ${theSong.title}`);
      }
    }

    return true;
  }

  function delSongFromAfi(filepath: string, afi: AudioFileIndex): boolean {
    const key = afi.makeSongKey(filepath);
    // Now, let's see if we can find this song
    return data.dbSongs.has(key) ? delSongByKey(key) : false;
  }

  /*
  function delSongByPath(filepath: string): boolean {
    const afi = GetIndexForPath(filepath);
    if (!afi) {
      return false;
    }
    return delSongFromAfi(filepath, afi);
  }

  // Returns true if we should look inside the file for metadata
  async function addSongFromPath(filePath: string): Promise<boolean> {
    // First, figure out if this is from an index or not
    const afi = GetIndexForPath(filePath);
    if (!afi) {
      // TODO: Make a "everything else" index.
      return false;
    }
    return addSongToAfi(filePath, afi);
  }
  */

  // Returns true if we should look inside the file for metadata
  async function addSongToAfi(
    filePath: string,
    afi: AudioFileIndex,
  ): Promise<boolean> {
    const md = await afi.getMetadataForSong(filePath);
    if (!md) {
      return false;
    }
    // We *could* save this data to disk, but honestly,
    // I don't think it's going to be measurably faster,
    // and I'd rather not waste the space or deal with data in multiple
    // places are now out of sync issues
    addOrUpdateSong(md);
    return true;
  }

  async function addAudioFileIndex(idx: AudioFileIndex): Promise<boolean> {
    // Keep this thing around for future updating when the metadata
    // caching is moved into the file index
    // TODO: Rebuild the search index
    // TODO: Migrate metadata caching/overrides to the AFI, perhaps?
    const filePath = idx.getLocation();
    if (data.dbAudioIndices.get(filePath)) {
      return false;
    }
    data.dbAudioIndices.set(filePath, idx);
    await idx.forEachAudioFile(async (fp: string) => addSongToAfi(fp, idx));
    return true;
  }

  async function addFileLocation(filePath: string): Promise<boolean> {
    const thePath = path.trailingSlash(path.resolve(filePath));
    const afi = await MakeAudioFileIndex(
      thePath,
      h32(thePath, 0xdeadbeef).toNumber(),
      fullOpts as AudioFileIndexOptions,
    );
    return await addAudioFileIndex(afi);
  }

  async function removeFileLocation(filePath: string): Promise<boolean> {
    const thePath = path.trailingSlash(path.resolve(filePath));
    const theIdx = data.dbAudioIndices.get(thePath);
    if (!theIdx) {
      return false;
    }
    await theIdx.forEachAudioFile((fp) => delSongFromAfi(fp, theIdx));
    return data.dbAudioIndices.delete(thePath);
  }

  async function removeAudioFileIndex(idx: AudioFileIndex): Promise<boolean> {
    const filepath = idx.getLocation();
    return await removeFileLocation(filepath);
  }

  function getLocations(): string[] {
    return [...data.dbAudioIndices.keys()];
  }

  function rebuildIndex() {
    const songs = MakeSearchable(
      data.dbSongs.keys(),
      (key: SongKey) => data.dbSongs.get(key)?.title || '',
    );
    const albums = MakeSearchable(
      data.dbAlbums.keys(),
      (key: AlbumKey) => data.dbAlbums.get(key)?.title || '',
    );
    const artists = MakeSearchable(
      data.dbArtists.keys(),
      (key: ArtistKey) => data.dbArtists.get(key)?.name || '',
    );
    data.keywordIndex = { songs, artists, albums };
  }

  /**
   * @param  {boolean} substr - true for mid-word substring searches, false for
   * only 'starts with' search
   * @param  {string} term - The space-separated list of words to search for
   * @returns 3 arrays (songs, albums, artists) that have words that begin with
   * all of the search terms
   */
  function searchIndex(substr: boolean, terms: string): SearchResults {
    if (data.keywordIndex === null) {
      rebuildIndex();
    }
    if (data.keywordIndex === null) {
      throw Error('Bad news');
    }
    let first = true;
    let songs: Set<SongKey> = new Set();
    let albums: Set<AlbumKey> = new Set();
    let artists: Set<ArtistKey> = new Set();
    for (const t of terms.split(' ').map((s) => s.trim())) {
      if (t.length > 0) {
        const sng = data.keywordIndex.songs(t, substr);
        const alb = data.keywordIndex.albums(t, substr);
        const art = data.keywordIndex.artists(t, substr);
        songs = first ? new Set<string>(sng) : SetIntersection(songs, sng);
        albums = first ? new Set<string>(alb) : SetIntersection(albums, alb);
        artists = first ? new Set<string>(art) : SetIntersection(artists, art);
        first = false;
      }
    }
    log('songs:');
    log(songs);
    log('albums:');
    log(albums);
    log('artists:');
    log(artists);
    return {
      songs: [...songs],
      albums: [...albums],
      artists: [...artists],
    };
  }

  // Run a full rescan, dealing with new files/deletion of old files
  async function refresh(): Promise<boolean> {
    // TODO:
    // BUG: This only adds/removes stuff in existing AFI's. It's the wrong
    // thing to call when you've added or removed an entire AFI.
    if (await singleWaiter.wait()) {
      try {
        // TODO: Also handle adding/deleting/changing images?
        for (const afi of data.dbAudioIndices.values()) {
          await afi.rescanFiles(
            async (filePath: string) => await addSongToAfi(filePath, afi),
            (filePath: string) => delSongFromAfi(filePath, afi),
          );
        }
        // TODO: It should rebuild the keyword index
        log('Finished');
      } finally {
        singleWaiter.leave();
      }
      return true;
    } else {
      return false;
    }
  }

  function getFlatDatabase(): FlatAudioDatabase {
    return {
      songs: [...data.dbSongs.values()],
      artists: [...data.dbArtists.values()],
      albums: [...data.dbAlbums.values()],
    };
  }

  const isSongWithPath = chkBothOf(isSong, chkStrField('path'));
  const chkSongs = chkMapOf(isSongKey, isSongWithPath);
  const chkAlbums = chkMapOf(isAlbumKey, isAlbum);
  const chkArtists = chkMapOf(isArtistKey, isArtist);

  async function load(): Promise<boolean> {
    const stringVal = await persist.getItemAsync(persistenceIdName);
    const flattened = Unpickle(stringVal || '0');
    if (
      !flattened ||
      !hasField(flattened, 'dbSongs') ||
      !hasField(flattened, 'dbAlbums') ||
      !hasField(flattened, 'dbArtists') ||
      !hasField(flattened, 'albumTitleIndex') ||
      !hasField(flattened, 'artistNameIndex') ||
      !hasField(flattened, 'indices')
    ) {
      return false;
    }
    const songs = chkSongs(flattened.dbSongs) ? flattened.dbSongs : false;
    const albums = chkAlbums(flattened.dbAlbums) ? flattened.dbAlbums : false;
    const artists = chkArtists(flattened.dbArtists)
      ? flattened.dbArtists
      : false;
    const titleIndex = isMultiMapOf<string, AlbumKey>(
      flattened.albumTitleIndex,
      isString,
      isAlbumKey,
    )
      ? flattened.albumTitleIndex
      : false;
    const nameIndex = isMapOf<string, ArtistKey>(
      flattened.artistNameIndex,
      isString,
      isArtistKey,
    )
      ? flattened.artistNameIndex
      : false;
    const idx = isArrayOf<{ location: string; hash: string }>(
      flattened.indices,
      chkObjectOfType({ location: isString, hash: isString }),
    )
      ? flattened.indices
      : false;
    if (!songs || !albums || !artists || !titleIndex || !nameIndex || !idx) {
      wrn(`Invalid AFI loaded from ${persistenceIdName}`);
      return false;
    }
    const audioIndices = new Map(
      (
        await Promise.all(
          idx.map(({ location, hash }) =>
            MakeAudioFileIndex(
              location,
              hash,
              fullOpts as AudioFileIndexOptions,
            ),
          ),
        )
      ).map((afi): [string, AudioFileIndex] => [afi.getLocation(), afi]),
    );
    data.dbSongs = songs;
    data.dbArtists = artists;
    data.dbAlbums = albums;
    data.albumTitleIndex = titleIndex;
    data.artistNameIndex = nameIndex;
    data.dbAudioIndices = audioIndices;
    return true;
  }

  async function save(): Promise<void> {
    // I think this should just be handled automatically, instead of requiring
    // clients to remember to do this..
    await persist.setItemAsync(
      persistenceIdName,
      Pickle({
        dbSongs: data.dbSongs,
        dbAlbums: data.dbAlbums,
        dbArtists: data.dbArtists,
        albumTitleIndex: data.albumTitleIndex,
        artistNameIndex: data.artistNameIndex,
        indices: [...data.dbAudioIndices].map(([location, afi]) => ({
          location,
          hash: afi.getHashForIndex(),
        })),
      }),
    );
  }

  function ignoreWatchFilter(filepath: string): boolean {
    // Read the ignore info and check to see if this path should be ignored
    const pathroots = data.ignoreInfo.get('path-root');
    if (isDefined(pathroots)) {
      for (const pathroot of pathroots) {
        if (filepath.toLowerCase().startsWith(pathroot.toLowerCase())) {
          return false;
        }
      }
    }
    const dirnames = data.ignoreInfo.get('dir-name');
    if (isDefined(dirnames)) {
      const pieces = new Set<string>(
        filepath.split(/\/|\\/).map((str) => str.toLowerCase()),
      );
      if (SetIntersection(pieces, dirnames).size > 0) {
        return false;
      }
    }
    const pathkeywords = data.ignoreInfo.get('path-keyword');
    if (isDefined(pathkeywords)) {
      const lcase = filepath.toLowerCase();
      for (const pathkw of pathkeywords) {
        if (lcase.indexOf(pathkw) >= 0) {
          return false;
        }
      }
    }
    return true;
  }

  function updateMetadata(
    fullPath: string,
    newMetadata: Partial<FullMetadata>,
  ): boolean {
    // Update this to delete the old song and add the new one...
    const indexForPath = GetIndexForPath(fullPath);
    if (!indexForPath) {
      return false;
    }
    indexForPath.updateMetadata({ ...newMetadata, originalPath: fullPath });
    return true;
  }

  async function getMetadata(
    fullPathOrKey: string,
  ): Promise<FullMetadata | void> {
    const isPath = fullPathOrKey.indexOf('/') >= 0;
    const afi = isPath
      ? GetIndexForPath(fullPathOrKey)
      : GetIndexForKey(fullPathOrKey);
    if (!afi) {
      // TODO: Make a "everything else" index?
      return;
    }
    const key = isPath ? afi.makeSongKey(fullPathOrKey) : fullPathOrKey;
    const song = data.dbSongs.get(key);
    if (!song) {
      return;
    }
    return await afi.getMetadataForSong(song.path);
  }

  function artistString(artistIds: ArtistKey[]): string {
    if (artistIds.length === 0) {
      return '';
    }
    const artists: string[] = artistIds
      .map((ak: ArtistKey) => {
        const art = data.dbArtists.get(ak);
        return art ? art.name : '';
      })
      .filter((a: string) => a.length > 0);
    if (artists.length === 1) {
      return artists[0];
    } else {
      const lastPart = ' & ' + (artists.pop() || 'OOPS!');
      return artists.join(', ') + lastPart;
    }
  }

  function getDiskPiece(album: Album, song: SongWithPath): string {
    if (song.track < 99) {
      return '/';
    }
    const diskNum = Math.round(song.track / 100);
    if (
      album.diskNames &&
      album.diskNames.length >= diskNum &&
      album.diskNames[diskNum - 1].length > 0
    ) {
      return `/Disk ${diskNum}- ${album.diskNames[diskNum - 1]}/`;
    }
    return `/Disk ${diskNum}/`;
  }

  function trackStr(track: number): string {
    const num = track % 100;
    if (num < 10) {
      return '0' + num.toString();
    }
    return num.toString();
  }

  function getCanonicalFileName(file: SongKey): string | undefined {
    // The source type is a playlist/album/artist
    // The output format is just the metadata-based name
    const song = data.dbSongs.get(file);
    if (!song) {
      return;
    }
    const album = data.dbAlbums.get(song.albumId);
    if (!album) {
      return;
    }
    const priArt = artistString(song.artistIds);
    const secArt = artistString(song.secondaryIds);
    const first =
      album.vatype.length > 0
        ? album.vatype === 'ost'
          ? 'Soundtrack'
          : 'VA'
        : priArt;
    const second =
      album.year > 0 ? `${album.year} - ${album.title}` : album.title;
    const middle = getDiskPiece(album, song);
    const mixes = song.variations
      ? song.variations.map((str) => `[${str}]`).join('')
      : '';
    const withs = secArt.length > 0 ? `[w- ${secArt}]` : '';
    const last = `${trackStr(song.track)} - ${
      album.vatype.length > 0 ? `${priArt} - ` : ''
    }${song.title}${
      withs.length + mixes.length > 0 ? ' ' : ''
    }${mixes}${withs}`;
    const sfx = path.extname(song.path);
    return `${first} - ${second}${middle}${last}${sfx}`;
  }

  /*
   *
   * Begin 'constructor' code here
   *
   */
  await load();

  return {
    // Basic queries:
    getSong: (key: SongKey) => data.dbSongs.get(key),
    getArtist: (key: ArtistKey) => data.dbArtists.get(key),
    getAlbum: (key: AlbumKey) => data.dbAlbums.get(key),
    getSongFromPath: getSongKey,
    searchIndex,

    // Song storage location management
    addAudioFileIndex,
    addFileLocation,
    removeAudioFileIndex,
    removeFileLocation,
    getLocations,

    // Pictures
    getArtistPicture: getPicture,
    setArtistPicture: setPicture,
    getAlbumPicture: getPicture,
    setAlbumPicture: setPicture,
    getSongPicture: getPicture,
    setSongPicture: setPicture,

    // Ignore stuff
    addIgnoreItem,
    removeIgnoreItem,

    // addSongFromPath,
    // addOrUpdateSong,
    // delSongByPath,
    // delSongByKey,

    getFlatDatabase,

    load,
    save,
    refresh,

    getMetadata,
    updateMetadata,
    getCanonicalFileName,
  };
}
