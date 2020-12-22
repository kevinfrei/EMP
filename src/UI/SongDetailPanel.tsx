import { Panel, PanelType } from '@fluentui/react';
import { Song, Type } from '@freik/core-utils';
import { CallbackInterface, useRecoilState, useRecoilValue } from 'recoil';
import { songDetailState } from '../Recoil/Local';
import { maybeGetDataForSongState } from '../Recoil/ReadOnly';
import MediaInfoTable from './MediaInfo';
import { Spinner } from './Utilities';

export function SongDetailClick(
  { set }: CallbackInterface,
  song: Song,
  shift?: boolean,
): void {
  if (shift) {
    set(songDetailState, (prev) => {
      if (Type.isSetOfString(prev)) {
        const newVal = new Set(prev);
        if (newVal.has(song.key)) {
          newVal.delete(song.key);
        } else {
          newVal.add(song.key);
        }
        if (newVal.size === 0) {
          return null;
        }
        if (newVal.size === 1) {
          return [...newVal.values()][0];
        }
        return newVal;
      } else if (prev === null) {
        return prev;
      } else {
        return new Set([prev, song.key]);
      }
    });
  } else {
    set(songDetailState, song.key);
  }
}

// This is a helper to shift-click for song details
export function SongDetailContextMenuClick(cbInterface: CallbackInterface) {
  return (item: Song, index?: number, ev?: Event): void => {
    const shift = Type.has(ev, 'shiftKey') && ev.shiftKey === true;
    SongDetailClick(cbInterface, item, shift);
  };
}

export default function SongDetailPanel(): JSX.Element {
  const [detailSong, setDetailSong] = useRecoilState(songDetailState);
  const songInfo = useRecoilValue(maybeGetDataForSongState(detailSong));
  let elem;
  let header = '';
  if (detailSong === null) {
    elem = <div />;
    header = 'No file selected';
  } else if (!Type.isSetOfString(detailSong)) {
    elem = <MediaInfoTable keyOrKeys={detailSong} />;
    header = `Details for ${songInfo!.title}`;
  } else {
    elem = <MediaInfoTable keyOrKeys={[...detailSong]} />;
    header = `Details for ${detailSong.size} songs`;
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
