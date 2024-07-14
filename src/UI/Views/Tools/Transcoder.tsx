import {
  DefaultButton,
  Dropdown,
  IComboBoxOption,
  IDropdownOption,
  Text,
  TextField,
} from '@fluentui/react';
import { Ipc, Util } from '@freik/electron-render';
import { IpcId, TranscodeSource, isTranscodeSource } from '@freik/emp-shared';
import { isArrayOfString, isDefined } from '@freik/typechk';
import { StateToggle, useBoolState } from '@freik/web-utils';
import { useState } from 'react';
import {
  SetterOrUpdater,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import {
  destLocationState,
  sourceLocationAlbumState,
  sourceLocationArtistState,
  sourceLocationDescriptorFunc,
  sourceLocationDirState,
  sourceLocationPlaylistState,
  sourceLocationTypeState,
  validSourceFunc,
  xcodeBitRateState,
} from '../../../Recoil/TranscodeState';
import { StringSpinButton } from '../../Utilities';
import '../styles/Tools.css';
import {
  AlbumSelector,
  ArtistSelector,
  PlaylistSelector,
} from './SourceSelectors';
import { TranscodeStatus } from './TranscodeStatus';

/*
const targetFormats: IDropdownOption[] = [
  { key: 'm4a', text: 'm4a' },
  { key: 'aac', text: 'aac (raw mp4/m4a)' },
  { key: 'mp3', text: 'mp3' },
];
*/

const sourceOptions: IComboBoxOption[] = [
  { key: TranscodeSource.Playlist, text: 'Playlist' },
  { key: TranscodeSource.Artist, text: 'Artist' },
  { key: TranscodeSource.Album, text: 'Album' },
  { key: TranscodeSource.Disk, text: 'Disk location' },
];

const getDir = (
  setter: SetterOrUpdater<string>,
  setError: SetterOrUpdater<string>,
) => {
  Util.ShowOpenDialog({ properties: ['openDirectory'] })
    .then((val) => {
      if (isArrayOfString(val) && val.length === 1) {
        setter(val[0]);
      }
    })
    .catch(() => {
      setError('Failed to find a dir');
    });
};

export function TranscoderConfiguration(): JSX.Element {
  const copyArtwork = useBoolState(false);
  const mirror = useBoolState(false);
  const [srcLocType, setSrcLocType] = useRecoilState(sourceLocationTypeState);
  const [srcDirLoc, setSrcDirLoc] = useRecoilState(sourceLocationDirState);
  const [dstLoc, setDstLoc] = useRecoilState(destLocationState);
  const [err, setError] = useState('');
  const bitrate = useRecoilValue(xcodeBitRateState);
  const validSource = useRecoilValue(validSourceFunc);
  const srcLocDescr = useRecoilValue(sourceLocationDescriptorFunc);
  // const [targetFormat, setTargetFormat] = useState<IDropdownOption>(targetFormats[0]);
  // const xcodeStatus = <TranscodeSummary />;

  const onChange = useRecoilCallback(({ set }) => (numVal?: number) => {
    if (isDefined(numVal)) {
      set(xcodeBitRateState, numVal);
    }
  });

  const onSelectSource = (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption,
  ): void => {
    if (isDefined(option) && isTranscodeSource(option.key)) {
      setSrcLocType(option.key);
    }
  };

  // TODO: Create the element for the transcode source type (and populated it, if appropriate)
  let xcodeSrcLocElem;
  switch (srcLocType) {
    case TranscodeSource.Playlist:
      xcodeSrcLocElem = (
        <PlaylistSelector value={sourceLocationPlaylistState} />
      );
      break;
    case TranscodeSource.Artist:
      xcodeSrcLocElem = <ArtistSelector value={sourceLocationArtistState} />;
      break;
    case TranscodeSource.Album:
      xcodeSrcLocElem = <AlbumSelector value={sourceLocationAlbumState} />;
      break;
    case TranscodeSource.Disk:
    default:
      xcodeSrcLocElem = (
        <TextField
          value={srcDirLoc}
          readOnly
          required
          onClick={() => {
            getDir(setSrcDirLoc, setError);
          }}
          iconProps={{ iconName: 'More' }}
        />
      );
      break;
  }
  // To get cover-art, see this page:
  // https://stackoverflow.com/questions/17798709/ffmpeg-how-to-embed-cover-art-image-to-m4a
  return (
    <>
      <Text variant="mediumPlus">
        Transcode (downsample) audio files into a particular directory.
      </Text>
      <br />
      <div id="xcode-source-area">
        <Dropdown
          label="Music Source"
          selectedKey={srcLocType}
          onChange={onSelectSource}
          options={sourceOptions}
        />
        {xcodeSrcLocElem}
      </div>
      <TextField
        label="Destination"
        value={dstLoc}
        readOnly
        required
        onClick={() => getDir(setDstLoc, setError)}
        iconProps={{ iconName: 'More' }}
      />
      <br />
      <div id="xcode-options">
        <StringSpinButton
          label="Target Bit Rate"
          value={bitrate}
          filter={(val: string) => {
            const numericValue = parseInt(val.trim(), 10);
            return isNaN(numericValue) ? undefined : numericValue;
          }}
          format={(val: number) => `${val} Kbps`}
          onChange={onChange}
          min={64}
          max={320}
          step={4}
        />
        <StateToggle label="Copy artwork (NYI) " state={copyArtwork} />
        <StateToggle
          label={'Mirror Source WARNING: May delete files!'}
          state={mirror}
        />
        <DefaultButton
          text="Transcode"
          disabled={!validSource || dstLoc.length === 0}
          onClick={() => {
            void Ipc.PostMain(IpcId.TranscodingBegin.toString(), {
              source: srcLocDescr,
              dest: dstLoc,
              artwork: copyArtwork[0],
              mirror: mirror[0],
              format: 'm4a',
              bitrate: bitrate * 1024,
            });
          }}
        />
      </div>
      <div>{err}</div>
      <TranscodeStatus />
    </>
  );
}
