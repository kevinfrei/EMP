// The currently selected item from the left bar

import { CurrentView, CurrentViewEnum, isCurrentView } from '@freik/emp-shared';
import { atom } from 'jotai';
import { isMiniplayerState } from './Local';
import { atomWithMainStorage } from './Storage';

// The currently selected item from the left bar
// artist, album, search, tools, settings, etc...
const curViewBackerState = atomWithMainStorage<CurrentViewEnum>(
  'CurrentView',
  CurrentView.settings,
  isCurrentView,
);

// This makes the miniplayer view always select the current view
export const curViewFunc = atom(
  (get) =>
    get(isMiniplayerState) ? CurrentView.now_playing : get(curViewBackerState),
  (_get, set, newVal: CurrentViewEnum) => set(curViewBackerState, newVal),
);
