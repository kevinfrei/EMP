// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilValue } from 'recoil';
import { MediaInfo, SongKey } from '../DataSchema';
import { getMediaInfo } from '../Recoil/ReadOnly';

function mediaInfoToLine(keyPrefix: string, strs: Map<string, string>) {
  const lines: JSX.Element[] = [];
  strs.forEach((val, key) =>
    lines.push(
      <tr key={keyPrefix + key}>
        <td>{key}</td>
        <td colSpan={3}>{val}</td>
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
          <td>General</td>
        </tr>
      </thead>
      <tbody>{genLines}</tbody>
      <thead>
        <tr>
          <td>Audio</td>
        </tr>
      </thead>
      <tbody>{audLines}</tbody>
    </table>
  );
}
