import { IDetailsRowProps, Panel, PanelType } from '@fluentui/react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import {
  isMiniplayerState,
  playOrderDisplayingState,
} from '../../Recoil/Local';
import { shuffleFunc } from '../../Recoil/ReadWrite';
import {
  currentIndexState,
  songListState,
  songPlaybackOrderState,
} from '../../Recoil/SongPlaying';
import { SimpleSongsList } from './MixedSongs';

export function PlaybackOrder(): JSX.Element {
  const curIndex = useRecoilValue(currentIndexState);
  const isShuffle = useRecoilValue(shuffleFunc);
  const isMiniplayer = useRecoilValue(isMiniplayerState);
  const pbOrder = useRecoilValue(songPlaybackOrderState);
  const unsortedSongKeys = useRecoilValue(songListState);
  const sortedSongKeys =
    pbOrder !== 'ordered'
      ? pbOrder.map((val) => unsortedSongKeys[val])
      : unsortedSongKeys;
  const isOpen = useRecoilValue(playOrderDisplayingState);
  const close = useRecoilCallback(
    ({ set }) =>
      () =>
        set(playOrderDisplayingState, false),
  );
  const isBold = (props: IDetailsRowProps) => props.itemIndex === curIndex;
  return (
    <Panel
      isLightDismiss
      isOpen={isOpen && isShuffle && !isMiniplayer}
      onDismiss={close}
      closeButtonAriaLabel="Close"
      headerText="Playback Order"
      type={PanelType.medium}
      isBlocking={false}
    >
      <SimpleSongsList
        forSongs={sortedSongKeys}
        bold={isBold}
        keyprefix="po-"
      />
    </Panel>
  );
}
