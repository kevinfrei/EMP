import { Panel, PanelType } from '@fluentui/react';
import { Song, Type } from '@freik/core-utils';
import { CallbackInterface, RecoilState, useRecoilState } from 'recoil';
import { songDetailState } from '../Recoil/Local';
import MediaInfoTable from './MediaInfo';
import { Spinner } from './Utilities';

export function SongDetailClick(
  set: <T>(
    recoilVal: RecoilState<T>,
    valOrUpdater: ((currVal: T) => T) | T,
  ) => void,
  song: Song,
  shift?: boolean,
): void {
  if (shift) {
    set(songDetailState, (prev) => {
      if (Type.isArrayOfString(prev)) {
        return [...prev, song.key];
      } else if (prev === null) {
        return prev;
      } else {
        return [prev.key, song.key];
      }
    });
  } else {
    set(songDetailState, song);
  }
}

// This is a helper to shift-click for song details
export function SongDetailContextMenuClick({ set }: CallbackInterface) {
  return (item: Song, index?: number, ev?: Event): void => {
    const shift = Type.has(ev, 'shiftKey') && ev.shiftKey === true;
    SongDetailClick(set, item, shift);
  };
}

export default function SongDetailPanel(): JSX.Element {
  const [detailSong, setDetailSong] = useRecoilState(songDetailState);
  let elem;
  let header = '';
  if (detailSong === null) {
    elem = <div />;
    header = 'No file selected';
  } else if (!Type.isArrayOfString(detailSong)) {
    elem = <MediaInfoTable keyOrKeys={detailSong.key} />;
    header = `Details for ${detailSong.title}`;
  } else {
    elem = <MediaInfoTable keyOrKeys={detailSong} />;
    header = `Details for ${detailSong.length} songs`;
  }

  return (
    <Panel
      isOpen={detailSong !== null}
      type={PanelType.medium}
      onDismiss={() => setDetailSong(null)}
      headerText={header}
      isBlocking={false}
      closeButtonAriaLabel="Close"
      styles={{
        header: {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        },
      }}
    >
      <Spinner label="Loading...">{elem}</Spinner>
    </Panel>
  );
}
