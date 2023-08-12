import { Persistence } from '@freik/electron-main';
import { MakeLog } from '@freik/logger';
import { isString } from '@freik/typechk';
import { app } from 'electron';
import { UpdateLocations } from './AudioDatabase';
import { CommsSetup } from './Communication';
import {
  RegisterListeners,
  RegisterPrivileges,
  RegisterProtocols,
} from './protocols';

const { wrn } = MakeLog('EMP:main:Startup');

/**
 * Called to set stuff up before *anything* else has been done.
 */
export function InitBeforeAnythingElse(): void {
  CommsSetup();
  RegisterPrivileges();
  app.whenReady().then(RegisterProtocols).catch(wrn);
  RegisterListeners();
}

// This is awaited upon initial window creation
export async function WindowStartup(): Promise<void> {
  //
  const locs = await Persistence.getItemAsync('locations');
  await UpdateLocations(isString(locs) ? locs : '[]');
}
