import {
  DetailsList,
  IColumn,
  Image,
  ImageFit,
  SelectionMode,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { SongKey, Type } from '@freik/core-utils';
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

// This is the header for single-file editing
function MediaFormatDetails({ forSong }: { forSong: SongKey }): JSX.Element {
  const mediaInfo = useRecoilValue(getMediaInfoState(forSong));

  const fileType = getType(mediaInfo.get('format.codec'));
  const duration = fractionalSecondsStrToHMS(
    mediaInfo.get('format.duration') || '0',
  );
  const sampleRate = getSampleRate(mediaInfo.get('format.sampleRate'));
  const bps = mediaInfo.get('format.bitsPerSample') || '16';
  const channels = channelDescr(mediaInfo.get('format.numberOfChannels'));
  const bitrate = getBitRate(mediaInfo.get('format.bitrate'));
  const thePath = mediaInfo.get('File Path') || '';

  return (
    <>
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
    </>
  );
}
function RawMetadata({ songKey }: { songKey: SongKey }): JSX.Element {
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

  const mediaInfo = useRecoilValue(getMediaInfoState(songKey));
  return (
    <DetailsList
      items={[...mediaInfo.entries()]}
      selectionMode={SelectionMode.none}
      columns={columns}
      compact
      onRenderRow={altRowRenderer()}
    />
  );
}

function SingleFileEditor({ songKey }: { songKey: SongKey }): JSX.Element {
  const theSong = useRecoilValue(getSongByKeyState(songKey));
  const theArtist = useRecoilValue(getArtistStringState(theSong.artistIds));
  const moreArtists = useRecoilValue(
    getArtistStringState(theSong.secondaryIds),
  );
  const theAlbum = useRecoilValue(getAlbumByKeyState(theSong.albumId));

  return (
    <>
      <MetadataEditor
        forSong={songKey}
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
    </>
  );
}

function MultiFileEditor({ songKeys }: { songKeys: SongKey[] }): JSX.Element {
  return <Text>Not Yet Implemented</Text>;
}

export default function MediaInfoTable({
  keyOrKeys,
}: {
  keyOrKeys: SongKey | SongKey[];
}): JSX.Element {
  if (keyOrKeys.length === 0) {
    return <></>;
  }
  // Either Details or a Multi-editing header
  const theHeader = Type.isString(keyOrKeys) ? (
    <MediaFormatDetails forSong={keyOrKeys} />
  ) : (
    <Text variant="large">Multi-editing mode</Text>
  );

  // For single-song, the raw metadata in a table
  const theFooter = Type.isString(keyOrKeys) ? (
    <Expandable label="Raw Metadata" separator>
      <RawMetadata songKey={keyOrKeys} />
    </Expandable>
  ) : (
    <></>
  );
  const theEditor = Type.isString(keyOrKeys) ? (
    <SingleFileEditor songKey={keyOrKeys} />
  ) : (
    <MultiFileEditor songKeys={keyOrKeys} />
  );
  return (
    <Stack>
      {theHeader}
      {theEditor}
      {theFooter}
    </Stack>
  );
}
