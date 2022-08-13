import { Type } from '@freik/core-utils';
import { Persistence } from '@freik/elect-main-utils';
import { UpdateLocations } from './AudioDatabase';
import { CommsSetup } from './Communication';

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
  await UpdateLocations(Type.isString(locs) ? locs : '[]');
}
