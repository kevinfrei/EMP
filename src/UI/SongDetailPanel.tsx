import { Panel, PanelType } from '@fluentui/react';
import { MakeError } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { songDetailAtom } from '../Recoil/Local';
import MediaInfoTable from './MediaInfo';
import { Spin } from './Utilities';

const err = MakeError('SongDetailPanel-err');

export default function SongDetailPanel(): JSX.Element {
  const [detailSong, setDetailSong] = useRecoilState(songDetailAtom);

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
      <Spin label="Loading...">{elem}</Spin>
    </Panel>
  );
}
