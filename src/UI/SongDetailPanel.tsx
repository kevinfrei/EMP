import { Panel, PanelType } from '@fluentui/react';
import { MakeError, Song, Type } from '@freik/core-utils';
import { CallbackInterface, useRecoilCallback, useRecoilValue } from 'recoil';
import { songDetailState } from '../Recoil/Local';
import { maybeGetDataForSongState } from '../Recoil/ReadOnly';
import MediaInfoTable from './MediaInfo';
import { Spinner } from './Utilities';

const err = MakeError('SongDetailPanel-err');

export function SongDetailClick(
  { set }: CallbackInterface,
  song: Song,
  shift?: boolean,
): void {
  set(songDetailState, (prev) => {
    err(prev);
    const vals = new Set(shift ? prev : []);
    if (shift && prev.has(song.key)) {
      vals.delete(song.key);
    } else {
      vals.add(song.key);
    }
    return vals;
  });
}

// This is a helper to shift-click for song details
export function SongDetailContextMenuClick(cbInterface: CallbackInterface) {
  return (item: Song, index?: number, ev?: Event): void => {
    const shift = Type.has(ev, 'shiftKey') && ev.shiftKey === true;
    SongDetailClick(cbInterface, item, shift);
  };
}

export default function SongDetailPanel(): JSX.Element {
  const detailSongs = useRecoilValue(songDetailState);
  const songInfo = useRecoilValue(maybeGetDataForSongState([...detailSongs]));
  const dismissClick = useRecoilCallback(({ reset }) => () =>
    reset(songDetailState),
  );
  let elem;
  let header = '';
  if (detailSongs.size === 0) {
    elem = <div />;
    header = 'No file selected';
  } else if (detailSongs.size === 1) {
    elem = <MediaInfoTable keyOrKeys={[...detailSongs][0]} />;
    header = `Details for ${songInfo!.title}`;
  } else {
    elem = <MediaInfoTable keyOrKeys={[...detailSongs]} />;
    header = `Details for ${detailSongs.size} songs:${[...detailSongs].join(
      ';',
    )}`;
  }

  return (
    <Panel
      isOpen={detailSongs.size !== 0}
      type={PanelType.medium}
      onDismiss={dismissClick}
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
