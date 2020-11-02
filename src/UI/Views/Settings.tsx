import {
  DefaultButton,
  IconButton,
  Label,
  SpinButton,
  Stack,
  TextField,
} from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import React, { useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { useBoolRecoilState, useBoolState } from '../../Recoil/helpers';
import { locationsAtom, sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { ShowOpenDialog } from '../../Tools';
import { ExpandableSeparator, StateToggle } from '../Utilities';
import { ViewProps } from './Selector';
import './styles/Settings.css';

const log = MakeLogger('View-Settings');

const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs(): string[] | void {
  return ShowOpenDialog({ properties: ['openDirectory'] });
}

function RecoilLocations(): JSX.Element {
  const [newLoc, setNewLoc] = useRecoilState(locationsAtom);
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
  const articles = useBoolRecoilState(sortWithArticlesAtom);
  return (
    <StateToggle label="Consider articles when sorting" state={articles} />
  );
}

function ArtistFiltering(): JSX.Element {
  const onlyAlbumArtists = useBoolState(false);
  const [songCount, setSongCount] = useState(0);
  return (
    <>
      <StateToggle
        label="NYI: Only show artists with full albums"
        state={onlyAlbumArtists}
      />
      <SpinButton
        label="NYI: Only show artists with at least this many songs"
        disabled={onlyAlbumArtists[0]}
        value={songCount.toString()}
        onIncrement={() => setSongCount(Math.min(100, songCount + 1))}
        onDecrement={() => setSongCount(Math.max(0, songCount - 1))}
        style={{ width: '10px' }}
      />
    </>
  );
}

function ArtworkSettings(): JSX.Element {
  const dlAlbumArtwork = useBoolState(false);
  const saveAlbumArtwork = useBoolState(false);
  const dlArtistArtwork = useBoolState(false);
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          gridTemplateRows: 'auto',
        }}
      >
        <StateToggle
          label="Download Album Artwork"
          state={dlAlbumArtwork}
          style={{
            gridColumn: '1',
            gridRow: '1',
          }}
        />
        <StateToggle
          label="Download Artist Artwork"
          state={dlArtistArtwork}
          style={{
            gridColumn: '2',
            gridRow: '1',
          }}
        />
      </div>
      <Stack horizontal>
        <StateToggle
          disabled={!dlAlbumArtwork[0]}
          label="Try to save Album Artwork with audio files"
          state={saveAlbumArtwork}
        />
        &nbsp;
        <TextField
          disabled={!saveAlbumArtwork[0] || !dlAlbumArtwork[0]}
          placeholder="NYI: albumArt"
        />
      </Stack>
      <DefaultButton
        text="Flush Image Cache"
        style={{ width: '185px', gridRow: 4 }}
      />
    </>
  );
}

function MetadataDatabase(): JSX.Element {
  return (
    <Stack horizontal>
      <DefaultButton text="Flush Database" style={{ width: '185px' }} />
      &nbsp;
      <DefaultButton text="Flush Metadata Cache" style={{ width: '185px' }} />
      &nbsp;
      <DefaultButton text="Clear Local Overrides" style={{ width: '185px' }} />
    </Stack>
  );
}

export default function Settings({ hidden }: ViewProps): JSX.Element {
  const locVisibile = useBoolState(true);
  const sortVisible = useBoolState(false);
  const artVisible = useBoolState(false);
  const mdVisible = useBoolState(false);
  return (
    <div
      className="current-view"
      style={hidden ? { visibility: 'hidden' } : {}}
    >
      <Stack className="settings-view">
        <ExpandableSeparator label="Music Locations" state={locVisibile}>
          <RecoilLocations />
        </ExpandableSeparator>
        <ExpandableSeparator label="Sorting & Filtering" state={sortVisible}>
          <ArticleSorting />
          <ArtistFiltering />
        </ExpandableSeparator>
        <ExpandableSeparator label="NYI: Artwork" state={artVisible}>
          <ArtworkSettings />
        </ExpandableSeparator>
        <ExpandableSeparator label="NYI: Metadata" state={mdVisible}>
          <MetadataDatabase />
        </ExpandableSeparator>
      </Stack>
    </div>
  );
}
