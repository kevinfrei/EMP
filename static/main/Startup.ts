import { MakeError, MakeLogger } from '@freik/core-utils';
import electronIsDev from 'electron-is-dev';
import { GetAudioDB } from './AudioDatabase';
import { CommsSetup } from './Communication';

const log = MakeLogger('Startup', false && electronIsDev);
const err = MakeError('Startup');
/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  // Get the Audio Database and then refresh in real soon
  const db = await GetAudioDB();
  setTimeout(() => {
    db.refresh().catch(err);
  }, 1);
}
