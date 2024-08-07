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
import { Ipc, Util } from '@freik/electron-render';
import { IgnoreItemTypeEnum, IpcId, Keys, st, StrId } from '@freik/emp-shared';
import { isDefined } from '@freik/typechk';
import {
  Catch,
  Expandable,
  MyTransactionInterface,
  Spinner,
  StateToggle,
  useMyTransaction,
} from '@freik/web-utils';

import { useAtom, useAtomValue } from 'jotai';
import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { AddIgnoreItem, RemoveIgnoreItem } from '../../ipc';
import { AsyncHandler } from '../../Jotai/Helpers';
import { useBoolAtom } from '../../Jotai/Hooks';
import {
  neverPlayHatesState,
  onlyPlayLikesState,
} from '../../Jotai/LikesAndHates';
import { rescanInProgressState } from '../../Jotai/Miscellany';
import {
  minSongCountForArtistListState,
  showArtistsWithFullAlbumsState,
} from '../../Jotai/Preferences';
import {
  albumCoverNameState,
  defaultLocationState,
  downloadAlbumArtworkState,
  downloadArtistArtworkState,
  ignoreArticlesState,
  locationsState,
  saveAlbumArtworkWithMusicState,
} from '../../Jotai/SimpleSettings';
import {
  allAlbumsFunc,
  allArtistsFunc,
  allSongsFunc,
  ignoreItemsState,
} from '../../Recoil/ReadOnly';
import { GetHelperText } from '../MenuHelpers';
import './styles/Settings.css';

const btnWidth: React.CSSProperties = { width: '155px', padding: 0 };
const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

async function GetDirs(): Promise<string[] | void> {
  return await Util.ShowOpenDialog({ properties: ['openDirectory'] });
}

export async function addLocation({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set,
}: MyTransactionInterface): Promise<boolean> {
  const locs = await GetDirs();
  if (locs) {
    // set(locationsState, (curLocs) => [...locs, ...curLocs]);
    return true;
  }
  return false;
}

function MusicLocations(): JSX.Element {
  const [newLoc, setNewLoc] = useAtom(locationsState);
  const [defLoc, setDefLoc] = useAtom(defaultLocationState);
  const rescanInProgress = useAtomValue(rescanInProgressState);
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
            onClick={() => void setNewLoc(removeFromSet(newLoc, elem))}
            iconProps={{ iconName: 'Delete' }}
          />
          <Label>{elem}</Label>&nbsp;
          {defLoc === elem ? (
            <Text variant="small">[Default "Save" Location (NYI)]</Text>
          ) : (
            <DefaultButton
              styles={setSaveStyle}
              iconProps={{ iconName: 'Save' }}
              onClick={() => void setDefLoc(elem)}
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
          style={btnWidth}
        />
        &nbsp;
        <TooltipHost
          id="RescanLocationsHelp"
          content="Necessary if you moved files around since launching the app"
        >
          <DefaultButton
            text="Rescan Locations"
            iconProps={{ iconName: 'SearchData' }}
            disabled={rescanInProgress}
            onClick={() => Ipc.SendMain(IpcId.ManualRescan)}
            style={btnWidth}
          />
        </TooltipHost>
        &nbsp;
        <DefaultButton
          text="Import Files (NYI)"
          /* onClick={() => {}} */
          iconProps={{ iconName: 'DownloadDocument' }}
          title={st(StrId.ImportFiles)}
          style={btnWidth}
        />
      </div>
      <Text>{`${artists.size} Artists, ${albums.size} Albums, ${songs.size} Songs`}</Text>
    </>
  );
}

const ignoreTypeNameMap = new Map<IgnoreItemTypeEnum, string>([
  ['path-root', 'Root Path'],
  ['dir-name', 'Directory Name'],
  ['path-keyword', 'Keyword'],
]);

const ignoreOptions: IDropdownOption[] = [...ignoreTypeNameMap.entries()].map(
  ([key, text]) => ({ key, text }),
);

function IgnoreList(): JSX.Element {
  const ignoreItems = useRecoilValue(ignoreItemsState);
  const [newType, setNewType] = useState<IgnoreItemTypeEnum | ''>('');
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
            if (isDefined(option) && option.key !== '') {
              setNewType(option.key as IgnoreItemTypeEnum);
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
            if (isDefined(value)) {
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
            if (newType !== '') {
              AddIgnoreItem({ type: newType, value: newValue });
            }
            setNewType('');
            setNewValue('');
          }}
          iconProps={{ iconName: 'Add' }}
          disabled={newValue.length === 0}
        />
      </span>
    </div>
  );
}

function ArticleSorting(): JSX.Element {
  const articles = useBoolAtom(ignoreArticlesState);
  return <StateToggle label="Ignore articles when sorting" state={articles} />;
}

function ArtistFiltering(): JSX.Element {
  const onlyAlbumArtists = useBoolAtom(showArtistsWithFullAlbumsState);
  const [songCount, setSongCount] = useAtom(minSongCountForArtistListState);
  return (
    <>
      <StateToggle
        label="Only show artists with full albums (JODO)"
        state={onlyAlbumArtists}
      />
      <SpinButton
        label="Only show artists with at least this many songs (JODO)"
        disabled={onlyAlbumArtists[0]}
        value={songCount.toString()}
        onIncrement={AsyncHandler(() =>
          setSongCount(Math.min(100, songCount + 1)),
        )}
        onDecrement={AsyncHandler(() =>
          setSongCount(Math.max(1, songCount - 1)),
        )}
        style={{ width: '10px' }}
      />
    </>
  );
}

function LikeFiltering(): JSX.Element {
  const neverPlayHates = useBoolAtom(neverPlayHatesState);
  const onlyPlayLikes = useBoolAtom(onlyPlayLikesState);
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
  const dlAlbumArtwork = useBoolAtom(downloadAlbumArtworkState);
  const dlArtistArtwork = useBoolAtom(downloadArtistArtworkState);
  const saveAlbumArtwork = useBoolAtom(saveAlbumArtworkWithMusicState);
  const [coverArtName, setCoverArtName] = useAtom(albumCoverNameState);
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
          onChange={(_ev, nv) => nv && void setCoverArtName(nv)}
        />
      </div>
      <StateToggle label="Download Artist Artwork" state={dlArtistArtwork} />
      <DefaultButton
        text="Flush Image Cache"
        style={{ ...btnWidth, gridRow: 4 }}
        onClick={() => Ipc.SendMain(IpcId.FlushImageCache)}
      />
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
        <Expandable
          indent={30}
          separator
          label="Ignore filters"
          defaultShow={false}
        >
          <IgnoreList />
        </Expandable>
      </Expandable>
      <Expandable separator label="Sorting & Filtering" defaultShow={true}>
        <LikeFiltering />
        <ArticleSorting />
        <ArtistFiltering />
      </Expandable>
      <Expandable separator label="Artwork" defaultShow={true}>
        <ArtworkSettings />
      </Expandable>
      <Expandable separator label="Metadata" defaultShow={true}>
        <>
          <DefaultButton
            text="Flush Metadata Cache"
            style={btnWidth}
            onClick={() => Ipc.SendMain(IpcId.FlushMetadataCache)}
          />
          &nbsp;
          <DefaultButton
            text="Clear Local Overrides"
            style={btnWidth}
            onClick={() => Ipc.SendMain(IpcId.ClearLocalOverrides)}
          />
        </>
      </Expandable>
    </div>
  );
}
