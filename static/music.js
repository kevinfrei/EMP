// @flow

const fsp = require('fs').promises;
const path = require('path');

export type Song = {
  URL: string,
  artistIds: Array<number>,
  secondaryIds: Array<number>,
  albumId: number,
  track: number,
  title: string
};

export type Album = {
  year: number,
  primaryArtists: Array<number>,
  title: string,
  vatype: '' | 'ost' | 'va',
  songs: Array<number>
};

export type Artist = {
  name: string,
  songs: Array<number>,
  albums: Array<number>
};

export type MusicDB = {
  songs: Array<Song>,
  albums: Array<Album>,
  albumTitleIndex: Map<string, Array<number>>,
  artists: Array<Artist>,
  artistNameIndex: Map<string, Array<number>>,
  playlists: Array<number> // This is probably a bad idea...
};

const findMusic = async (locations: Array<string>): Promise<MusicDB> => {
  // If we have too many locations, this is *baaaad* but oh well...
  const queue: Array<string> = [...locations];
  const songs: Array<string> = [];
  console.log('Queue:');
  console.log(queue);
  while (queue.length > 0) {
    const i = queue.pop();
    console.log(i);
    const dirents = await fsp.readdir(i, { withFileTypes: true });
    for (let dirent of dirents) {
      if (dirent.isSymbolicLink()) {
        const ap = await fsp.realpath(path.join(i, dirent.name));
        const st = await fsp.stat(ap);
        if (st.isDirectory()) {
          queue.push(ap);
        } else if (st.isFile()) {
          songs.push(ap);
        }
      } else if (dirent.isDirectory()) {
        queue.push(path.join(i, dirent.name));
      } else if (dirent.isFile()) {
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
