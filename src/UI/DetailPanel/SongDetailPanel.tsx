import { Panel, PanelType } from '@fluentui/react';
import { MakeError } from '@freik/core-utils';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { songDetailState } from '../../Recoil/Local';
import { maybeGetDataForSongState } from '../../Recoil/ReadOnly';
import { Spinner } from './../Utilities';
import MediaInfoTable from './MediaInfo';

const err = MakeError('SongDetailPanel-err'); // eslint-disable-line

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
    header = `Details for ${detailSongs.size} songs`;
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
