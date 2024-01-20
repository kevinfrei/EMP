// The currently selected item from the left bar

import { CurrentView, StorageKey, isCurrentView } from '@freik/emp-shared';
import { atom } from 'jotai';
import { atomWithMainStorage } from './Helpers';
import { isMiniplayerAtom } from './Local';

// The currently selected item from the left bar
// artist, album, search, tools, settings, etc...
const curViewBackerAtom = atomWithMainStorage(
  StorageKey.CurrentView,
  CurrentView.settings,
  isCurrentView,
);

// This makes the miniplayer view always select the current view
export const curViewAtom = atom(
  (get) =>
    get(isMiniplayerAtom) ? CurrentView.now_playing : get(curViewBackerAtom),
  (_get, set, newVal: CurrentView) => set(curViewBackerAtom, newVal),
);
