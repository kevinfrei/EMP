import { IpcRenderer } from 'electron';

export type ListenKey = { key: string; id: string };

export type MessageHandler = (val: unknown) => void;

export type ElectronConnector = {
  ipc: IpcRenderer;
  isDev?: boolean;
  clipboard: Electron.Clipboard;
  hostOs: 'mac' | 'win' | 'lin' | 'unk';
};

export interface ElectronWindow extends Window {
  electronConnector?: ElectronConnector;
  initApp?: () => void;
}
