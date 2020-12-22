import { Panel, PanelType } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { useRecoilState } from 'recoil';
import { songDetailState } from '../Recoil/Local';
import MediaInfoTable from './MediaInfo';
import { Spinner } from './Utilities';

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
