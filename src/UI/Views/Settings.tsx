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
import { useRecoilState } from 'recoil';
import { locationsAtom, sortWithArticlesAtom } from '../../Recoil/ReadWrite';
import { ShowOpenDialog } from '../../Tools';
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
  const [articles, setArticles] = useRecoilState(sortWithArticlesAtom);
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
        label="Only show artists with full albums (NYI)"
        checked={onlyAlbumArtists}
        onChange={(ev, checked?: boolean) => setOnlyAlbumArtists(!!checked)}
      />
      <SpinButton
        label="Only show artists with at least this many songs (NYI)"
        disabled={onlyAlbumArtists}
        value={songCount.toString()}
        onIncrement={() => setSongCount(Math.min(100, songCount + 1))}
        onDecrement={() => setSongCount(Math.max(0, songCount - 1))}
        style={{ width: '10px' }}
      />
    </>
  );
}

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
        <Separator alignContent="start" />
        <div>
          <Text variant="mediumPlus">Album &amp; Artist Artwork</Text>
        </div>
        <div>
          <Text>Download Album Art?</Text>
        </div>
        <div>
          <Text>Download Artist Art?</Text>
        </div>
        <div>
          <Text>Try to save with album, first?</Text>
        </div>
        <div>
          <Text>-&gt;Filename</Text>
        </div>
        <div>
          <Text>Cache artist pix</Text>
        </div>
        <div>
          <Text>Cache album pix</Text>
        </div>
        <div>
          <Text>Flush Images</Text>
        </div>
        <div>
          <Text>Flush database</Text>
        </div>
        <div>
          <Text>Flush Metadata cache</Text>
        </div>
        <div>
          <Text>Clear local overrides</Text>
        </div>
      </Stack>
    </div>
  );
}
