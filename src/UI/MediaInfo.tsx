import {
  Checkbox,
  IconButton,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { MakeLogger, Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { InvokeMain } from '../MyWindow';
import { getMediaInfo } from '../Recoil/ReadOnly';
import { divGrand, secondsToHMS } from '../Tools';

const log = MakeLogger('MediaInfo', true);

function MetadataEditor(props: {
  artist?: string;
  album?: string;
  track?: string;
  title?: string;
  year?: string;
  va?: 'va' | 'ost';
}): JSX.Element {
  const [vaType, setVaType] = useState<false | string>(false);
  const isVa = vaType === 'va';
  const isOST = vaType === 'ost';
  const [artist, setArtist] = useState<false | string>(false);
  const [album, setAlbum] = useState<false | string>(false);
  const [track, setTrack] = useState<false | string>(false);
  const [title, setTitle] = useState<false | string>(false);
  const [year, setYear] = useState<false | string>(false);
  const setVa = () => setVaType(isVa ? '' : 'va');
  const setOST = () => setVaType(isOST ? '' : 'ost');
  const isNumber = (val: string | undefined) => {
    if (Type.isString(val)) {
      const num = Number.parseInt(val, 10);
      return num.toString() === val.trim() && val.trim() !== 'NaN';
    }
    return false;
  };

  const onSubmit = () => {
    log('onSubmit!');
    log(artist);
    log(album);
    log(track);
    log(title);
    log(vaType);
    log(year);
  };
  return (
    <>
      <TextField
        label="Artist"
        defaultValue={props.artist || ''}
        value={artist !== false ? artist : props.artist || ''}
        onChange={(e, nv) => nv && setArtist(nv)}
      />
      <TextField
        label="Album"
        value={album !== false ? album : props.album || ''}
        onChange={(e, nv) => nv && setAlbum(nv)}
      />
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          label="Year"
          value={year !== false ? year : props.year || ''}
          onChange={(e, nv) => nv && isNumber(nv) && setYear(nv)}
          style={{ width: 100 }}
        />
        <TextField
          label="Track #"
          value={track !== false ? track : props.track || ''}
          onChange={(e, nv) => nv && isNumber(nv) && setTrack(nv)}
          style={{ width: 100 }}
        />
        <TextField label="Disk #" value="0" style={{ width: 100 }} />
        <Stack verticalAlign="space-between" style={{ marginRight: 20 }}>
          <div style={{ height: 10 }} />
          <Checkbox label="Compilation" checked={isVa} onChange={setVa} />
          <Checkbox label="Soundtrack" checked={isOST} onChange={setOST} />
        </Stack>
      </Stack>
      <TextField
        label="Title"
        value={title !== false ? title : props.title || ''}
        onChange={(e, nv) => nv && setTitle(nv)}
      />
      <PrimaryButton onClick={onSubmit}>Save</PrimaryButton>
    </>
  );
}
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
  if (noc === '1') return 'mono';
  if (noc === '2') return 'stereo';
  if (noc === '4') return 'quadrophonic';
  return `${noc ? noc : '?'} channels`;
}

function getBitRate(br: string | void): string {
  return `${br ? divGrand(br) : '??'}Kbps`;
}

function getSampleRate(sr: string | void): string {
  return `${sr ? divGrand(sr) : '??'}KHz`;
}

export default function MediaInfoTable({
  forSong,
}: {
  forSong: SongKey;
}): JSX.Element {
  const [rawHidden, setRawHidden] = useState(true);
  const mediaInfo = useRecoilValue(getMediaInfo(forSong));
  const thePath = mediaInfo.get('File Path') || '';
  const fileType = getType(mediaInfo.get('format.codec'));
  const duration = secondsToHMS(mediaInfo.get('format.duration') || '0');
  const sampleRate = getSampleRate(mediaInfo.get('format.sampleRate'));
  const bps = mediaInfo.get('format.bitsPerSample') || '16';
  const channels = channelDescr(mediaInfo.get('format.numberOfChannels'));
  const bitrate = getBitRate(mediaInfo.get('format.bitrate'));
  return (
    <div>
      <Stack>
        <TextField
          label="File"
          underlined
          readOnly
          value={thePath}
          onDoubleClick={() => InvokeMain('show-file', thePath)}
        />
        <Stack horizontal horizontalAlign="space-between">
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
            value={`${bitrate} ${fileType} ${sampleRate} ${channels} ${bps} bit depth`}
            style={{ width: '310px' }}
          />
        </Stack>
        <MetadataEditor
          artist={mediaInfo.get('full.artist')}
          album={mediaInfo.get('full.album')}
          track={mediaInfo.get('full.track')}
          title={mediaInfo.get('full.title')}
          year={mediaInfo.get('full.year')}
        />
      </Stack>
      <Stack horizontal verticalAlign="center" style={{ marginTop: 10 }}>
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
