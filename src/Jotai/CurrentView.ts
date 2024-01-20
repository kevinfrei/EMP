// The currently selected item from the left bar

import { CurrentView, isCurrentView } from '@freik/emp-shared';
import { atom } from 'jotai';
import { isMiniplayerAtom } from './Local';
import { atomWithMainStorage } from './Storage';

// The currently selected item from the left bar
// artist, album, search, tools, settings, etc...
const curViewBackerAtom = atomWithMainStorage(
  'CurrentView',
  CurrentView.settings,
  isCurrentView,
);

// This makes the miniplayer view always select the current view
export const curViewAtom = atom(
  (get) =>
    get(isMiniplayerAtom) ? CurrentView.now_playing : get(curViewBackerAtom),
  (_get, set, newVal: CurrentView) => set(curViewBackerAtom, newVal),
);
