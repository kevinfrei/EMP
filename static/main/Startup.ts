import { UpdateLocations } from './AudioDatabase';
import { CommsSetup } from './Communication';
import { Persistence } from './persist';

/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  //
  const locs = await Persistence.getItemAsync('locations');
  if (locs) {
    await UpdateLocations(locs);
  }
}
