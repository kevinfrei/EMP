import { Panel, PanelType } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { songDetailAtom } from '../Recoil/Local';
import MediaInfoTable from './MediaInfo';

export default function SongDetailPanel(): JSX.Element {
  const [detailSong, setDetailSong] = useRecoilState(songDetailAtom);

  const elem =
    detailSong === null ? <div /> : <MediaInfoTable forSong={detailSong.key} />;
  const header = detailSong === null ? '' : `Metadata for ${detailSong.title}`;

  return (
    <Panel
      isOpen={detailSong !== null}
      type={PanelType.medium}
      onDismiss={() => setDetailSong(null)}
      headerText={header}
      isBlocking={false}
      closeButtonAriaLabel="Close"
    >
      <React.Suspense fallback="Loading...">{elem}</React.Suspense>
    </Panel>
  );
}
