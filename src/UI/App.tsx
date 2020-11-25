import { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import Sidebar, { isSearchBox } from './Sidebar';
import SongControls from './SongControls';
import SongDetailPanel from './SongDetailPanel';
import SongPlayback from './SongPlayback';
import './styles/App.css';
import Utilities, { Spin } from './Utilities';
import ViewSelector from './Views/Selector';
import VolumeControl from './VolumeControl';

function listener(ev: KeyboardEvent) {
  // eslint-disable no-console
  if (!isSearchBox(ev.target)) {
    // TODO: Filter the current view by this string!
    // console.log(ev.code);
    // escape should clear the filter string
    // With some timeout, we string them together into a search string
  }
}

export default function App(): JSX.Element {
  useEffect(() => {
    window.addEventListener('keypress', listener);
    return () => {
      window.removeEventListener('keypress', listener);
    };
  });
  return (
    <RecoilRoot>
      <Utilities />
      <span className="grabber"></span>
      <span className="left-column"></span>
      <span className="top-row"></span>
      <Spin label="Intializing...">
        <SongControls />
        <SongPlayback />
        <VolumeControl />
        <Sidebar />
      </Spin>
      <Spin label="Please wait...">
        <ViewSelector />
      </Spin>
      <SongDetailPanel />
    </RecoilRoot>
  );
}
