import { IconButton, SpinnerSize } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { FreikElem, Ipc } from '@freik/elect-render-utils';
import { Spinner } from '@freik/web-utils';
import { RecoilRoot } from 'recoil';
import { IpcId } from 'shared';
import {} from '../__mocks__/MyWindow';
import { SongDetailPanel } from './DetailPanel/SongDetailPanel';
import { PlaybackControls } from './PlaybackControls';
import { Sidebar } from './Sidebar';
import { SongPlaying } from './SongPlaying';
import './styles/App.css';
import { Utilities } from './Utilities';
import { ViewSelector } from './Views/Selector';
import { VolumeControl } from './VolumeControl';

function Hamburger(): JSX.Element {
  if (
    Type.hasType(window, 'freik', Type.isObject) &&
    Type.hasStr(window.freik, 'hostOs') &&
    window.freik.hostOs !== 'darwin'
  ) {
    return (
      <IconButton
        iconProps={{ iconName: 'GlobalNavButton' }}
        title="hamburger"
        onClick={() => void Ipc.InvokeMain(IpcId.FlushImageCache)}
      />
    );
  } else {
    return <></>;
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
        <Hamburger />
      </span>
      <span id="left-column"></span>
      <span id="top-row"></span>
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
