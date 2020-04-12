// @flow

const fsp = require('fs').promises;
const path = require('path');
const logger = require('simplelogger');
const metadata = require('media-utils').Metadata;
const log = logger.bind('music');
//logger.enable('music');

import type { FullMetadata } from 'media-utils';

export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;

export type Song = {
  URL: string,
  artistIds: Array<ArtistKey>,
  secondaryIds: Array<ArtistKey>,
  albumId: AlbumKey,
  track: number,
  title: string,
  key: SongKey
};

export type VAType = '' | 'ost' | 'va';

export type Album = {
  year: number,
  primaryArtists: Set<ArtistKey>,
  title: string,
  vatype: VAType,
  songs: Array<SongKey>,
  key: AlbumKey
};

export type Artist = {
  name: string,
  songs: Array<SongKey>,
  albums: Array<AlbumKey>,
  key: ArtistKey
};

export type MusicDB = {
  songs: Map<SongKey, Song>,
  albums: Map<AlbumKey, Album>,
  albumTitleIndex: Map<string, Array<AlbumKey>>,
  artists: Map<ArtistKey, Artist>,
  artistNameIndex: Map<string, ArtistKey>,
  playlists: Map<string, Array<SongKey>> // This is probably a bad idea...
};

let songKey = 0;
const newSongKey = (): SongKey => {
  songKey++;
  return 'S' + songKey.toString(36);
};

let albumKey = 0;
const newAlbumKey = (): AlbumKey => {
  albumKey++;
  return 'L' + albumKey.toString(36);
};

let artistKey = 0;
const newArtistKey = (): AlbumKey => {
  artistKey++;
  return 'R' + artistKey.toString(36);
};

const getOrNewArtist = (db: MusicDB, name: string): Artist => {
  const maybeKey: ?ArtistKey = db.artistNameIndex.get(name.toLowerCase());
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
};

const getOrNewAlbum = (
  db: MusicDB,
  title: string,
  year: number,
  artists: Set<ArtistKey>,
  vatype: VAType
): Album => {
  // TODO: This doesn't currently handle vatypes properly :/
  const maybeSharedNames: ?Array<AlbumKey> = db.albumTitleIndex.get(
    title.toLowerCase()
  );
  let sharedNames: Array<AlbumKey>;
  if (!maybeSharedNames) {
    sharedNames = [];
    db.albumTitleIndex.set(title.toLowerCase(), sharedNames);
  } else {
    sharedNames = maybeSharedNames;
  }
  // sharedNames is the list of existing albums with this title
  // It might be empty (coming from 5 lines up there ^^^ )
  for (let albumKey of sharedNames) {
    const alb: ?Album = db.albums.get(albumKey);
    if (!alb) {
      log(
        `DB inconsistency - album (key: ${albumKey}) by title doesn't exist in index`
      );
      // We don't have an easy recovery from this particular inconsistency
      continue;
    }
    const check: Album = alb;
    if (check.title.toLowerCase() !== title.toLowerCase()) {
      log(`DB inconsistency - album title index inconsistency`);
      continue;
    }
    if (check.year !== year || check.vatype != vatype) {
      continue;
    }
    // Set equality...
    if (check.primaryArtists.size != artists.size) {
      continue;
    }
    let same: boolean = true;
    for (let i /*:ArtistKey*/ of check.primaryArtists) {
      if (!artists.has(i)) {
        same = false;
        break;
      }
    }
    if (!same) {
      continue;
    }
    // If we're here, we've found the album we're looking for
    // Before returning, ensure that the artists have this album in their set
    for (let art of artists) {
      const thisArtist: ?Artist = db.artists.get(art);
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
    key
  };
  sharedNames.push(key);
  db.albums.set(key, album);
  return album;
};

const AddSongToDatabase = (md: FullMetadata, db: MusicDB) => {
  // We need to go from textual metadata to artist, album, and song keys
  // First, get the primary artist
  // TODO: FullMetaData doesn't allow for multiple primary artists
  // Check Trent Reznor & Atticus Ross for an example where it kinda matters
  const artist: Artist = getOrNewArtist(db, md.Artist);
  const artistSet: Set<ArtistKey> = new Set();
  const allArtists: Array<Artist> = [artist];
  artistSet.add(artist.key);
  const album = getOrNewAlbum(
    db,
    md.Album,
    md.Year || 0,
    artistSet,
    md.VAType || ''
  );
  const artistIds: Array<ArtistKey> = [artist.key];
  const secondaryIds: Array<ArtistKey> = [];
  if (md.MoreArtists) {
    for (let sa of md.MoreArtists) {
      const moreArt: Artist = getOrNewArtist(db, sa);
      allArtists.push(moreArt);
      secondaryIds.push(moreArt.key);
    }
  }
  const theSong: Song = {
    URL: `file://${md.OriginalPath}`,
    artistIds,
    secondaryIds,
    albumId: album.key,
    track: md.Track,
    title: md.Title,
    key: newSongKey()
  };
  album.songs.push(theSong.key);
  allArtists.forEach((artist) => artist.songs.push(theSong.key));
  db.songs.set(theSong.key, theSong);
};

const fileNamesToDatabase = (files: Array<string>): MusicDB => {
  const songs: Map<SongKey, Song> = new Map();
  const albums: Map<AlbumKey, Album> = new Map();
  const artists: Map<ArtistKey, Artist> = new Map();
  const playlists: Map<string, Array<SongKey>> = new Map();
  const albumTitleIndex: Map<string, Array<AlbumKey>> = new Map();
  const artistNameIndex: Map<string, ArtistKey> = new Map();
  const db: MusicDB = {
    songs,
    albums,
    albumTitleIndex,
    artists,
    artistNameIndex,
    playlists
  };

  for (let file of files) {
    const littlemd: ?Object = metadata.fromPath(file);
    if (!littlemd) {
      log('Unable to get metadata from file ' + file);
      continue;
    }
    const md: ?FullMetadata = metadata.FullFromObj(file, littlemd);
    if (!md) {
      log('Unable to get full metadata from file ' + file);
      continue;
    }
    AddSongToDatabase(md, db);
  }
  return db;
};

const isMusicType = (filename: string): boolean => {
  if (path.basename(filename).startsWith('.')) {
    return false;
  }
  const suffix = path.extname(filename);
  switch (suffix.toLowerCase()) {
    case '.flac':
    case '.mp3':
    case '.m4a':
    case '.aac':
      return true;
    default:
      return false;
  }
};

const findMusic = async (locations: Array<string>): Promise<MusicDB> => {
  // If we have too many locations, this is *baaaad* but oh well...
  const queue: Array<string> = locations;
  const songsList: Array<string> = [];
  log('Queue:');
  log(queue);
  while (queue.length > 0) {
    const i = queue.pop();
    log(i);
    let dirents;
    try {
      dirents = await fsp.readdir(i, { withFileTypes: true });
    } catch (e) {
      log(`Unable to read ${i}`);
      continue;
    }
    for (let dirent of dirents) {
      try {
        if (dirent.isSymbolicLink()) {
          const ap = await fsp.realpath(path.join(i, dirent.name));
          const st = await fsp.stat(ap);
          if (st.isDirectory()) {
            queue.push(ap);
          } else if (st.isFile() && isMusicType(ap)) {
            songsList.push(ap);
          }
        } else if (dirent.isDirectory()) {
          queue.push(path.join(i, dirent.name));
        } else if (dirent.isFile() && isMusicType(dirent.name)) {
          songsList.push(path.join(i, dirent.name));
        }
        // TODO: Maybe look for album cover art, too
      } catch (e) {
        log(`Unable to process ${dirent}`);
        continue;
      }
    }
  }
  return fileNamesToDatabase(songsList);
};

module.exports.find = findMusic;
