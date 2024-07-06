import { IconButton, SpinnerSize } from '@fluentui/react';
import { ElectronWireUp, Ipc } from '@freik/electron-render';
import { IpcId } from '@freik/emp-shared';
import { Spinner } from '@freik/web-utils';
import { Provider, useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { isMiniplayerState } from '../Jotai/Local';
import { getStore } from '../Jotai/Storage';
import { isHostMac } from '../MyWindow';
import { SongDetailPanel } from './DetailPanel/SongDetailPanel';
import { PlaybackControls } from './PlaybackControls';
import { Sidebar } from './Sidebar';
import { SongPlaying } from './SongPlaying';
import { ErrorBoundary, Utilities } from './Utilities';
import { ViewSelector } from './Views/Selector';
import { VolumeControl } from './VolumeControl';
import './styles/App.css';

function WindowChrome(): JSX.Element {
  const isMiniPlayer = useAtomValue(isMiniplayerState);
  const [isMax, setIsMax] = useState(false);
  if (isHostMac() || isMiniPlayer) {
    // For macOS, the menu is always up there, wasting space,
    // and the window buttons are handed in the main process
    // Just turn this stuff off in MiniPlayer mode, too...
    return <></>;
  } else {
    // 'ChromeMaximize' << Doesn't exist in Fluent Icons
    // 'CheckBox' 'SingleColumn' 'GridViewLarge' all look okay
    const resMaxTitle = isMax ? 'restore' : 'maximize';
    const resMaxName = isMax ? 'ChromeRestore' : 'GridViewLarge';
    const resMaxId: IpcId = isMax ? IpcId.RestoreWindow : IpcId.MaximizeWindow;
    const ic = (iconName: string) => ({ iconName, style: { fontSize: 10 } });
    return (
      <span id="window-chrome">
        <IconButton
          id="close-button"
          iconProps={ic('ChromeClose')}
          title="close"
          onClick={() => void Ipc.InvokeMain(IpcId.CloseWindow)}
        />
        <IconButton
          id="maximize-button"
          iconProps={ic(resMaxName)}
          title={resMaxTitle}
          onClick={() => {
            setIsMax(!isMax);
            void Ipc.InvokeMain(resMaxId);
          }}
        />
        <IconButton
          id="minimize-button"
          iconProps={ic('ChromeMinimize')}
          title="minimize"
          onClick={() => void Ipc.InvokeMain(IpcId.MinimizeWindow)}
        />
        <IconButton
          id="menu-button"
          iconProps={ic('ChevronDown')}
          title="hamburger"
          onClick={() => void Ipc.InvokeMain(IpcId.ShowMenu)}
        />
      </span>
    );
  }
}

export function App(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lilGrabber = isHostMac() ? 'grab-mac' : 'grab-other';
  const store = getStore();
  return (
    <Provider store={store}>
      <Spinner>
        <ElectronWireUp />
        <Utilities audioRef={audioRef} />
        <span id={lilGrabber} />
      </Spinner>
      <span id="left-column" />
      <span id="top-row" />
      <WindowChrome />
      <Spinner>
        <PlaybackControls audioRef={audioRef} />
      </Spinner>
      <Spinner>
        <ErrorBoundary>
          <SongPlaying ref={audioRef} />
        </ErrorBoundary>
      </Spinner>
      <Spinner>
        <VolumeControl />
      </Spinner>
      <Spinner>
        <Sidebar />
      </Spinner>
      <Spinner size={SpinnerSize.large}>
        <ViewSelector />
      </Spinner>
      <SongDetailPanel />
    </Provider>
  );
}
