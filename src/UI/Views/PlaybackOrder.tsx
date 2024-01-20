import { IDetailsRowProps, Panel, PanelType } from '@fluentui/react';
import { useAtom, useAtomValue } from 'jotai';
import { isMiniplayerAtom, playOrderDisplayingAtom } from '../../Jotai/Local';
import { shuffleAtom } from '../../Jotai/SimpleSettings';
import {
  currentIndexAtom,
  songListAtom,
  songPlaybackOrderAtom,
} from '../../Jotai/SongsPlaying';
import { SimpleSongsList } from './MixedSongs';

export function PlaybackOrder(): JSX.Element {
  const curIndex = useAtomValue(currentIndexAtom);
  const isShuffle = useAtomValue(shuffleAtom);
  const isMiniplayer = useAtomValue(isMiniplayerAtom);
  const pbOrder = useAtomValue(songPlaybackOrderAtom);
  const unsortedSongKeys = useAtomValue(songListAtom);
  const sortedSongKeys =
    pbOrder !== 'ordered'
      ? pbOrder.map((val) => unsortedSongKeys[val])
      : unsortedSongKeys;
  const [isOpen, setPlaybackOrderDisplaying] = useAtom(playOrderDisplayingAtom);
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
