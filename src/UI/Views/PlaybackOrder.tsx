import { IDetailsRowProps, Panel, PanelType } from '@fluentui/react';
import { useAtom, useAtomValue } from 'jotai';
import { useRecoilValue } from 'recoil';
import { isMiniplayerState, playOrderDisplayingState } from '../../Jotai/Local';
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
  const isMiniplayer = useAtomValue(isMiniplayerState);
  const pbOrder = useRecoilValue(songPlaybackOrderState);
  const unsortedSongKeys = useRecoilValue(songListState);
  const sortedSongKeys =
    pbOrder !== 'ordered'
      ? pbOrder.map((val) => unsortedSongKeys[val])
      : unsortedSongKeys;
  const [isOpen, setPlaybackOrderDisplaying] = useAtom(
    playOrderDisplayingState,
  );
  const close = () => setPlaybackOrderDisplaying(false);

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
