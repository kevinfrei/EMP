import { Text } from '@fluentui/react';
import { MediaInfo, SongKey } from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { getMediaInfo } from '../Recoil/ReadOnly';

function mediaInfoToLine(keyPrefix: string, strs: Map<string, string>) {
  const lines: JSX.Element[] = [];
  strs.forEach((val, key) =>
    lines.push(
      <tr key={keyPrefix + key}>
        <td>
          <Text style={{ fontWeight: 600 }}>{key}</Text>
        </td>
        <td colSpan={3}>
          <Text>{val}</Text>
        </td>
      </tr>,
    ),
  );
  return lines;
}

export default function MediaInfoTable({
  forSong,
}: {
  forSong: SongKey;
}): JSX.Element {
  const mediaInfo: MediaInfo = useRecoilValue(getMediaInfo(forSong));
  const genLines = mediaInfoToLine('gen', mediaInfo.general);
  const audLines = mediaInfoToLine('aud', mediaInfo.audio);
  return (
    <table>
      <thead>
        <tr>
          <td>
            <Text variant="large">&nbsp;General</Text>
          </td>
        </tr>
      </thead>
      <tbody>{genLines}</tbody>
      <thead>
        <tr>
          <td>
            <Text variant="large">&nbsp;Audio</Text>
          </td>
        </tr>
      </thead>
      <tbody>{audLines}</tbody>
    </table>
  );
}
