import { IconButton, Stack, Text } from '@fluentui/react';
import { SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { getMediaInfo } from '../Recoil/ReadOnly';

export default function MediaInfoTable({
  forSong,
}: {
  forSong: SongKey;
}): JSX.Element {
  const [rawHidden, setRawHidden] = useState(true);
  const mediaInfo = useRecoilValue(getMediaInfo(forSong));
  return (
    <div>
      <Stack horizontal verticalAlign="center">
        <IconButton
          iconProps={{
            iconName: rawHidden ? 'ChevronRight' : 'ChevronDown',
          }}
          onClick={() => setRawHidden(!rawHidden)}
        />
        <Text>Raw Metadata</Text>
      </Stack>
      <table style={rawHidden ? { display: 'none' } : {}}>
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
    </div>
  );
}
