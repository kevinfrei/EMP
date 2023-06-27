import { MakePersistence } from '@freik/node-utils';
import {
  Pickle,
  Unpickle,
  hasField,
  hasFieldType,
  isBoolean,
  isNumber,
} from '@freik/typechk';
import { Rectangle, app } from 'electron';
import path from 'path';

export type MaybeRectangle = {
  width: number;
  height: number;
  x?: number;
  y?: number;
};

export type WindowPosition = {
  bounds: MaybeRectangle;
  isMaximized: boolean;
};

/**
 * A
 * [`persist`](https://github.com/kevinfrei/node-utils/blob/main/src/persist.ts)
 * interface for the Electron app's persistent data location. It's a good place
 * for app settings and the like.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Persistence = MakePersistence(
  path.join(app.getPath('userData'), 'PersistedData'),
);

const makeWindowPos = (
  x: number,
  y: number,
  width: number,
  height: number,
  isMaximized: boolean,
) => ({
  bounds: {
    x,
    y,
    width,
    height,
  },
  isMaximized,
});

const defaultWindowPosition: WindowPosition = makeWindowPos(
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  900,
  680,
  false,
);

/**
 * Load the saved position of the window
 *
 * @returns The previous location of the window for the app
 */
export function LoadWindowPos(): WindowPosition {
  try {
    const tmp = Persistence.getItem('windowPosition');
    if (!tmp) {
      return defaultWindowPosition;
    }
    const tmpws = Unpickle(tmp);
    if (hasField(tmpws, 'bounds')) {
      const { bounds } = tmpws;
      if (
        hasFieldType(bounds, 'x', isNumber) &&
        hasFieldType(bounds, 'y', isNumber) &&
        hasFieldType(bounds, 'width', isNumber) &&
        hasFieldType(bounds, 'height', isNumber) &&
        hasFieldType(tmpws, 'isMaximized', isBoolean)
      ) {
        return makeWindowPos(
          bounds.x,
          bounds.y,
          bounds.width,
          bounds.height,
          tmpws.isMaximized,
        );
      }
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return defaultWindowPosition;
}

/**
 * Save the window position for future use as a window-restore size
 *
 * @param st The window position to save
 */
export function SaveWindowPos(st: WindowPosition): void {
  Persistence.setItem('windowPosition', Pickle(st));
}

/**
 * Translates a WindowPosition into a Rectangle for use elsewhere
 *
 * @param st The WindowPosition to translate
 * @returns a rectangle which may or may not have and X and Y coordinate
 */
export function GetBrowserWindowPos(st: WindowPosition): Rectangle {
  if (
    st.bounds.x === Number.MIN_SAFE_INTEGER || // eslint-disable-line id-blacklist
    st.bounds.y === Number.MIN_SAFE_INTEGER || // eslint-disable-line id-blacklist
    !('x' in st.bounds) ||
    !('y' in st.bounds)
  ) {
    return {
      width: st.bounds.width,
      height: st.bounds.height,
    } as Rectangle;
  }

  // TODO: If the last time you ran, you had a different layout,
  // this position may be 'off screen'. In Windows, it doesn't get moved back.
  // (Not sure about MacOS or Linux right now: I'm on an airplane...)

  return {
    width: st.bounds.width,
    height: st.bounds.height,
    x: st.bounds.x as unknown as number,
    y: st.bounds.y as unknown as number,
  };
}
