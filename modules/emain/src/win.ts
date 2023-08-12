import { DebouncedEvery } from '@freik/sync';
import { BrowserWindow } from 'electron';
import { LoadWindowPos, SaveWindowPos, WindowPosition } from './persist';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

/**
 * Returns a reference to the main
 * [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
 * (or null)
 * @returns the main window handle (or null)
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

const windowPos: WindowPosition = LoadWindowPos();

/**
 * Try to read the currently main window position.
 * @returns the main window position (or the most recently loaded/saved value)
 */
export function getWindowPos(win?: BrowserWindow): WindowPosition {
  const mw = win || getMainWindow();
  if (mw) {
    windowPos.isMaximized = mw.isMaximized();
    if (!windowPos.isMaximized) {
      // only update bounds if the window isn’t currently maximized
      windowPos.bounds = mw.getBounds();
    }
  }
  return windowPos;
}

// This will get called after a 1 second delay (and subsequent callers will
// not be registered if one is waiting) to not be so aggressive about saving
// the window position to disk
const windowPosUpdated = DebouncedEvery(() => {
  // Get the window state & save it
  SaveWindowPos(getWindowPos());
}, 1000);

/**
 * Sets the main window and configures it to update the window position
 * as well as clear the reference when it's closed
 * @param win The
 * [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
 * to consider the 'main' window
 */
export function setMainWindow(win: BrowserWindow) {
  const first = mainWindow === null;
  mainWindow = win;
  if (first) {
    mainWindow
      .on('closed', () => {
        // Clear the reference to the window object.
        // Usually you would store windows in an array.
        // If your app supports multiple windows, this is the time when you should
        // delete the corresponding element.
        mainWindow = null;
      })
      // Save the window position when it's changed:
      .on('resize', windowPosUpdated)
      .on('move', windowPosUpdated);
  }
}
