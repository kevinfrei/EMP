import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
import { Util } from '@freik/elect-render-utils';
import { Expandable, StateToggle, useBoolState } from '@freik/web-utils';
import React, { useState } from 'react';
import { SetterOrUpdater } from 'recoil';
import './styles/Tools.css';

const targetFormats: IDropdownOption[] = [
  { key: 'm4a', text: 'm4a' },
  { key: 'aac', text: 'aac (raw mp4/m4a)' },
  { key: 'mp3', text: 'mp3' },
];

export function ToolsView(): JSX.Element {
  const copyArtworkState = useBoolState(true);
  const mirrorState = useBoolState(true);
  const [srcLoc, setSrcLoc] = useState('');
  const [dstLoc, setDstLoc] = useState('');
  const [err, setError] = useState('');
  const [targetFormat, setTargetFormat] = useState<IDropdownOption>(
    targetFormats[0],
  );
  const xcodeStatus = 'Nothing to see here...';
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
  return (
    <Stack className="tools-view">
      <Expandable separator label="Transcoder: NYI" defaultShow>
        <Text variant="mediumPlus">
          Mirror audio files from one directory into another directory, with
          configurable 'sampling' settings.
        </Text>
        <br />
        <br />
        <Stack horizontal>
          <StateToggle label="Copy artwork" state={copyArtworkState} />
          <span style={{ width: 15 }} />
          <StateToggle
            label="Mirror Source. WARNING! This will delete files from the mirror target!"
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
          <Dropdown
            label="Target format"
            selectedKey={targetFormat.key}
            onChange={(ev, item?: IDropdownOption) =>
              item && setTargetFormat(item)
            }
            options={targetFormats}
          />
          <DefaultButton
            text="Transcode"
            disabled={srcLoc.length === 0 || dstLoc.length === 0}
            onClick={() =>
              alert(
                `${srcLoc} => ${dstLoc} as ${targetFormat.key} ${
                  copyArtworkState[0] ? 'copy artwork' : ''
                } ${mirrorState[0] ? 'mirror' : ''}`,
              )
            }
          />
        </Stack>
        <Expandable label="Transcoding status">
          <Stack>
            <Text>{xcodeStatus}</Text>
            <Text>
              X Directories scanned, Y Directories waiting to be scanned
            </Text>
            <Text>X Files removed from dest</Text>
            <Text>Z Folders removed from dest</Text>
            <Text>X Files pending from transcoding</Text>
            <Text>X Files completed</Text>
            <Text>N Files untouched</Text>
            <Text>Transcoding status: incomplete</Text>
            <Expandable label="transcoding errors">
              <Stack>
                <Text>File name 1</Text>
                <Text>File name 2</Text>
              </Stack>
            </Expandable>
          </Stack>
        </Expandable>
      </Expandable>
      <Stack>{err}</Stack>
    </Stack>
  );
}
