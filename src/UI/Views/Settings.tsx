import {
  DefaultButton,
  IconButton,
  Label,
  Separator,
  SpinButton,
  Stack,
  Text,
  Toggle,
} from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useBackedState } from '../../Recoil/helpers';
import { locationsAtom, sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { ShowOpenDialog } from '../../Tools';
import { ViewProps } from './Selector';
import './styles/Settings.css';

const log = MakeLogger('View-Settings');

/*
declare type PopupItem = {
  title: string;
  atom: RecoilState<string>;
  options: IDropdownOption[];
};
*/
const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs(): string[] | void {
  return ShowOpenDialog({ properties: ['openDirectory'] });
}

/*
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
*/

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
  return (
    <Toggle
      inlineLabel
      label="Consider articles when sorting"
      checked={articles}
      onChange={(ev, checked?: boolean) => setArticles(!!checked)}
    />
  );
}

function ArtistFiltering(): JSX.Element {
  const [onlyAlbumArtists, setOnlyAlbumArtists] = useState(false);
  const [songCount, setSongCount] = useState(0);
  return (
    <>
      <Toggle
        inlineLabel
        label="Only show artists with full albums"
        checked={onlyAlbumArtists}
        onChange={(ev, checked?: boolean) => setOnlyAlbumArtists(!!checked)}
      />
      <SpinButton
        label="Only show artists with at least this many songs"
        disabled={onlyAlbumArtists}
        value={songCount.toString()}
        onIncrement={() => setSongCount(Math.min(100, songCount + 1))}
        onDecrement={() => setSongCount(Math.max(0, songCount - 1))}
        style={{ width: '10px' }}
      />
    </>
  );
}

/*
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

*/

export default function Settings({ hidden }: ViewProps): JSX.Element {
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
          <Text variant="mediumPlus">Sorting &amp; Filtering</Text>
        </Separator>
        <ArticleSorting />
        <ArtistFiltering />
      </Stack>
    </div>
  );
  /*
        <SortPopup data={album} />
        <SortPopup data={artist} />
        <SortPopup data={song} />
  */
}
