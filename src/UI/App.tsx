import { IconButton, SpinnerSize } from '@fluentui/react';
import { FreikElem, Ipc } from '@freik/elect-render-utils';
import { Spinner } from '@freik/web-utils';
import { useState } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { IpcId } from 'shared';
import { isHostMac } from '../MyWindow';
import { isMiniplayerState } from '../Recoil/Local';
import { SongDetailPanel } from './DetailPanel/SongDetailPanel';
import { PlaybackControls } from './PlaybackControls';
import { Sidebar } from './Sidebar';
import { SongPlaying } from './SongPlaying';
import './styles/App.css';
import { Utilities } from './Utilities';
import { ViewSelector } from './Views/Selector';
import { VolumeControl } from './VolumeControl';

function WindowChrome(): JSX.Element {
  const isMiniPlayer = useRecoilValue(isMiniplayerState);
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
    return (
      <span id="window-chrome">
        <IconButton
          iconProps={{ iconName: 'GlobalNavButton' }}
          title="hamburger"
          onClick={() => void Ipc.InvokeMain(IpcId.ShowMenu)}
        />
        <IconButton
          iconProps={{ iconName: 'ChromeMinimize' }}
          title="minimize"
          onClick={() => void Ipc.InvokeMain(IpcId.MinimizeWindow)}
        />
        <IconButton
          iconProps={{ iconName: resMaxName }}
          title={resMaxTitle}
          onClick={() => {
            setIsMax(!isMax);
            void Ipc.InvokeMain(resMaxId);
          }}
        />
        <IconButton
          iconProps={{ iconName: 'ChromeClose' }}
          title="close"
          onClick={() => void Ipc.InvokeMain(IpcId.CloseWindow)}
        />
      </span>
    );
  }
}

export function App(): JSX.Element {
  return (
    <RecoilRoot>
      <span id="grabber">
        <Spinner label="Brief Communication. Please standby...">
          <FreikElem />
          <Utilities />
        </Spinner>
      </span>
      <span id="left-column"></span>
      <span id="top-row"></span>
      <WindowChrome />
      <Spinner label="Intializing...">
        <PlaybackControls />
        <SongPlaying />
        <VolumeControl />
        <Sidebar />
      </Spinner>
      <Spinner label="Please wait..." size={SpinnerSize.large}>
        <ViewSelector />
      </Spinner>
      <SongDetailPanel />
    </RecoilRoot>
  );
}
