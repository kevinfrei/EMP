import { Comms, Persistence } from '@freik/electron-main';
import { MakeLog } from '@freik/logger';
import { protocol } from 'electron';
import { UpdateAudioLocations } from './AudioDatabase';
import { PictureHandler } from './cover-art';
import { tuneNewProtocolHandler, tuneProtocolHandler } from './protocols';

const { log } = MakeLog('EMP:main:RegisterProtocols');

export function RegisterPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'tune',
      privileges: {
        // secure: true,
        standard: true,
        supportFetchAPI: true, // Add this if you want to use fetch with this protocol.
        stream: true, // Add this if you intend to use the protocol for streaming i.e. in video/audio html tags.
        // corsEnabled: true, // Add this if you need to enable cors for this protocol.
        // bypassCSP: false
      },
    },
  ]);
}
// This sets up all protocol handlers

export function RegisterProtocols(): void {
  // TODO: Enable both song & album pictures
  // folder-level photos are fine, but for song requests, check the song
  // then fall back to the album
  log('Registering pic://key/ protocol');
  protocol.handle('pic', PictureHandler);
  log('Registering tune://song/ protocol');
  protocol.handle('tune', tuneNewProtocolHandler);
  Comms.registerOldProtocolHandler(
    'trune://song/',

    protocol.registerFileProtocol,
    tuneProtocolHandler,
  );
  log('Finished protocol registration');
}
// This sets up reactive responses to changes, for example:
// locations change, so music needs to be rescanned

export function RegisterListeners(): void {
  Persistence.subscribe('locations', UpdateAudioLocations);
}
