import { SpinnerSize } from '@fluentui/react';
import { RecoilRoot } from 'recoil';
import SongDetailPanel from './DetailPanel/SongDetailPanel';
import PlaybackControls from './PlaybackControls';
import Sidebar from './Sidebar';
import SongPlaying from './SongPlaying';
import './styles/App.css';
import Utilities, { Spinner } from './Utilities';
import ViewSelector from './Views/Selector';
import VolumeControl from './VolumeControl';

export default function App(): JSX.Element {
  return (
    <RecoilRoot>
      <span id="grabber">
        <Utilities />
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
