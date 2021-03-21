import {
  DefaultButton,
  IconButton,
  Label,
  SpinButton,
  Stack,
  Text,
  TextField,
  TooltipHost,
} from '@fluentui/react';
import { CallbackInterface, useRecoilCallback, useRecoilState } from 'recoil';
import { InvokeMain, ShowOpenDialog } from '../../MyWindow';
import { useBoolRecoilState } from '../../Recoil/helpers';
import { neverPlayHatesState, onlyPlayLikesState } from '../../Recoil/Likes';
import {
  albumCoverNameState,
  defaultLocationState,
  downloadAlbumArtworkState,
  downloadArtistArtworkState,
  ignoreArticlesState,
  locationsState,
  minSongCountForArtistListState,
  saveAlbumArtworkWithMusicState,
  showArtistsWithFullAlbumsState,
} from '../../Recoil/ReadWrite';
import { Expandable, StateToggle } from '../Utilities';
import './styles/Settings.css';

const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

async function GetDirs(): Promise<string[] | void> {
  return await ShowOpenDialog({ properties: ['openDirectory'] });
}

export async function addLocation({
  set,
}: CallbackInterface): Promise<boolean> {
  const locs = await GetDirs();
  if (locs) {
    set(locationsState, (curLocs) => [...locs, ...curLocs]);
    return true;
  }
  return false;
}

function MusicLocations(): JSX.Element {
  const [newLoc, setNewLoc] = useRecoilState(locationsState);
  const [defLoc, setDefLoc] = useRecoilState(defaultLocationState);
  const onAddLocation = useRecoilCallback((cbInterface) => async () => {
    await addLocation(cbInterface);
  });
  const setSaveStyle = {
    textContainer: { fontSize: 11 },
    root: { height: 22, padding: 5, minWidth: 45 },
    flexContainer: {
      flexDirection: 'row-reverse',
      justifyContent: 'center',
      alignItems: 'center',
    },
  };
  return (
    <>
      {(newLoc || []).map((elem) => (
        <Stack horizontal key={elem} verticalAlign="center">
          <IconButton
            onClick={() => setNewLoc(removeFromSet(newLoc, elem))}
            iconProps={{ iconName: 'Delete' }}
          />
          <Label>{elem}</Label>&nbsp;
          {defLoc === elem ? (
            <Text variant="small">[NYI: Save Location]</Text>
          ) : (
            <DefaultButton
              styles={setSaveStyle}
              iconProps={{ iconName: 'Save' }}
              onClick={() => setDefLoc(elem)}
              text="NYI: Set as"
            />
          )}
        </Stack>
      ))}
      <Stack horizontal>
        <DefaultButton
          text="Add Location"
          onClick={onAddLocation}
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
  const articles = useBoolRecoilState(ignoreArticlesState);
  return <StateToggle label="Ignore articles when sorting" state={articles} />;
}

function ArtistFiltering(): JSX.Element {
  const onlyAlbumArtists = useBoolRecoilState(showArtistsWithFullAlbumsState);
  const [songCount, setSongCount] = useRecoilState(
    minSongCountForArtistListState,
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

function LikeFiltering(): JSX.Element {
  const neverPlayHates = useBoolRecoilState(neverPlayHatesState);
  const onlyPlayLikes = useBoolRecoilState(onlyPlayLikesState);
  return (
    <>
      <StateToggle
        label="Never queue up songs you dislike"
        state={neverPlayHates}
      />
      <StateToggle label="Only queue up songs you like" state={onlyPlayLikes} />
    </>
  );
}

function ArtworkSettings(): JSX.Element {
  const dlAlbumArtwork = useBoolRecoilState(downloadAlbumArtworkState);
  const dlArtistArtwork = useBoolRecoilState(downloadArtistArtworkState);
  const saveAlbumArtwork = useBoolRecoilState(saveAlbumArtworkWithMusicState);
  const [coverArtName, setCoverArtName] = useRecoilState(albumCoverNameState);
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
        <MusicLocations />
      </Expandable>
      <Expandable separator label="Sorting & Filtering" defaultShow={true}>
        <LikeFiltering />
        <ArticleSorting />
        <ArtistFiltering />
      </Expandable>
      <Expandable separator label="Artwork" defaultShow={true}>
        <ArtworkSettings />
      </Expandable>
      <Expandable separator label="NYI: Metadata">
        <MetadataDatabase />
      </Expandable>
    </Stack>
  );
}
