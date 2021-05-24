import {
  MakeError,
  MakeLogger,
  Operations,
  Pickle,
  SeqNum,
  Type,
  Unpickle,
} from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  FullMetadata,
  SimpleMetadata,
  SongKey,
} from '@freik/media-core';
import { Metadata } from '@freik/media-utils';
import electronIsDev from 'electron-is-dev';
import { promises as fsp } from 'fs';
import path from 'path';
import { AudioFileIndex } from './AudioFileIndex';
import { asyncSend } from './Communication';
import { GetMetadataStore, isFullMetadata } from './metadata';
import {
  noArticlesCmp,
  normalizeName,
  ServerSong,
  setIntersection,
  VAType,
} from './MusicScanner';
import { Persistence } from './persist';

// eslint-disable-next-line
const log = MakeLogger('AudioDatabase', false && electronIsDev);
const err = MakeError('AudioDatabase-err');

export type AudioDatabase = {
  addAudioFileIndex: (idx: AudioFileIndex) => Promise<void>;
  getPicture: (key: AlbumKey) => string;
  addSongFromPath: (filepath: string) => void;
  addOrUpdateSong: (md: FullMetadata) => void;
  delSongFromPath: (filepath: string) => boolean;
  delSongFromKey: (key: SongKey) => boolean;
  sendUpdate: () => void;
  load: () => void;
  save: () => void;
  refresh: () => void;
};

let existingKeys: Map<string, SongKey> | null = null;
const newSongKey = (() => {
  const highestSongKey = Persistence.getItem('highestSongKey');
  if (highestSongKey) {
    log(`highestSongKey: ${highestSongKey}`);
    return SeqNum('S', highestSongKey);
  } else {
    log('no highest song key found');
    return SeqNum('S');
  }
})();
function getSongKey(songPath: string) {
  if (existingKeys) {
    return existingKeys.get(songPath) || newSongKey();
  } else {
    return newSongKey();
  }
}
const newAlbumKey = SeqNum('L');
const newArtistKey = SeqNum('R');

export async function MakeAudioDatabase(): Promise<AudioDatabase> {
  /*
   * Private member data
   */
  const dbAudioIndices: AudioFileIndex[] = [];
  const dbSongs = new Map<SongKey, ServerSong>();
  const dbAlbums = new Map<AlbumKey, Album>();
  const dbArtists = new Map<ArtistKey, Artist>();
  const dbPictures = new Map<ArtistKey, string>();
  const albumTitleIndex = new Map<string, AlbumKey[]>();
  const artistNameIndex = new Map<string, ArtistKey>();
  const metadataCache = await GetMetadataStore('metadataCache');
  const metadataOverride = await GetMetadataStore('metadataOverride');
  // If the key in this cache is an empty string, the song wasn't added
  const fileNamesSeen = new Map<string, SongKey>();

  /*
   * Member functions
   */
  function getPicture(key: AlbumKey): string {
    const p = dbPictures.get(key);
    if (p) {
      return p;
    }
    return '*TODO: Default Picture Path*';
  }

  function getOrNewArtist(name: string): Artist {
    const maybeKey: ArtistKey | undefined = artistNameIndex.get(
      normalizeName(name),
    );
    if (maybeKey) {
      const art = dbArtists.get(maybeKey);
      if (art) {
        return art;
      }
      err("DB inconsistency - artist key by name doesn't exist in key index");
      // Fall-through and just overwrite the artistNameIndex with a new key...
    }
    const key: ArtistKey = newArtistKey();
    artistNameIndex.set(normalizeName(name), key);
    const artist: Artist = { name, songs: [], albums: [], key };
    dbArtists.set(key, artist);
    return artist;
  }

  function getOrNewAlbum(
    title: string,
    year: number,
    artists: ArtistKey[],
    secondaryArtists: ArtistKey[],
    vatype: VAType,
    dirName: string,
  ): Album {
    const maybeSharedNames = albumTitleIndex.get(normalizeName(title));
    let sharedNames: AlbumKey[];
    if (!maybeSharedNames) {
      sharedNames = [];
      albumTitleIndex.set(normalizeName(title), sharedNames);
    } else {
      sharedNames = maybeSharedNames;
    }
    // sharedNames is the list of existing albums with this title
    // It might be empty (coming from a few lines up there ^^^ )
    for (const albumKey of sharedNames) {
      const alb: Album | undefined = dbAlbums.get(albumKey);
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
      if (!Operations.ArraySetEqual(check.primaryArtists, artists)) {
        // If the primaryArtists is different, but the files are in the same
        // location, override the VA type update the primaryArtists list and
        // return this one.
        const anotherSong = dbSongs.get(check.songs[0]);
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
              const sng = dbSongs.get(s);
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
        const thisArtist: Artist | undefined = dbArtists.get(art);
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
    dbAlbums.set(key, album);
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
    );
    const theSong: ServerSong = {
      path: md.originalPath,
      artistIds,
      secondaryIds,
      albumId: album.key,
      track: md.track + (md.disk || 0) * 100,
      title: md.title,
      key: getSongKey(md.originalPath),
      variations: md.variations,
    };
    album.songs.push(theSong.key);
    allArtists.forEach((artist) => artist.songs.push(theSong.key));
    dbSongs.set(theSong.key, theSong);
    // Set this thing as appropriately "observed"
    fileNamesSeen.set(theSong.path, theSong.key);
  }

  function delSongFromKey(key: SongKey): boolean {
    // TODO: Make this work
    return false;
  }

  function delSongFromPath(filepath: string): boolean {
    // First, remove it froom the fileNamesSeen set
    const key = fileNamesSeen.get(filepath);
    if (!Type.isString(key)) {
      return false;
    }
    // If we have an 'empty' key, then the song doesn't exist in the DB, but
    // we saw it, so let's remove it from that set and be done
    if (key === '') {
      fileNamesSeen.delete(filepath);
      return true;
    }

    // Now, let's see if we can find this song
    // TODO: Make this work

    return false;
  }

  // Returns true if we should look inside the file for metadata
  function addSongFromPath(file: string): boolean {
    // This handles the situation of adding /foo and the /foo/bar
    // as file locations
    if (fileNamesSeen.has(file)) {
      return false;
    }
    // Flag the file as having been seen
    fileNamesSeen.set(file, '');

    // If we've previously failed doing anything with this file, don't keep
    // banging our head against a wall
    if (!metadataCache.shouldTry(file)) {
      return false;
    }
    // Cached data overrides file path acquired metadata
    const mdOverride = metadataOverride.get(file);
    const littlemd: SimpleMetadata | void = Metadata.FromPath(file);
    if (!littlemd) {
      log('Unable to get metadata from file ' + file);
      return true;
    }
    const fullMd = Metadata.FullFromObj(file, littlemd);
    const md = { ...fullMd, ...mdOverride };

    if (!isFullMetadata(md)) {
      log('Unable to get full metadata from file ' + file);
      return true;
    }

    // We *could* save this data to disk, but honestly,
    // I don't think it's going to be measurably faster,
    // and I'd rather not waste the space
    addOrUpdateSong(md);
    return false;
  }

  async function handleAlbumCovers(idx: AudioFileIndex) {
    // Get all pictures from each directory.
    // Find the biggest and make it the album picture for any albums in that dir
    const dirsToPics = new Map<string, Set<string>>();
    idx.forEachImageFile((p) => {
      const dirName = path.dirname(p);
      const val = dirsToPics.get(dirName);
      if (val) {
        val.add(p);
      } else {
        dirsToPics.set(dirName, new Set([p]));
      }
    });
    const dirsToAlbums = new Map<string, Set<Album>>();
    for (const a of dbAlbums.values()) {
      for (const s of a.songs) {
        const theSong = dbSongs.get(s);
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
        dbPictures.set(album.key, largest.name);
      }
    }
    // Metadata-hosted album covers are only acquired "on demand"
  }

  async function addAudioFileIndex(idx: AudioFileIndex): Promise<void> {
    // Keep this thing around for future updating when the metadata
    // caching is moved into the file index
    dbAudioIndices.push(idx);
    const tryHarder: string[] = [];
    idx.forEachAudioFile((pathName: string) => {
      if (addSongFromPath(pathName)) {
        tryHarder.push(pathName);
      }
    });
    for (const file of tryHarder) {
      let maybeMetadata = null;
      try {
        maybeMetadata = await Metadata.FromFileAsync(file);
      } catch (e) {
        err(`Failed acquiring metadata from ${file}:`);
        err(e);
      }
      if (!maybeMetadata) {
        log(`Complete metadata failure for ${file}`);
        metadataCache.fail(file);
        continue;
      }
      const fullMd = Metadata.FullFromObj(file, maybeMetadata);
      if (!fullMd) {
        log(`Partial metadata failure for ${file}`);
        metadataCache.fail(file);
        continue;
      }
      const mdOverride = metadataOverride.get(file);
      const md = { ...fullMd, ...mdOverride };
      metadataCache.set(file, md);
      addOrUpdateSong(md);
    }

    await handleAlbumCovers(idx);

    // Save
    await metadataCache.save();
    await Persistence.setItemAsync(
      'songHashIndex',
      Pickle(new Map([...dbSongs.values()].map((val) => [val.path, val.key]))),
    );
    await Persistence.setItemAsync('highestSongKey', newSongKey());
  }

  /*
   *
   * Begin 'constructor' code here
   *
   */

  // Get the list of existing paths to song-keys
  const songHash = Unpickle(
    (await Persistence.getItemAsync('songHashIndex')) || '',
  );
  existingKeys = Type.isMapOfStrings(songHash)
    ? songHash
    : new Map<string, SongKey>();

  return {
    addAudioFileIndex,
    getPicture,
    addSongFromPath,
    addOrUpdateSong,
    delSongFromPath,
    delSongFromKey,
    sendUpdate: () => {
      asyncSend({
        musicDatabase: { songs: dbSongs, artists: dbArtists, albums: dbAlbums },
      });
    },
    load: () => {
      // TODO: Load contents from persistence instead of scanning
      /*
      const dbSongs = new Map<SongKey, ServerSong>();
      const dbAlbums = new Map<AlbumKey, Album>();
      const dbArtists = new Map<ArtistKey, Artist>();
      const dbPictures = new Map<ArtistKey, string>();
      const albumTitleIndex = new Map<string, AlbumKey[]>();
      const artistNameIndex = new Map<string, ArtistKey>();
      */
    },
    save: () => {
      // TODO: Save contents to persistence (if changed?)
      // I think this should just be handled automatically, instead of requiring
      // clients to remember to do this..
    },
    refresh: () => {
      // TODO: Trigger a database refresh in the background
    },
  };
}
