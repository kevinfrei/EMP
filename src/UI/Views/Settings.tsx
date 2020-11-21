import {
  DefaultButton,
  IconButton,
  Label,
  SpinButton,
  Stack,
  TextField,
  TooltipHost,
} from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilState } from 'recoil';
import { InvokeMain, ShowOpenDialog } from '../../MyWindow';
import { useBoolRecoilState } from '../../Recoil/helpers';
import {
  albumCoverNameAtom,
  downloadAlbumArtworkAtom,
  downloadArtistArtworkAtom,
  ignoreArticlesAtom,
  locationsAtom,
  minSongCountForArtistListAtom,
  saveAlbumArtworkWithMusicAtom,
  showArtistsWithFullAlbumsAtom,
} from '../../Recoil/ReadWrite';
import { Expandable, StateToggle } from '../Utilities';
import './styles/Settings.css';

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
        &nbsp;
        <TooltipHost
          id="RescanLocationsHelp"
          content="Necessary if you moved files around since launching the app"
        >
          <DefaultButton
            text="Rescan Locations"
            onClick={() => InvokeMain('manual-rescan')}
          />
        </TooltipHost>
      </Stack>
    </>
  );
}

function ArticleSorting(): JSX.Element {
  const articles = useBoolRecoilState(ignoreArticlesAtom);
  return <StateToggle label="Ignore articles when sorting" state={articles} />;
}

function ArtistFiltering(): JSX.Element {
  const onlyAlbumArtists = useBoolRecoilState(showArtistsWithFullAlbumsAtom);
  const [songCount, setSongCount] = useRecoilState(
    minSongCountForArtistListAtom,
  );
  return (
    <>
      <StateToggle
        label="Only show artists with full albums"
        state={onlyAlbumArtists}
      />
      <SpinButton
        label="Only show artists with at least this many songs"
        disabled={onlyAlbumArtists[0]}
        value={songCount.toString()}
        onIncrement={() => setSongCount(Math.min(100, songCount + 1))}
        onDecrement={() => setSongCount(Math.max(1, songCount - 1))}
        style={{ width: '10px' }}
      />
    </>
  );
}

function ArtworkSettings(): JSX.Element {
  const dlAlbumArtwork = useBoolRecoilState(downloadAlbumArtworkAtom);
  const dlArtistArtwork = useBoolRecoilState(downloadArtistArtworkAtom);
  const saveAlbumArtwork = useBoolRecoilState(saveAlbumArtworkWithMusicAtom);
  const [coverArtName, setCoverArtName] = useRecoilState(albumCoverNameAtom);
  return (
    <>
      <StateToggle label="Download Album Artwork" state={dlAlbumArtwork} />
      <Stack horizontal>
        <StateToggle
          disabled={!dlAlbumArtwork[0]}
          label="Try to save Album Artwork with audio files:"
          state={saveAlbumArtwork}
        />
        &nbsp;
        <TextField
          disabled={!saveAlbumArtwork[0] || !dlAlbumArtwork[0]}
          description="Filename to save the artwork as"
          value={coverArtName}
          onChange={(ev, nv) => nv && setCoverArtName(nv)}
        />
      </Stack>
      <StateToggle
        label="NYI: Download Artist Artwork"
        state={dlArtistArtwork}
        disabled
      />
      <DefaultButton
        text="Flush Image Cache"
        style={{ width: '185px', gridRow: 4 }}
        onClick={() => InvokeMain('flush-image-cache')}
      />
    </>
  );
}

function MetadataDatabase(): JSX.Element {
  return (
    <Stack horizontal>
      <DefaultButton text="Flush Metadata Cache" style={{ width: '185px' }} />
      &nbsp;
      <DefaultButton text="Clear Local Overrides" style={{ width: '185px' }} />
    </Stack>
  );
}

export default function Settings(): JSX.Element {
  return (
    <Stack className="settings-view">
      <Expandable separator label="Music Locations" defaultShow={true}>
        <RecoilLocations />
      </Expandable>
      <Expandable separator label="Sorting & Filtering">
        <ArticleSorting />
        <ArtistFiltering />
      </Expandable>
      <Expandable separator label="NYI: Artwork">
        <ArtworkSettings />
      </Expandable>
      <Expandable separator label="NYI: Metadata">
        <MetadataDatabase />
      </Expandable>
    </Stack>
  );
}
