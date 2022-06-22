import {
  ChoiceGroup,
  DefaultButton,
  IChoiceGroupOption,
  IChoiceGroupStyles,
  Label,
  SpinButton,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { Util } from '@freik/elect-render-utils';
import { PostMain } from '@freik/elect-render-utils/lib/esm/ipc';
import { Expandable, StateToggle, useBoolState } from '@freik/web-utils';
import { SyntheticEvent, useCallback, useState } from 'react';
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
} from '../../Recoil/TranscodeState';
import { TranscodeStatus } from '../TranscodeStatus';
import './styles/Tools.css';

/*
const targetFormats: IDropdownOption[] = [
  { key: 'm4a', text: 'm4a' },
  { key: 'aac', text: 'aac (raw mp4/m4a)' },
  { key: 'mp3', text: 'mp3' },
];
*/

const sourceOptions: IChoiceGroupOption[] = [
  { key: 'dir', text: 'Disk location' },
  { key: 'album', text: 'Album' },
  { key: 'artist', text: 'Artist' },
  { key: 'playlist', text: 'Playlist' },
];

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
  const [srcLoc, setSrcLoc] = useRecoilState(sourceLocationState);
  const [dstLoc, setDstLoc] = useRecoilState(destLocationState);
  const [err, setError] = useState('');
  const bitrate = useRecoilValue(xcodeBitRateState);
  const max = 256;
  const min = 64;
  const step = 4;
  const suffix = 'Kbps';
  // const [targetFormat, setTargetFormat] = useState<IDropdownOption>(targetFormats[0]);
  // const xcodeStatus = <TranscodeSummary />;

  const getNumericPart = (value: string): number | undefined => {
    const valueRegex = /^(\d+).*/;
    if (valueRegex.test(value)) {
      const numericValue = Number(value.replace(valueRegex, '$1'));
      return isNaN(numericValue) ? undefined : numericValue;
    }
    return undefined;
  };

  /** Increment the value (or return nothing to keep the previous value if invalid) */
  const onIncrement = (value: string): string | void => {
    const numericValue = getNumericPart(value);
    if (numericValue !== undefined) {
      return String(Math.min(numericValue + step, max)) + suffix;
    }
  };

  /** Decrement the value (or return nothing to keep the previous value if invalid) */
  const onDecrement = (value: string): string | void => {
    const numericValue = getNumericPart(value);
    if (numericValue !== undefined) {
      return String(Math.max(numericValue - step, min)) + suffix;
    }
  };

  /**
   * Clamp the value within the valid range (or return nothing to keep the previous value
   * if there's not valid numeric input)
   */
  const onValidate = (value: string): string | void => {
    let numericValue = getNumericPart(value);
    if (numericValue !== undefined) {
      numericValue = Math.min(numericValue, max);
      numericValue = Math.max(numericValue, min);
      return String(numericValue) + suffix;
    }
  };

  const onChange = useRecoilCallback(
    ({ set }) =>
      (event: SyntheticEvent<HTMLElement>, newValue?: string) => {
        const numVal = Type.isUndefined(newValue)
          ? newValue
          : getNumericPart(newValue);
        if (!Type.isUndefined(numVal)) {
          set(xcodeBitRateState, numVal);
        }
      },
  );

  const [selectedKey, setSelectedKey] = useState<string | undefined>('dir');

  const onChangeSourceOption = useCallback(
    (
      ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
      option?: IChoiceGroupOption,
    ) => {
      if (!Type.isUndefined(option)) setSelectedKey(option.key);
    },
    [],
  );

  // Still fighting this :/
  const customStyles: Partial<IChoiceGroupStyles> = {
    flexContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'flex-start',
    },
    root: { width: '90%', display: 'flex', flexDirection: 'row' },
    label: {
      flexGrow: '1',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'monospace',
    },
  };
  // To get cover-art, see this page:
  // https://stackoverflow.com/questions/17798709/ffmpeg-how-to-embed-cover-art-image-to-m4a
  return (
    <Stack className="tools-view">
      <Expandable separator label="Transcoder" defaultShow>
        <Text variant="mediumPlus">
          Mirror audio files from one directory into another directory, with
          configurable 'sampling' settings.
        </Text>
        <br />
        <br />
        <Stack horizontal>
          <StateToggle label="Copy artwork (NYI) " state={copyArtwork} />
          <span style={{ width: 25 }} />
          <StateToggle
            label="Mirror Source: WARNING- This may delete files! (NYI)"
            state={mirror}
          />
        </Stack>
        <Stack horizontal>
          <Label>Howdy:&nbsp;</Label>
          <ChoiceGroup
            selectedKey={selectedKey}
            options={sourceOptions}
            onChange={onChangeSourceOption}
            styles={customStyles}
            // label="Source to transcode:"
          />
        </Stack>
        <TextField
          label="Source"
          value={srcLoc}
          readOnly
          required
          onClick={() => getDir(setSrcLoc, setError)}
          iconProps={{ iconName: 'More' }}
        />
        <TextField
          label="Destination"
          value={dstLoc}
          readOnly
          required
          onClick={() => getDir(setDstLoc, setError)}
          iconProps={{ iconName: 'More' }}
        />
        <br />
        <Stack horizontal horizontalAlign="space-between">
          <SpinButton
            label="Target Bit Rate"
            value={`${bitrate} Kbps`}
            onChange={onChange}
            onValidate={onValidate}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            style={{ width: 120 }}
          />
          <div />
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
        </Stack>
        <Stack>{err}</Stack>
        <TranscodeStatus />
      </Expandable>
    </Stack>
  );
}

export function ToolsView(): JSX.Element {
  return (
    <Stack className="tools-view">
      <Expandable separator label="Transcoder" defaultShow>
        <TranscoderConfiguration />
      </Expandable>
    </Stack>
  );
}
