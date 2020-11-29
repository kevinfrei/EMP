import { Panel, PanelType } from '@fluentui/react';
import { useRecoilState } from 'recoil';
import { songDetailState } from '../Recoil/Local';
import MediaInfoTable from './MediaInfo';
import { Spinner } from './Utilities';

export default function SongDetailPanel(): JSX.Element {
  const [detailSong, setDetailSong] = useRecoilState(songDetailState);

  const elem =
    detailSong === null ? <div /> : <MediaInfoTable forSong={detailSong.key} />;
  const header = detailSong === null ? '' : `Details for ${detailSong.title}`;

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
