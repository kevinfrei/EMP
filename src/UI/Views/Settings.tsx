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
import { Ipc, Util } from '@freik/elect-render-utils';
import {
  Catch,
  Expandable,
  MyTransactionInterface,
  Spinner,
  StateToggle,
  useBoolRecoilState,
  useMyTransaction,
} from '@freik/web-utils';
import { useRecoilState, useRecoilValue } from 'recoil';
import { IpcId, Keys, st, StrId } from 'shared';
import { neverPlayHatesState, onlyPlayLikesState } from '../../Recoil/Likes';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
} from '../../Recoil/ReadOnly';
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
import { GetHelperText } from '../Utilities';
import './styles/Settings.css';

const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

async function GetDirs(): Promise<string[] | void> {
  return await Util.ShowOpenDialog({ properties: ['openDirectory'] });
}

export async function addLocation({
  set,
}: MyTransactionInterface): Promise<boolean> {
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
  const onAddLocation = useMyTransaction((xact) => () => {
    addLocation(xact).catch(Catch);
  });
  const songs = useRecoilValue(allSongsFunc);
  const albums = useRecoilValue(allAlbumsFunc);
  const artists = useRecoilValue(allArtistsFunc);
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
            <Text variant="small">[Default "Save" Location (NYI)]</Text>
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
          title={GetHelperText(Keys.AddFileLocation)}
        />
        &nbsp;
        <TooltipHost
          id="RescanLocationsHelp"
          content="Necessary if you moved files around since launching the app"
        >
          <DefaultButton
            text="Rescan Locations"
            iconProps={{ iconName: 'SearchData' }}
            onClick={() => void Ipc.InvokeMain(IpcId.ManualRescan)}
          />
        </TooltipHost>
        &nbsp;
        <DefaultButton
          text="Import Files (NYI)"
          onClick={() => {}}
          iconProps={{ iconName: 'DownloadDocument' }}
          title={st(StrId.ImportFiles)}
        />
      </Stack>
      <Text>{`${artists.size} Artists, ${albums.size} Albums, ${songs.size} Songs`}</Text>
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
          onChange={(_ev, nv) => nv && setCoverArtName(nv)}
        />
      </Stack>
      <StateToggle label="Download Artist Artwork" state={dlArtistArtwork} />
      <DefaultButton
        text="Flush Image Cache"
        style={{ width: '185px', gridRow: 4 }}
        onClick={() => void Ipc.InvokeMain(IpcId.FlushImageCache)}
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

export function SettingsView(): JSX.Element {
  return (
    <Stack className="settings-view">
      <Expandable separator label="Music Locations" defaultShow={true}>
        <Spinner>
          <MusicLocations />
        </Spinner>
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
