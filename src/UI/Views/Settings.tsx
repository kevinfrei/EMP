import {
  DefaultButton,
  Dropdown,
  IconButton,
  IDropdownOption,
  Label,
  SpinButton,
  Text,
  TextField,
  TooltipHost,
} from '@fluentui/react';
import { Type } from '@freik/core-utils';
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
import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { IgnoreItemType, IpcId, Keys, st, StrId } from 'shared';
import { AddIgnoreItem, RemoveIgnoreItem } from '../../ipc';
import { neverPlayHatesState, onlyPlayLikesState } from '../../Recoil/Likes';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  ignoreItemsState,
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
        <span key={elem} className="music-loc">
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
        </span>
      ))}
      <div>
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
          /* onClick={() => {}} */
          iconProps={{ iconName: 'DownloadDocument' }}
          title={st(StrId.ImportFiles)}
        />
      </div>
      <Text>{`${artists.size} Artists, ${albums.size} Albums, ${songs.size} Songs`}</Text>
    </>
  );
}

const ignoreTypeNameMap = new Map<IgnoreItemType, string>([
  ['path-root', 'Root Path'],
  ['dir-name', 'Directory Name'],
  ['path-keyword', 'Keyword'],
]);

const ignoreOptions: IDropdownOption[] = [...ignoreTypeNameMap.entries()].map(
  ([key, text]) => ({ key, text }),
);

function IgnoreList(): JSX.Element {
  const ignoreItems = useRecoilValue(ignoreItemsState);
  const [newType, setNewType] = useState<IgnoreItemType | ''>('');
  const [newValue, setNewValue] = useState<string>('');
  return (
    <div id="ignore-list">
      {ignoreItems.map(({ type, value }, idx) => (
        <div key={idx} style={{ display: 'contents' }}>
          <span style={{ gridRow: idx + 1 }} className="ignore-type">
            {ignoreTypeNameMap.get(type) || 'ERROR!'}:
          </span>
          <span style={{ gridRow: idx + 1 }} className="ignore-value">
            <TextField readOnly value={value} />
          </span>
          <span style={{ gridRow: idx + 1 }} className="ignore-button">
            <IconButton
              onClick={() => {
                RemoveIgnoreItem({ type, value });
              }}
              iconProps={{ iconName: 'Delete' }}
            />
          </span>
        </div>
      ))}
      <span style={{ gridRow: ignoreItems.length + 1 }} className="ignore-type">
        <Dropdown
          selectedKey={newType}
          onChange={(ev: unknown, option?: IDropdownOption) => {
            if (!Type.isUndefined(option) && option.key !== '') {
              setNewType(option.key as IgnoreItemType);
            }
          }}
          options={ignoreOptions}
          dropdownWidth={125}
        />
      </span>
      <span
        style={{ gridRow: ignoreItems.length + 1 }}
        className="ignore-value"
      >
        <TextField
          value={newValue}
          onChange={(ev: unknown, value?: string) => {
            if (!Type.isUndefined(value)) {
              setNewValue(value);
            }
          }}
        />
      </span>
      <span
        style={{ gridRow: ignoreItems.length + 1 }}
        className="ignore-button"
      >
        <IconButton
          onClick={() => {
            if ('type'.indexOf('t') === 'value'.indexOf('a')) {
              AddIgnoreItem({ type: 'path-root', value: '/myPathRoot' });
            }
          }}
          iconProps={{ iconName: 'Add' }}
          disabled={newValue.length === 0}
        />
      </span>
    </div>
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
      <div className="artwork-settings">
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
      </div>
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
    <>
      <DefaultButton text="Flush Metadata Cache" style={{ width: '185px' }} />
      &nbsp;
      <DefaultButton text="Clear Local Overrides" style={{ width: '185px' }} />
    </>
  );
}

export function SettingsView(): JSX.Element {
  return (
    <div className="settings-view">
      <Expandable separator label="Music Locations" defaultShow={true}>
        <Spinner>
          <MusicLocations />
        </Spinner>
        <IgnoreList />
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
    </div>
  );
}
