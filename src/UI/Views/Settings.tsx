import {
  DefaultButton,
  Dropdown,
  IconButton,
  IDropdownOption,
  Label,
  Separator,
  Stack,
  Text,
  Toggle,
} from '@fluentui/react';
import { Logger } from '@freik/core-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { RecoilState } from 'recoil';
import { useBackedState } from '../../Recoil/helpers';
import {
  albumListSortAtom,
  artistListSortAtom,
  locationsAtom,
  songListSortAtom,
  sortWithArticlesAtom,
} from '../../Recoil/ReadWrite';
import { ShowOpenDialog } from '../../Tools';
import { ViewProps } from './Selector';
import './styles/Settings.css';

const log = Logger.bind('View-Settings');
// Logger.enable('View-Settings');

declare type PopupItem = {
  title: string;
  atom: RecoilState<string>;
  options: IDropdownOption[];
};

const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs(): string[] | void {
  return ShowOpenDialog({ properties: ['openDirectory'] });
}

function SortPopup({ data }: { data: PopupItem }): JSX.Element {
  const [value, setter] = useBackedState(data.atom);
  const onChange = (
    event: React.FormEvent<HTMLDivElement>,
    item?: IDropdownOption,
  ): void => {
    if (item) setter(item.key.toString());
  };
  return (
    <Dropdown
      label={`View ${data.title} by`}
      options={data.options}
      // eslint-disable-next-line id-blacklist
      selectedKey={value ? value : undefined}
      onChange={onChange}
    />
  );
}

function RecoilLocations(): JSX.Element {
  const [newLoc, setNewLoc] = useBackedState<string[]>(locationsAtom);
  log(`Locations (${locationsAtom.key}) value at render:`);
  log(newLoc);
  return (
    <>
      {(newLoc || []).map((elem) => (
        <Stack horizontal key={elem}>
          <IconButton
            onClick={() => setNewLoc(removeFromSet(newLoc, elem))}
            iconProps={{ iconName: 'Delete' }}
          />
          <Label>{elem}</Label>
        </Stack>
      ))}
      <Stack horizontal>
        <DefaultButton
          text="Add Location"
          onClick={() => {
            const locs: string[] | void = GetDirs();
            if (locs) {
              setNewLoc([...locs, ...(newLoc || [])]);
            }
          }}
          iconProps={{ iconName: 'Add' }}
        />
      </Stack>
    </>
  );
}

function ArticleSorting(): JSX.Element {
  const [articles, setArticles] = useBackedState(sortWithArticlesAtom);
  log('Articles: ' + (articles ? 'true' : 'false'));
  function onChange(ev: React.MouseEvent<HTMLElement>, checked?: boolean) {
    setArticles(checked ? true : false);
  }
  return (
    <Toggle
      label="Consider articles when sorting"
      checked={articles}
      inlineLabel
      onText="On"
      offText="Off"
      onChange={onChange}
    />
  );
}

export default function Settings({ hidden }: ViewProps): JSX.Element {
  const album = {
    title: 'Album',
    atom: albumListSortAtom,
    options: [
      { key: 'lt', text: 'Title' },
      { key: 'ly', text: 'Year' },
      { key: 'rl', text: 'Artist, then Title' },
      { key: 'ry', text: 'Artist, then Year' },
    ],
  };
  const artist = {
    title: 'Artist',
    atom: artistListSortAtom,
    options: [
      { key: 'q', text: '# of Albums' },
      { key: 'r', text: 'Name' },
      { key: 's', text: '# of Songs' },
    ],
  };
  const song = {
    title: 'Song',
    atom: songListSortAtom,
    options: [
      { key: 't', text: 'Title' },
      { key: 'rl', text: 'Artist, then Album' },
      { key: 'lt', text: 'Album' },
    ],
  };

  return (
    <div
      className="current-view"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <Stack className="settings-view">
        <Separator alignContent="start">
          <Text variant="mediumPlus">Music Locations</Text>
        </Separator>
        <RecoilLocations />
        <Separator alignContent="start">
          <Text variant="mediumPlus">Sorting Preferences</Text>
        </Separator>
        <SortPopup data={album} />
        <SortPopup data={artist} />
        <SortPopup data={song} />
        <ArticleSorting />
      </Stack>
    </div>
  );
}
