import { IDetailsRowProps, Panel, PanelType } from '@fluentui/react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import {
  currentIndexState,
  isMiniplayerState,
  playOrderDisplayingState,
  songListState,
  songPlaybackOrderState,
} from '../../Recoil/Local';
import { shuffleFunc } from '../../Recoil/ReadWrite';
import { SimpleSongsList } from './MixedSongs';

export function PlaybackOrder(): JSX.Element {
  const isOpen = useRecoilValue(playOrderDisplayingState);
  const close = useRecoilCallback(
    ({ set }) =>
      () =>
        set(playOrderDisplayingState, false),
  );
  const pbOrder = useRecoilValue(songPlaybackOrderState);
  let songKeys = useRecoilValue(songListState);
  if (pbOrder !== 'ordered') {
    songKeys = pbOrder.map((val) => songKeys[val]);
  }
  const curIndex = useRecoilValue(currentIndexState);
  const isBold = (props: IDetailsRowProps) => props.itemIndex === curIndex;
  const isShuffle = useRecoilValue(shuffleFunc);
  const isMiniplayer = useRecoilValue(isMiniplayerState);
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
      <SimpleSongsList forSongs={songKeys} bold={isBold} />
    </Panel>
  );
}
