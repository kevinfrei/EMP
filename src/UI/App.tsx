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
  const lilGrabber = isHostMac() ? 'grab-mac' : 'grab-other';
  return (
    <RecoilRoot>
      <Spinner>
        <FreikElem />
        <Utilities />
        <span id={lilGrabber} />
      </Spinner>
      <span id="left-column" />
      <span id="top-row" />
      <WindowChrome />
      <Spinner>
        <PlaybackControls />
        <SongPlaying />
        <VolumeControl />
        <Sidebar />
      </Spinner>
      <Spinner size={SpinnerSize.large}>
        <ViewSelector />
      </Spinner>
      <SongDetailPanel />
    </RecoilRoot>
  );
}
