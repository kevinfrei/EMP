import { isArrayOfString } from '@freik/typechk';
import { NativeImage, OpenDialogSyncOptions } from 'electron';
import { CallMain } from './ipc.js';
import { ElectronWindow } from './types.js';

declare let window: ElectronWindow;

/**
 * NYI! This used to work, but now it needs to get support from the main
 * process to work properly :/
 *
 * @returns True if the app is in Development mode
 */
export function IsDev(): boolean {
  return (
    window.electronConnector !== undefined &&
    window.electronConnector.isDev === true
  );
}

/**
 * This should be invoked from your index.tsx file and render your app in
 * the function passed in:
 *
 * ```javascript
 * Util.SetInit(() => {
 *   initializeIcons();
 *   const root = document.getElementById('root');
 *   if (root) {
 *     ReactDOM.render(
 *       <React.StrictMode>
 *         <App />
 *       </React.StrictMode>,
 *       root,
 *     );
 *   }
 * });
 * ```
 *
 * @param func Your initial render function
 */
export function SetInit(func: () => void): void {
  window.initApp = func;
}

/**
 * @async
 * Shows an Open dialog for the platform you're on. Use this instead of the
 * long-deprecated `remote` electron module.
 *
 * @param options an
 * [OpenDialogOptions](https://www.electronjs.org/docs/latest/api/dialog)
 * instance describing what kind of Open dialog you want to show
 * @returns A promise that resolves to the array of files/folders selected
 */
export async function ShowOpenDialog(
  options: OpenDialogSyncOptions,
): Promise<string[] | void> {
  return await CallMain('show-open-dialog', options, isArrayOfString);
}

/**
 * Try to get an image from the clipboard. It's good for letting folks "paste"
 * and image into a region. I think...
 *
 * @returns An Electron NativeImage type (which can be assigned to an img elem)
 */
export function ImageFromClipboard(): NativeImage | undefined {
  return window.electronConnector
    ? window.electronConnector.clipboard.readImage()
    : undefined;
}
