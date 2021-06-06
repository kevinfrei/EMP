import {
  DetailsList,
  IColumn,
  SelectionMode,
  Stack,
  TextField,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-core';
import { useRecoilValue } from 'recoil';
import { InvokeMain } from '../../MyWindow';
import {
  getAlbumByKeyFamily,
  getArtistStringFamily,
  getCommonDataFamily,
  getMediaInfoFamily,
  getSongByKeyFamily,
} from '../../Recoil/ReadOnly';
import { divGrand, fractionalSecondsStrToHMS } from '../../Tools';
import { altRowRenderer } from './../SongList';
import { Expandable } from './../Utilities';
import { SimpleSongsList } from './../Views/MixedSongs';
import { MetadataEditor } from './MetadataEditor';
import './styles/MediaInfo.css';

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
  const mediaInfo = useRecoilValue(getMediaInfoFamily(forSong));

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
          style={{ width: '75px' }}
        />
        <TextField
          prefix={fileType.toLocaleUpperCase() + ':'}
          readOnly
          value={`${bitrate} (${bps} bit ${sampleRate} ${channels})`}
          style={{ width: '280px' }}
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

  const mediaInfo = useRecoilValue(getMediaInfoFamily(songKey));
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
  const theSong = useRecoilValue(getSongByKeyFamily(songKey));
  const theArtist = useRecoilValue(getArtistStringFamily(theSong.artistIds));
  const moreArtists = useRecoilValue(
    getArtistStringFamily(theSong.secondaryIds),
  );
  const theAlbum = useRecoilValue(getAlbumByKeyFamily(theSong.albumId));
  const diskNum = Math.floor(theSong.track / 100);
  const diskName =
    diskNum > 0 &&
    Type.isArray(theAlbum.diskNames) &&
    theAlbum.diskNames.length >= diskNum
      ? theAlbum.diskNames[diskNum - 1]
      : '';
  return (
    <MetadataEditor
      forSong={songKey}
      artist={theArtist}
      album={theAlbum.title}
      track={theSong.track.toString()}
      title={theSong.title}
      year={theAlbum.year > 0 ? theAlbum.year.toString() : ''}
      va={theAlbum.vatype}
      diskName={diskName}
      moreArtists={moreArtists}
      variations={theSong.variations ? theSong.variations.join('; ') : ''}
      albumId={theSong.albumId}
    />
  );
}

function MultiFileEditor({ songKeys }: { songKeys: SongKey[] }): JSX.Element {
  const allTheInfos = useRecoilValue(getCommonDataFamily(songKeys));
  return <MetadataEditor forSongs={songKeys} {...allTheInfos} />;
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
    <SimpleSongsList forSongs={keyOrKeys} />
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
