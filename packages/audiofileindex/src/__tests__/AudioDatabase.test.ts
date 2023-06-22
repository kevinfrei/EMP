import { ArrayIntersection } from '@freik/helpers';
import { Album, Artist } from '@freik/media-core';
import { FileUtil, MakePersistence } from '@freik/node-utils';
import { isArrayOfString } from '@freik/typechk';
import { MakeAudioDatabase } from '../AudioDatabase';
import { MakeAudioFileIndex } from '../AudioFileIndex';
import { remove, removeDir } from './tst-helpers';

jest.useFakeTimers();
jest.setTimeout(3000000);

const persist = MakePersistence('./src/__tests__/persist-basic/');

async function cleanup() {
  await remove('./src/__tests__/persist-basic/test.json');
  await remove(
    './src/__tests__/NotActuallyFiles/Yello - 1985 - Stella/01 - Test.flac',
  );
  await removeDir('./src/__tests__/NotActuallyFiles/.afi');
  await removeDir('./src/__tests__/persist-basic');
}

// Initialization if we need anything
beforeAll(cleanup);

afterAll(async () => {
  // await new Promise(process.nextTick);
  await cleanup();
});

it('Query a reasonably sized database', async () => {
  const db = await MakeAudioDatabase(persist);
  expect(db).toBeDefined();
  const afi = await MakeAudioFileIndex('./src/__tests__/NotActuallyFiles', 0);
  expect(afi).toBeDefined();
  await db.addAudioFileIndex(afi);
  await db.refresh();
  const flat = db.getFlatDatabase();

  // Some basic stupidity:
  expect(flat.songs.length).toEqual(742);
  expect(flat.albums.length).toEqual(189);
  expect(flat.artists.length).toEqual(273);

  // More basic stupidity:
  for (const song of flat.songs) {
    expect(db.getSong(song.key)).toEqual(song);
  }

  // Look for a particular album for picture checking
  let negot: Album | undefined = undefined;
  for (const album of flat.albums) {
    expect(db.getAlbum(album.key)).toEqual(album);
    const ttl = album.title.toLocaleLowerCase();
    if (ttl === "'71-'86 negotiations & love songs") {
      negot = album;
    }
  }
  expect(negot).toBeDefined();
  if (!negot) throw Error('bad news');
  const pic = await db.getAlbumPicture(negot.key);
  expect(pic).toBeDefined();
  expect(pic).toBeInstanceOf(Buffer);
  if (!pic) throw Error('Not Buffer');
  expect(pic.length).toEqual(19);

  // let's find an artist, while we're at it
  let paulSimon: Artist | undefined = undefined;
  for (const artist of flat.artists) {
    expect(db.getArtist(artist.key)).toEqual(artist);
    if (artist.name.toLocaleLowerCase() === 'paul simon') {
      paulSimon = artist;
    }
  }
  expect(paulSimon).toBeDefined();
  expect(paulSimon!.albums.length).toEqual(3);
  expect(paulSimon!.songs.length).toEqual(5);

  // Now let's do some 'internal consistency' checking
  // Check for song back-pointers
  for (const song of flat.songs) {
    // We can get at the album
    const album: Album | void = db.getAlbum(song.albumId);
    expect(album).toBeDefined();
    if (!album) continue;
    // The album has this song
    expect(album.songs.indexOf(song.key)).toBeGreaterThan(-1);
    for (const artistKey of [...song.artistIds, ...song.secondaryIds]) {
      // We can get to each artist
      const artist = db.getArtist(artistKey);
      expect(artist).toBeDefined();
      if (!artist) continue;
      // The artist has this song, too
      expect(artist.songs.indexOf(song.key)).toBeGreaterThan(-1);
    }
  }
  let unsorted: Album | null = null;
  let axemas: Album | null = null;
  let various: Album[] = [];
  // Check for album back-pointers
  for (const album of flat.albums) {
    // Artist sanity checks
    if (album.vatype) {
      expect(album.primaryArtists.length).toEqual(0);
      // Let's check for a couple albums with multiple disks
      if (album.title === 'Unsorted' && unsorted === null) {
        unsorted = album;
      } else if (album.title === 'Merry Axemas' && axemas === null) {
        axemas = album;
      }
    } else {
      if (album.title === 'Various') {
        various.push(album);
      }
      for (const artistKey of album.primaryArtists) {
        const artist = db.getArtist(artistKey);
        expect(artist).toBeDefined();
        if (!artist) continue;
        // The artist has this album
        expect(artist.albums.indexOf(album.key)).toBeGreaterThan(-1);
      }
    }
    for (const songKey of album.songs) {
      const song = db.getSong(songKey);
      expect(song).toBeDefined();
      if (!song) continue;
      // The song is on this album
      expect(song.albumId).toEqual(album.key);
    }
  }
  // And finally, artist back-pointers
  for (const artist of flat.artists) {
    for (const songKey of artist.songs) {
      const song = db.getSong(songKey);
      expect(song).toBeDefined();
      if (!song) continue;
      const pri = song.artistIds.indexOf(artist.key);
      const alt = song.secondaryIds.indexOf(artist.key);
      // One of them should be negative
      expect(pri * alt).toBeLessThanOrEqual(0);
      // And one should be positive (or zero)
      expect(pri > alt || alt > pri).toBeTruthy();
    }
    for (const albumKey of artist.albums) {
      const album = db.getAlbum(albumKey);
      expect(album).toBeDefined();
      if (!album) continue;
      const idx = album.primaryArtists.indexOf(artist.key);
      if (idx < 0) {
        // If we didn't find this artist as a primary artist
        // Check to see if one of the songs has the artist
        const songsInCommon = ArrayIntersection(artist.songs, album.songs);
        expect(songsInCommon.size).toBeGreaterThan(0);
      }
    }
  }
  expect(await db.refresh()).toBeTruthy();
  const newFlat = db.getFlatDatabase();
  expect(newFlat).toEqual(flat);
  // A bunch of diskName checks:
  expect(unsorted).toBeDefined();
  if (!unsorted) throw Error('nope');
  expect(unsorted.diskNames).toBeDefined();
  if (!unsorted.diskNames) throw Error('nope');
  expect(unsorted.diskNames.length).toEqual(2);
  expect(unsorted.diskNames[0]).toEqual('Some Stuff');
  expect(unsorted.diskNames[1]).toEqual('Other Stuff');
  expect(axemas).toBeDefined();
  if (!axemas) throw Error('nope');
  expect(axemas.diskNames).toBeDefined();
  if (!axemas.diskNames) throw Error('nope');
  expect(axemas.diskNames.length).toEqual(2);
  expect(axemas.diskNames).toEqual(['', '']);
  expect(various.length).toEqual(3);
  const va = various.filter((alb) => isArrayOfString(alb.diskNames));
  expect(va.length).toEqual(1);
  const alb = va[0];
  expect(alb.diskNames).toBeDefined();
  if (!alb.diskNames) throw Error('nope');
  expect(alb.diskNames).toEqual(['', 'moar']);
  let disk0 = 0;
  let disk2 = 0;
  for (const sngKey of alb.songs) {
    const sng = db.getSong(sngKey);
    expect(sng).toBeDefined();
    if (!sng) throw Error('nope');
    // Only 0-99 or 200+, no 100's
    const disk = Math.floor(sng.track / 100);
    expect(disk).not.toEqual(1);
    if (disk === 0) disk0++;
    else if (disk === 2) disk2++;
    else expect(disk).toEqual(-1234);
  }
  expect(disk0).toEqual(9);
  expect(disk2).toEqual(7);
});

it('Rebuilding a DB after initial creation', async () => {
  await Promise.resolve(process.nextTick);
  const db = await MakeAudioDatabase(persist);
  expect(db).toBeDefined();
  expect(
    await db.addFileLocation('./src/__tests__/NotActuallyFiles'),
  ).toBeTruthy();
  expect(await db.refresh()).toBeTruthy();
  const flat = db.getFlatDatabase();
  expect(flat).toBeDefined();
  expect(flat.songs.length).toEqual(742);
  expect(await db.refresh()).toBeTruthy();
  const newFlat = db.getFlatDatabase();
  expect(newFlat.songs.length).toEqual(742);
  expect(
    await db.removeFileLocation('./src/__tests__/NotActuallyFiles'),
  ).toBeTruthy();
  const emptyFlat = db.getFlatDatabase();
  expect(emptyFlat).toEqual({ songs: [], albums: [], artists: [] });
  expect(
    await db.addFileLocation('./src/__tests__/NotActuallyFiles'),
  ).toBeTruthy();
  expect(await db.refresh()).toBeTruthy();
  const anotherFlat = db.getFlatDatabase();
  expect(anotherFlat).toBeDefined();
  expect(anotherFlat.songs.length).toEqual(742);
  await FileUtil.arrayToTextFileAsync(
    ['-'],
    './src/__tests__/NotActuallyFiles/Yello - 1985 - Stella/01 - Test.flac',
  );
  expect(await db.refresh()).toBeTruthy();
  const finalFlat = db.getFlatDatabase();
  expect(finalFlat.songs.length).toEqual(743);
  let coverCount = 0;
  for (const { key } of finalFlat.albums) {
    const cover = await db.getAlbumPicture(key);
    if (!cover) {
      continue;
    }
    const data = cover as Buffer;
    expect(data.length == 1 || data.length == 19).toBeTruthy();
    expect(data[0] == 10 || data.length == 19).toBeTruthy(); // All my "jpg"s but one
    coverCount++;
  }
  expect(coverCount).toEqual(126);
  const res = db.searchIndex(false, 'qwerty');
  expect(res.songs.length).toEqual(6);
  const s1 = db.getCanonicalFileName(res.songs[0]);
  const s2 = db.getCanonicalFileName(res.songs[1]);
  const s3 = db.getCanonicalFileName(res.songs[2]);
  const s4 = db.getCanonicalFileName(res.songs[3]);
  const s5 = db.getCanonicalFileName(res.songs[4]);
  const s6 = db.getCanonicalFileName(res.songs[5]);
  expect(s1).toEqual(
    'VA - 2009 - Singles/02 - Whitetown - Not an actual song qwerty [w- Yello].mp3',
  );
  expect(s2).toEqual(
    'VA - 2009 - Singles/03 - Yello - Another Not Song qwerty [live from silly place].mp3',
  );
  expect(s3).toEqual(
    'VA - 2009 - Singles/04 - ZZ Top - Both qwerty [live yup, it is][w- Whitetown].mp3',
  );
  expect(s4).toEqual(
    'ZZ Top - 1992 - Greatest Hits/07 - Not a song qwerty [remix].mp3',
  );
  expect(s5).toEqual(
    'ZZ Top - 1992 - Greatest Hits/08 - Not another qwerty song [remix][live][w- Whitetown & Yello].mp3',
  );
  expect(s6).toEqual(
    'ZZ Top - 1992 - Greatest Hits/09 - Not qwerty another song [remix][w- Whitetown, Underworld & Yello].m4a',
  );
});

it('Loading and Saving', async () => {
  const db = await MakeAudioDatabase(persist);
  expect(db).toBeDefined();
  expect(
    await db.addFileLocation('./src/__tests__/NotActuallyFiles'),
  ).toBeTruthy();
  expect(await db.refresh()).toBeTruthy();
  const flat = db.getFlatDatabase();
  expect(flat).toBeDefined();
  await db.save();

  const db2 = await MakeAudioDatabase(persist);
  expect(db2).toBeDefined();
  expect(await db2.load()).toBeTruthy();
});

it('Ignoring stuff', async () => {
  await Promise.resolve(process.nextTick);
  const db = await MakeAudioDatabase(persist);
  expect(db).toBeDefined();
  if (!(await db.addFileLocation('./src/__tests__/NotActuallyFiles'))) {
    await db.removeFileLocation('./src/__tests__/NotActuallyFiles');
    expect(
      await db.addFileLocation('./src/__tests__/NotActuallyFiles'),
    ).toBeTruthy();
  }
  let flat = db.getFlatDatabase();
  expect(flat.songs.length).toEqual(743);
  expect(flat.albums.length).toEqual(189);
  expect(flat.artists.length).toEqual(273);

  db.addIgnoreItem('dir-name', 'VA - AM Gold');
  expect(await db.refresh()).toBeTruthy();
  flat = db.getFlatDatabase();
  expect(flat).toBeDefined();
  expect(flat.songs.length).toEqual(705);
  expect(flat.albums.length).toEqual(188);
  expect(flat.artists.length).toEqual(236);

  expect(db.removeIgnoreItem('dir-name', 'VA - AM Gold')).toBeTruthy();
  db.addIgnoreItem('path-keyword', 'Petty');
  expect(await db.refresh()).toBeTruthy();
  flat = db.getFlatDatabase();
  expect(flat).toBeDefined();
  expect(flat.songs.length).toEqual(730);
  expect(flat.albums.length).toEqual(186);
  expect(flat.artists.length).toEqual(272);

  db.addIgnoreItem('path-root', '/Utah Saints - 1992 - Utah Saints');
  expect(await db.refresh()).toBeTruthy();
  flat = db.getFlatDatabase();
  expect(flat).toBeDefined();
  expect(flat.songs.length).toEqual(726);
  expect(flat.albums.length).toEqual(185);
  expect(flat.artists.length).toEqual(271);
});
