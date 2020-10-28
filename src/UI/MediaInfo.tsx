import { IconButton, Stack, Text, TextField } from '@fluentui/react';
import { SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { getMediaInfo } from '../Recoil/ReadOnly';
import { secondsToHMS, toKbps, toKhz } from '../Tools';

const fileTypeMap = new Map([
  ['FLAC', 'flac'],
  ['MPEG 1 Layer 3', 'mp3'],
  ['MPEG-4/AAC', 'aac'],
]);

function getType(codec: string | void): string {
  if (codec) {
    const res = fileTypeMap.get(codec);
    if (res) return res;
  }
  return '???';
}

function channelDescr(noc: string | void): string {
  if (noc === '1') return 'Mono';
  if (noc === '2') return 'Stereo';
  if (noc === '4') return 'Quadrophonic';
  return `${noc ? noc : '?'} channels`;
}

function getBitRate(br: string | void): string {
  return br ? toKbps(br) : '?? kbps';
}

function getSampleRate(sr: string | void): string {
  return sr ? toKhz(sr) : '?? kHz';
}

export default function MediaInfoTable({
  forSong,
}: {
  forSong: SongKey;
}): JSX.Element {
  const [rawHidden, setRawHidden] = useState(true);
  const mediaInfo = useRecoilValue(getMediaInfo(forSong));
  const thePath = mediaInfo.get('File Path') || '';
  const artist = mediaInfo.get('full.artist') || '';
  const album = mediaInfo.get('full.album') || '';
  const track = mediaInfo.get('full.track') || '';
  const title = mediaInfo.get('full.title') || '';
  const year = mediaInfo.get('full.year') || '';
  const fileType = getType(mediaInfo.get('format.codec'));
  const duration = secondsToHMS(mediaInfo.get('format.duration') || '0');
  const sampleRate = getSampleRate(mediaInfo.get('format.sampleRate'));
  const channels = channelDescr(mediaInfo.get('format.numberOfChannels'));
  const bitrate = getBitRate(mediaInfo.get('format.bitrate'));
  return (
    <div>
      <Stack>
        <TextField label="Artist" value={artist} />
        <TextField label="Album" value={album} />
        <Stack horizontal>
          <TextField label="Track #" value={track} />
          <span style={{ width: '30px' }} />
          <TextField label="Year" value={year} />
        </Stack>
        <TextField label="Title" value={title} />
        <br />
        <TextField label="File Path" underlined readOnly value={thePath} />
        <Stack horizontal>
          <TextField
            label="Duration"
            underlined
            readOnly
            value={duration}
            style={{ width: '70px' }}
          />
          <TextField
            label="Format:"
            underlined
            readOnly
            value={`${bitrate} ${fileType} ${sampleRate} ${channels}`}
            style={{ width: '310px' }}
          />
        </Stack>
      </Stack>
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
