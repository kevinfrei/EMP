// @flow

const fsp = require('fs').promises;
const path = require('path');
const logger = require('simplelogger');

const log = logger.bind('music');
logger.disable('music');

export type SongKey = string;
export type AlbumKey = string;
export type ArtistKey = string;

export type Song = {
  URL: string,
  artistIds: Array<ArtistKey>,
  secondaryIds: Array<AlbumKey>,
  albumId: number,
  track: number,
  title: string,
  key: SongKey
};

export type Album = {
  year: number,
  primaryArtists: Array<ArtistKey>,
  title: string,
  vatype: '' | 'ost' | 'va',
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
  artistNameIndex: Map<string, Array<ArtistKey>>,
  playlists: Map<string, Array<SongKey>> // This is probably a bad idea...
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
      log(`Failed suffix: ${suffix}`);
      return false;
  }
};

const findMusic = async (locations: Array<string>): Promise<MusicDB> => {
  // If we have too many locations, this is *baaaad* but oh well...
  const queue: Array<string> = locations;
  const songs: Array<string> = [];
  log('Queue:');
  log(queue);
  while (queue.length > 0) {
    const i = queue.pop();
    log(i);
    const dirents = await fsp.readdir(i, { withFileTypes: true });
    for (let dirent of dirents) {
      if (dirent.isSymbolicLink()) {
        const ap = await fsp.realpath(path.join(i, dirent.name));
        const st = await fsp.stat(ap);
        if (st.isDirectory()) {
          queue.push(ap);
        } else if (st.isFile() && isMusicType(ap)) {
          songs.push(ap);
        }
      } else if (dirent.isDirectory()) {
        queue.push(path.join(i, dirent.name));
      } else if (dirent.isFile() && isMusicType(dirent.name)) {
        songs.push(path.join(i, dirent.name));
      }
    }
  }
  // TODO: Fill this in correctly
  return {
    songs,
    albums: [],
    albumTitleIndex: new Map(),
    artists: [],
    artistNameIndex: new Map(),
    playlists: []
  };
};

module.exports.find = findMusic;
