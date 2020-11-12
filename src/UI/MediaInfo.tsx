import { Checkbox, IconButton, Stack, Text, TextField } from '@fluentui/react';
import { Type } from '@freik/core-utils';
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
  const [artist, setArtist] = useState(mediaInfo.get('full.artist') || '');
  const [album, setAlbum] = useState(mediaInfo.get('full.album') || '');
  const [track, setTrack] = useState(mediaInfo.get('full.track') || '');
  const [title, setTitle] = useState(mediaInfo.get('full.title') || '');
  const [year, setYear] = useState(mediaInfo.get('full.year') || '');
  const fileType = getType(mediaInfo.get('format.codec'));
  const duration = secondsToHMS(mediaInfo.get('format.duration') || '0');
  const sampleRate = getSampleRate(mediaInfo.get('format.sampleRate'));
  const bps = mediaInfo.get('format.bitsPerSample') || '';
  const channels = channelDescr(mediaInfo.get('format.numberOfChannels'));
  const bitrate = getBitRate(mediaInfo.get('format.bitrate'));
  const [vaType, setVaType] = useState(mediaInfo.get('full.vaType') || '');
  const isVa = vaType === 'va';
  const isOST = vaType === 'ost';
  const setVa = () => setVaType(isVa ? '' : 'va');
  const setOST = () => setVaType(isOST ? '' : 'ost');
  const isNumber = (val: string | undefined) => {
    if (Type.isString(val)) {
      const num = Number.parseInt(val, 10);
      return num.toString() === val.trim() && val.trim() !== 'NaN';
    }
    return false;
  };
  return (
    <div>
      <Stack>
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
            value={`${bitrate} ${fileType} ${sampleRate} ${channels} ${bps}bps`}
            style={{ width: '310px' }}
          />
        </Stack>
        <TextField
          label="Artist"
          value={artist}
          onChange={(e, nv) => nv && setArtist(nv)}
        />
        <TextField
          label="Album"
          value={album}
          onChange={(e, nv) => nv && setAlbum(nv)}
        />
        <Stack horizontal>
          <TextField
            label="Track #"
            value={track}
            onChange={(e, nv) => nv && isNumber(nv) && setTrack(nv)}
          />
          <span style={{ width: '30px' }} />
          <TextField
            label="Year"
            value={year}
            onChange={(e, nv) => nv && isNumber(nv) && setYear(nv)}
          />
          <span style={{ width: '30px' }} />
          <Stack verticalAlign="center">
            <span style={{ height: '16px' }} />
            <Checkbox label="Compilation" checked={isVa} onChange={setVa} />
            <span style={{ height: '5px' }} />
            <Checkbox label="Soundtrack" checked={isOST} onChange={setOST} />
          </Stack>
        </Stack>
        <TextField
          label="Title"
          value={title}
          onChange={(e, nv) => nv && setTitle(nv)}
        />
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
