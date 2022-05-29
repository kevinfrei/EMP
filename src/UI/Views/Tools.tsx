import { DefaultButton, Stack, Text, TextField } from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { Util } from '@freik/elect-render-utils';
import { PostMain } from '@freik/elect-render-utils/lib/esm/ipc';
import { Expandable, StateToggle, useBoolState } from '@freik/web-utils';
import { useState } from 'react';
import { SetterOrUpdater } from 'recoil';
import { IpcId } from 'shared';
import { TranscodeStatus } from '../TranscodeStatus';
import './styles/Tools.css';

/*
const targetFormats: IDropdownOption[] = [
  { key: 'm4a', text: 'm4a' },
  { key: 'aac', text: 'aac (raw mp4/m4a)' },
  { key: 'mp3', text: 'mp3' },
];
*/

export function ToolsView(): JSX.Element {
  const copyArtworkState = useBoolState(true);
  const mirrorState = useBoolState(true);
  const [srcLoc, setSrcLoc] = useState('');
  const [dstLoc, setDstLoc] = useState('');
  const [err, setError] = useState('');
  // const [targetFormat, setTargetFormat] = useState<IDropdownOption>(targetFormats[0]);
  // const xcodeStatus = <TranscodeSummary />;
  const getDir = (setter: SetterOrUpdater<string>) => {
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
          <StateToggle label="Copy artwork (NYI) " state={copyArtworkState} />
          <span style={{ width: 25 }} />
          <StateToggle
            label="Mirror Source: WARNING- This may delete files! (NYI)"
            state={mirrorState}
          />
        </Stack>
        <TextField
          label="Source"
          value={srcLoc}
          readOnly
          required
          onClick={() => getDir(setSrcLoc)}
          iconProps={{ iconName: 'More' }}
        />
        <TextField
          label="Destination"
          value={dstLoc}
          readOnly
          required
          onClick={() => getDir(setDstLoc)}
          iconProps={{ iconName: 'More' }}
        />
        <br />
        <Stack horizontal horizontalAlign="space-between">
          <div />
          <DefaultButton
            text="Transcode"
            disabled={srcLoc.length === 0 || dstLoc.length === 0}
            onClick={() => {
              void PostMain(IpcId.TranscodingBegin.toString(), {
                source: srcLoc,
                dest: dstLoc,
                artwork: copyArtworkState[0],
                mirror: mirrorState[0],
                format: 'm4a',
                bitrate: 144 * 1024,
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
