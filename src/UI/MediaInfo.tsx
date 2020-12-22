import {
  DetailsList,
  IColumn,
  Image,
  ImageFit,
  SelectionMode,
  Stack,
  TextField,
} from '@fluentui/react';
import { SongKey } from '@freik/core-utils';
import { useRecoilValue } from 'recoil';
import { InvokeMain } from '../MyWindow';
import {
  getAlbumByKeyState,
  getArtistStringState,
  getMediaInfoState,
  getSongByKeyState,
} from '../Recoil/ReadOnly';
import { divGrand, fractionalSecondsStrToHMS } from '../Tools';
import { MetadataEditor } from './MetadataEditor';
import { altRowRenderer } from './SongList';
import './styles/MediaInfo.css';
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
  const mediaInfo = useRecoilValue(getMediaInfoState(forSong));
  const theSong = useRecoilValue(getSongByKeyState(forSong));
  const theArtist = useRecoilValue(getArtistStringState(theSong.artistIds));
  const moreArtists = useRecoilValue(
    getArtistStringState(theSong.secondaryIds),
  );
  const theAlbum = useRecoilValue(getAlbumByKeyState(theSong.albumId));
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
      minWidth: 25,
      className: 'md-field',
      isResizable: true,
    },
    {
      key: '1',
      name: 'Value',
      fieldName: '1',
      minWidth: 100,
      isResizable: true,
    },
  ];
  return (
    <Stack>
      <TextField
        readOnly
        prefix="File Path"
        value={thePath}
        styles={{ field: { direction: 'rtl' } }}
        onDoubleClick={() => InvokeMain('show-file', thePath)}
      />
      <br />
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          prefix="Duration:"
          readOnly
          value={duration}
          style={{ width: '80px' }}
        />
        <TextField
          prefix={fileType.toLocaleUpperCase() + ':'}
          readOnly
          value={`${bitrate} (${bps} bit ${sampleRate} ${channels})`}
          style={{ width: '308px' }}
        />
      </Stack>
      <MetadataEditor
        fullPath={thePath}
        forSong={forSong}
        artist={theArtist}
        album={theAlbum.title}
        track={theSong.track.toString()}
        title={theSong.title}
        year={theAlbum.year > 0 ? theAlbum.year.toString() : ''}
        va={theAlbum.vatype}
        moreArtists={moreArtists}
        variations={theSong.variations ? theSong.variations.join('; ') : ''}
      />
      <Image
        alt="Album Cover"
        src={`pic://album/${theSong.albumId}`}
        imageFit={ImageFit.centerContain}
        height={350}
      />
      <Expandable label="Raw Metadata" separator>
        <DetailsList
          items={[...mediaInfo.entries()]}
          selectionMode={SelectionMode.none}
          columns={columns}
          compact
          onRenderRow={altRowRenderer()}
        />
      </Expandable>
    </Stack>
  );
}
