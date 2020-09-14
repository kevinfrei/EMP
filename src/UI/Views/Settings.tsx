// eslint-disable-next-line @typescript-eslint/no-use-before-define
import * as React from 'react';
import { useRecoilState } from 'recoil';
import { Logger } from '@freik/core-utils';
import {
  Toggle,
  Dropdown,
  IDropdownOption,
  Stack,
  DefaultButton,
  Label,
  IconButton,
  Separator,
  Text,
} from '@fluentui/react';

import {
  sortWithArticles,
  albumListSort,
  artistListSort,
  songListSort,
  syncedLocations,
} from '../../Recoil/SettingsAtoms';
import { VerticalScrollDiv } from '../Scrollables';
import { ShowOpenDialog } from '../../MyWindow';

import type { SyncedAtom } from '../../Recoil/Atoms';

import './styles/Settings.css';

const log = Logger.bind('View-Settings');
// Logger.enable('View-Settings');

declare type PopupItem = {
  title: string;
  syncedAtom: SyncedAtom<string>;
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
  const [value, setter] = useRecoilState(data.syncedAtom.atom);
  const onChange = (
    event: React.FormEvent<HTMLDivElement>,
    item?: IDropdownOption,
  ): void => {
    if (item) setter(item.key.toString());
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SyncingElement: () => JSX.Element = data.syncedAtom.atomSyncer;
  return (
    <>
      <SyncingElement />
      <Dropdown
        label={`View ${data.title} by`}
        options={data.options}
        // eslint-disable-next-line id-blacklist
        selectedKey={value ? value : undefined}
        onChange={onChange}
      />
    </>
  );
}

function RecoilLocations(): JSX.Element {
  const [newLoc, setNewLoc] = useRecoilState(syncedLocations.atom);
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
  const [articles, setArticles] = useRecoilState(sortWithArticles.atom);
  log('Articles: ' + (articles ? 'true' : 'false'));
  function onChange(ev: React.MouseEvent<HTMLElement>, checked?: boolean) {
    setArticles(checked ? true : false);
  }
  return (
    <>
      <sortWithArticles.atomSyncer />
      <Toggle
        label="Consider articles when sorting"
        checked={articles}
        inlineLabel
        onText="On"
        offText="Off"
        onChange={onChange}
      />
    </>
  );
}

export default function Settings(): JSX.Element {
  const album = {
    title: 'Album',
    syncedAtom: albumListSort,
    options: [
      { key: 'AlbumTitle', text: 'Title' },
      { key: 'AlbumYear', text: 'Year' },
      { key: 'ArtistAlbum', text: 'Artist, then Title' },
      { key: 'ArtistYear', text: 'Artist, then Year' },
    ],
  };
  const artist = {
    title: 'Artist',
    syncedAtom: artistListSort,
    options: [
      { key: 'AlbumCount', text: '# of Albums' },
      { key: 'ArtistName', text: 'Name' },
      { key: 'SongCount', text: '# of Songs' },
    ],
  };
  const song = {
    title: 'Song',
    syncedAtom: songListSort,
    options: [
      { key: 'SongTitle', text: 'Title' },
      { key: 'ArtistAlbum', text: 'Artist, then Album' },
      { key: 'AlbumTrack', text: 'Album' },
    ],
  };

  return (
    <>
      <div id="current-view" />
      <VerticalScrollDiv scrollId="settingsPos" layoutId="current-view">
        <Stack>
          <Separator alignContent="start">
            <Text variant="mediumPlus">Music Locations</Text>
          </Separator>
          <syncedLocations.atomSyncer />
          <RecoilLocations />
          <Separator alignContent="start">
            <Text variant="mediumPlus">Sorting Preferences</Text>
          </Separator>
          <SortPopup data={album} />
          <SortPopup data={artist} />
          <SortPopup data={song} />
          <ArticleSorting />
        </Stack>
      </VerticalScrollDiv>
    </>
  );
}
