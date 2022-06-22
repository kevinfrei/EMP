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
  sourceLocationState,
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
  { key: 'playlist', text: 'Playlist' },
  { key: 'artist', text: 'Artist' },
  { key: 'album', text: 'Album' },
  { key: 'dir', text: 'Disk location' },
];

function indexFromKey(key: string): number {
  switch (key) {
    case 'playlist':
      return 1;
    case 'artist':
      return 2;
    case 'album':
      return 3;
    case 'dir':
    default:
      return 0;
  }
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
  const [srcLocType, setSrcLocType] = useState<string>('playlist');
  const [srcLoc, setSrcLoc] = useRecoilState(sourceLocationState);
  const [dstLoc, setDstLoc] = useRecoilState(destLocationState);
  const [err, setError] = useState('');
  const bitrate = useRecoilValue(xcodeBitRateState);
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
      if (Type.isString(option)) setSrcLocType(option);
    },
    [],
  );

  // TODO: Create the element for the transcode source type (and populated it, if appropriate)
  let xcodeSrcLocElem = (
    <TextField
      value={srcLoc[indexFromKey(srcLocType)]}
      readOnly
      required
      onClick={() => {}}
      iconProps={{ iconName: 'More' }}
    />
  );
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
          filter={(val) => {
            const numericValue = parseInt(val.trim(), 10);
            return isNaN(numericValue) ? undefined : numericValue;
          }}
          format={(val) => `${val} Kbps`}
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
          disabled={srcLoc.length === 0 || dstLoc.length === 0}
          onClick={() => {
            void PostMain(IpcId.TranscodingBegin.toString(), {
              source: srcLoc,
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
