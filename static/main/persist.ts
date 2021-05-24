import { Pickle, Type, Unpickle } from '@freik/core-utils';
import { MakePersistence } from '@freik/node-utils';
import { app, Rectangle } from 'electron';
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

// Here's a place for app settings & stuff...
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
) => ({ bounds: { x, y, width, height }, isMaximized });

const defaultWindowPosition: WindowPosition = makeWindowPos(
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  Number.MIN_SAFE_INTEGER, // eslint-disable-line id-blacklist
  900,
  680,
  false,
);

export function LoadWindowPos(): WindowPosition {
  try {
    const tmp = Persistence.getItem('windowPosition');
    if (!tmp) {
      return defaultWindowPosition;
    }
    const tmpws = Unpickle(tmp);
    if (Type.has(tmpws, 'bounds')) {
      const bounds = tmpws.bounds;
      if (
        Type.hasType(bounds, 'x', Type.isNumber) &&
        Type.hasType(bounds, 'y', Type.isNumber) &&
        Type.hasType(bounds, 'width', Type.isNumber) &&
        Type.hasType(bounds, 'height', Type.isNumber) &&
        Type.hasType(tmpws, 'isMaximized', Type.isBoolean)
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

export function SaveWindowPos(st: WindowPosition): void {
  Persistence.setItem('windowPosition', Pickle(st));
}

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

  return {
    width: st.bounds.width,
    height: st.bounds.height,
    x: st.bounds.x as any as number,
    y: st.bounds.y as any as number,
  };
}
