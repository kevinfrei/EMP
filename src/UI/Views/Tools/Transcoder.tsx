import {
  DefaultButton,
  Dropdown,
  IComboBoxOption,
  IDropdownOption,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { Util } from '@freik/elect-render-utils';
import { PostMain } from '@freik/elect-render-utils/lib/esm/ipc';
import { StateToggle, useBoolState } from '@freik/web-utils';
import { useCallback, useState } from 'react';
import {
  SetterOrUpdater,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { IpcId } from 'shared';
import {
  destLocationState,
  sourceLocationAlbumState,
  sourceLocationArtistState,
  sourceLocationDescriptorState,
  sourceLocationDirState,
  sourceLocationPlaylistState,
  sourceLocationTypeState,
  validSourceState,
  xcodeBitRateState,
} from '../../../Recoil/TranscodeState';
import { StringSpinButton } from '../../Utilities';
import '../styles/Tools.css';
import { TranscodeStatus } from './TranscodeStatus';

/*
const targetFormats: IDropdownOption[] = [
  { key: 'm4a', text: 'm4a' },
  { key: 'aac', text: 'aac (raw mp4/m4a)' },
  { key: 'mp3', text: 'mp3' },
];
*/

const sourceOptions: IComboBoxOption[] = [
  { key: 'p', text: 'Playlist' },
  { key: 'r', text: 'Artist' },
  { key: 'l', text: 'Album' },
  { key: 'd', text: 'Disk location' },
];

function isValidSourceLocType(val: unknown): val is 'p' | 'r' | 'l' | 'd' {
  return (
    Type.isString(val) &&
    (val === 'p' || val === 'r' || val === 'l' || val === 'd')
  );
}

const getDir = (
  setter: SetterOrUpdater<string>,
  setError: SetterOrUpdater<string>,
) => {
  Util.ShowOpenDialog({ properties: ['openDirectory'] })
    .then((val) => {
      if (Type.isArrayOfString(val) && val.length === 1) {
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
  const [srcPlaylistLoc, setSrcPlaylistLoc] = useRecoilState(
    sourceLocationPlaylistState,
  );
  const [srcArtistLoc, setSrcArtistLoc] = useRecoilState(
    sourceLocationArtistState,
  );
  const [srcAlbumLoc, setSrcAlbumLoc] = useRecoilState(
    sourceLocationAlbumState,
  );
  const [dstLoc, setDstLoc] = useRecoilState(destLocationState);
  const [err, setError] = useState('');
  const bitrate = useRecoilValue(xcodeBitRateState);
  const validSource = useRecoilValue(validSourceState);
  const srcLocDescr = useRecoilValue(sourceLocationDescriptorState);
  // const [targetFormat, setTargetFormat] = useState<IDropdownOption>(targetFormats[0]);
  // const xcodeStatus = <TranscodeSummary />;

  const onChange = useRecoilCallback(({ set }) => (numVal?: number) => {
    if (!Type.isUndefined(numVal)) {
      set(xcodeBitRateState, numVal);
    }
  });

  const onSelectSource = useCallback(
    (
      event: React.FormEvent<HTMLDivElement>,
      option?: IDropdownOption,
    ): void => {
      if (!Type.isUndefined(option) && isValidSourceLocType(option.key)) {
        setSrcLocType(option.key);
      }
    },
    [],
  );

  // TODO: Create the element for the transcode source type (and populated it, if appropriate)
  let xcodeSrcLocElem;
  switch (srcLocType) {
    case 'p':
      xcodeSrcLocElem = (
        <TextField
          value={srcPlaylistLoc}
          onChange={(ev, newValue: string | undefined) => {
            if (Type.isString(newValue)) {
              setSrcPlaylistLoc(newValue);
            }
          }}
        />
      );
      break;
    case 'r':
      xcodeSrcLocElem = (
        <TextField
          value={srcArtistLoc}
          onChange={(ev, newValue: string | undefined) => {
            if (Type.isString(newValue)) {
              setSrcArtistLoc(newValue);
            }
          }}
        />
      );
      break;
    case 'l':
      xcodeSrcLocElem = (
        <TextField
          value={srcAlbumLoc}
          onChange={(ev, newValue: string | undefined) => {
            if (Type.isString(newValue)) {
              setSrcAlbumLoc(newValue);
            }
          }}
        />
      );
      break;
    case 'd':
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
          label={'Mirror Source WARNING: May delete files! (NYI)'}
          state={mirror}
        />
        <DefaultButton
          text="Transcode"
          disabled={!validSource || dstLoc.length === 0}
          onClick={() => {
            void PostMain(IpcId.TranscodingBegin.toString(), {
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
      <Stack>{err}</Stack>
      <TranscodeStatus />
    </>
  );
}
