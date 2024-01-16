import { IDetailsRowProps, Panel, PanelType } from '@fluentui/react';
import { useAtom, useAtomValue } from 'jotai';
import { isMiniplayerState, playOrderDisplayingState } from '../../Jotai/Local';
import { shuffleState } from '../../Jotai/SimpleSettings';
import {
  currentIndexState,
  songListState,
  songPlaybackOrderState,
} from '../../Jotai/SongsPlaying';
import { SimpleSongsList } from './MixedSongs';

export function PlaybackOrder(): JSX.Element {
  const curIndex = useAtomValue(currentIndexState);
  const isShuffle = useAtomValue(shuffleState);
  const isMiniplayer = useAtomValue(isMiniplayerState);
  const pbOrder = useAtomValue(songPlaybackOrderState);
  const unsortedSongKeys = useAtomValue(songListState);
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
