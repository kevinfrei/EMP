import { Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { atomWithStorage } from 'jotai/utils';
import {
  emptyLibrary,
  isFlatAudioDatabase,
  MakeMusicLibraryFromFlatAudioDatabase,
  MusicLibrary,
} from '../MusicLibrarySchema';

async function getTranslatedMusicDB(): Promise<MusicLibrary> {
  try {
    const strValue = await Ipc.CallMain(
      IpcId.GetMusicDatabase,
      undefined,
      isFlatAudioDatabase,
    );
    return strValue
      ? MakeMusicLibraryFromFlatAudioDatabase(strValue)
      : emptyLibrary;
  } catch {
    /* */
  }
  return emptyLibrary;
}

function getTranslatedSubscribe(
  key: string,
  callback: (value: MusicLibrary) => void,
  initialValue: MusicLibrary,
) {
  const lk = Ipc.Subscribe(key, (val: unknown) => {
    if (isFlatAudioDatabase(val)) {
      callback(MakeMusicLibraryFromFlatAudioDatabase(val));
    } else {
      callback(initialValue);
    }
  });
  return () => Ipc.Unsubscribe(lk);
}

export const musicLibraryState = atomWithStorage(
  IpcId.MusicDBUpdate,
  emptyLibrary,
  {
    getItem: getTranslatedMusicDB,
    setItem: Promise.resolve,
    removeItem: Promise.resolve,
    subscribe: getTranslatedSubscribe,
  },
);
