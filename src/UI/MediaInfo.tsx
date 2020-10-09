import { Text } from '@fluentui/react';
import { SongKey } from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { getMediaInfo } from '../Recoil/ReadOnly';

export default function MediaInfoTable({
  forSong,
}: {
  forSong: SongKey;
}): JSX.Element {
  const mediaInfo = useRecoilValue(getMediaInfo(forSong));
  return (
    <table>
      <tbody>
        {[...mediaInfo.entries()].map(([key, value]) => (
          <tr key={key}>
            <td>
              <Text style={{ fontWeight: 600 }}>{key}</Text>
            </td>
            <td colSpan={3}>
              <Text>{value}</Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
