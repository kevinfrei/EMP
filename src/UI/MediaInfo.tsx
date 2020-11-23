import {
  DetailsList,
  IColumn,
  SelectionMode,
  Stack,
  TextField,
} from '@fluentui/react';
import { SongKey } from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { InvokeMain } from '../MyWindow';
import {
  albumByKeySel,
  artistStringSel,
  getMediaInfo,
  songByKeySel,
} from '../Recoil/ReadOnly';
import { divGrand, fractionalSecondsStrToHMS } from '../Tools';
import { MetadataEditor } from './MetadataEditor';
import { Expandable } from './Utilities';

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
  const mediaInfo = useRecoilValue(getMediaInfo(forSong));
  const theSong = useRecoilValue(songByKeySel(forSong));
  const theArtist = useRecoilValue(artistStringSel(theSong.artistIds));
  const theAlbum = useRecoilValue(albumByKeySel(theSong.albumId));
  const thePath = mediaInfo.get('File Path') || '';
  const fileType = getType(mediaInfo.get('format.codec'));
  const duration = fractionalSecondsStrToHMS(
    mediaInfo.get('format.duration') || '0',
  );
  const sampleRate = getSampleRate(mediaInfo.get('format.sampleRate'));
  const bps = mediaInfo.get('format.bitsPerSample') || '16';
  const channels = channelDescr(mediaInfo.get('format.numberOfChannels'));
  const bitrate = getBitRate(mediaInfo.get('format.bitrate'));
  const columns: IColumn[] = [
    {
      key: '0',
      name: 'Field',
      fieldName: '0',
      minWidth: 75,
      className: 'md-field',
    },
    { key: '1', name: 'Value', fieldName: '1', minWidth: 100 },
  ];
  return (
    <Stack>
      <MetadataEditor
        forSong={forSong}
        artist={theArtist}
        album={theAlbum.title}
        track={theSong.track.toString()}
        title={theSong.title}
        year={theAlbum.year > 0 ? theAlbum.year.toString() : ''}
        va={theAlbum.vatype}
      />
      <Expandable label="File Details" separator>
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
      </Expandable>
      <Expandable label="Raw Metadata" separator>
        <DetailsList
          items={[...mediaInfo.entries()]}
          selectionMode={SelectionMode.none}
          columns={columns}
          compact
        />
      </Expandable>
    </Stack>
  );
}
