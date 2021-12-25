import { SpinnerSize } from '@fluentui/react';
import { FreikElem } from '@freik/elect-render-utils';
import { Spinner } from '@freik/web-utils';
import { RecoilRoot } from 'recoil';
import { SongDetailPanel } from './DetailPanel/SongDetailPanel';
import { PlaybackControls } from './PlaybackControls';
import { Sidebar } from './Sidebar';
import { SongPlaying } from './SongPlaying';
import './styles/App.css';
import { Utilities } from './Utilities';
import { ViewSelector } from './Views/Selector';
import { VolumeControl } from './VolumeControl';

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
