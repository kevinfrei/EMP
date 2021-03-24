import { FTON, MakeError, MakeLogger } from '@freik/core-utils';
import { promisify } from 'util';
import { asyncSend } from './Communication';
import { getMusicDB, saveMusicDB, setMusicIndex } from './MusicAccess';
import * as music from './MusicScanner';
import * as persist from './persist';

const log = MakeLogger('MusicUpdates');
const err = MakeError('MusicUpdates-err');

const sleep = promisify(setTimeout);

function getLocations(): string[] {
  const strLocations = persist.getItem('locations');
  const rawLocations = strLocations ? FTON.parse(strLocations) : [];
  log('getLocations:');
  log(rawLocations);
  return (rawLocations && FTON.arrayOfStrings(rawLocations)) || [];
}

export async function CreateMusicDB(): Promise<void> {
  const musicLocations = getLocations();
  log('Got music locations:');
  log(musicLocations);
  //  const musicDB = await music.find(musicLocations);
  const musicDB = await music.findAudio(musicLocations);
  log('Got Music DB with songs count:');
  log(musicDB.songs.size);
  await saveMusicDB(musicDB);

  const start = new Date().getTime();
  setMusicIndex(music.makeIndex(musicDB));
  const stop = new Date().getTime();

  log(`Total time to build index: ${stop - start} ms`);
}

let scanning = false;
let scansWaiting = false;
// Only allow 1 rescan at a time
// Single thread execution makes this *super* easy :D
export async function RescanDB(): Promise<void> {
  // Hurray for simple non-atomic synchronization :)
  if (scanning) {
    if (scansWaiting) {
      return;
    }
    scansWaiting = true;
    while (scanning) {
      await sleep(100);
    }
  }
  if (scanning) {
    throw Error('WTaF');
  }
  try {
    scanning = true;
    scansWaiting = false;
    const prevDB = await getMusicDB();
    if (prevDB) {
      log('Songs before:' + prevDB.songs.size.toString());
    } else {
      log('No MusicDB existing prior to this scan');
    }
    await CreateMusicDB();
    const db = await getMusicDB();
    if (db) {
      log('About to send the database update');
      asyncSend({ musicDatabase: db });
      if (prevDB) {
        log('Songs before:' + prevDB.songs.size.toString());
        log('Songs after: ' + db.songs.size.toString());
      }
    }
  } finally {
    scanning = false;
  }
}

export function UpdateDB(): void {
  RescanDB()
    .then(() => log('Finished updating the database'))
    .catch((rej) => {
      err('Caught an exception while trying to update the db');
      err(rej);
    });
}

let updateSendTimeout: NodeJS.Timeout | null = null;

export function sendUpdatedDB(db: music.MusicDB): void {
  if (updateSendTimeout !== null) {
    clearTimeout(updateSendTimeout);
  }
  updateSendTimeout = setTimeout(() => {
    log('Sending database');
    asyncSend({ musicDatabase: db });
  }, 250);
}
