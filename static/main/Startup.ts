import { MakeLogger } from '@freik/core-utils';
import electronIsDev from 'electron-is-dev';
import { CommsSetup } from './Communication';
import { getMusicDB } from './MusicAccess';
import { UpdateDB } from './musicDB';
const log = MakeLogger('Startup', false && electronIsDev);

/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  // Scan for all music
  log('Trying to get DB');
  const musicDB = await getMusicDB();
  // If we already have a musicDB, continue and schedule it to be rescanned
  if (musicDB) {
    log('Got the DB');
    setTimeout(UpdateDB, 1);
  } else {
    log('No DB available');
  }
  /*
  setInterval(() => {
    const now = new Date();
    const str = now.toTimeString();
    const trimmed = str.substr(0, str.indexOf(' '));
    asyncSend({ 'main-process-status': trimmed });
  }, 1000);*/
}
