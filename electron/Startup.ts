import { Persistence } from '@freik/elect-main-utils';
import { isString } from '@freik/typechk';
import debug from 'debug';
import { UpdateLocations } from './AudioDatabase';
import { CommsSetup } from './Communication';
import { RegisterListeners, RegisterProtocols } from './protocols';

const err = debug('EMP:main:Startup:error');
err.enabled = true;

/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
  RegisterProtocols().catch(err);
  RegisterListeners();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  //
  const locs = await Persistence.getItemAsync('locations');
  await UpdateLocations(isString(locs) ? locs : '[]');
}
