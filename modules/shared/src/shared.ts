import {
  chkArrayOf,
  chkObjectOfType,
  isArray,
  isBoolean,
  isNumber,
  isString,
  typecheck,
} from '@freik/typechk';

/**
 * Type check to validate that obj is a valid constant allowed in
 * the Typescript 'string constant' type provided
 * @param {unknown} obj
 * @returns {obj_is<T>}
 */
export function chkValidConst<T>(
  typearray: readonly T[] | Set<T>,
): typecheck<T> {
  return (obj: unknown): obj is T =>
    isArray(typearray)
      ? typearray.includes(obj as unknown as T)
      : (typearray as Set<T>).has(obj as unknown as T);
}

/**
 * Type check to validate that obj is a valid constant allowed in
 * the Typescript 'string constant' type provided
 * @param {unknown} obj
 * @returns {obj_is<T>}
 */
export function isValidConst<T>(
  typearray: readonly T[] | Set<T>,
  obj: unknown,
): obj is T {
  return chkValidConst(typearray)(obj);
}

export enum IpcId {
  ClearHates = 'clear-hates',
  ClearLikes = 'clear-likes',
  ClearLocalOverrides = 'clear-local-overrides',
  DeletePlaylist = 'delete-playlist',
  FlushImageCache = 'flush-image-cache',
  FlushMetadataCache = 'flush-metadata-cache',
  GetHates = 'get-hates',
  GetLikes = 'get-likes',
  GetMediaInfo = 'media-info',
  GetMusicDatabase = 'get-music-database',
  GetPlaylists = 'get-playlists',
  LoadPlaylists = 'load-playlists',
  ManualRescan = 'manual-rescan',
  MenuAction = 'menuAction',
  MusicDBUpdate = 'music-database-update',
  RenamePlaylist = 'rename-playlist',
  SavePlaylist = 'save-playlist',
  Search = 'search',
  SetHates = 'set-hates',
  SetLikes = 'set-likes',
  SetMediaInfo = 'set-media-info',
  SetPlaylists = 'set-playlists',
  SetSaveMenu = 'set-save-menu',
  ShowFile = 'show-file',
  ShowLocFromKey = 'show-location-from-key',
  ShowMenu = 'show-menu',
  SubstrSearch = 'subsearch',
  TranscodingUpdate = 'get-xcode-update',
  TranscodingBegin = 'start-xcode',
  UploadImage = 'upload-image',
  MinimizeWindow = 'minimize-window',
  MaximizeWindow = 'maximize-window',
  RestoreWindow = 'restore-window',
  CloseWindow = 'close-window',
  GetPicUri = 'get-pic-uri',
  GetIgnoreList = 'get-ignore-list',
  AddIgnoreItem = 'add-ignore-item',
  RemoveIgnoreItem = 'del-ignore-item',
  PushIgnoreList = 'push-ignore-list',
  IgnoreListId = 'ignore-list',
  RescanInProgress = 'rescan-in-progress',
}

export enum Keys {
  AddFileLocation = 'O',
  Albums = '2',
  Artists = '3',
  Backward10s = '[',
  Find = 'F',
  Forward10s = ']',
  NextTrack = 'Right',
  NowPlaying = '1',
  Play = 'P',
  Playlists = '5',
  PreviousTrack = 'Left',
  Repeat = 'T',
  SavePlaylist = 'S',
  Settings = ',',
  Shuffle = 'R',
  Songs = '4',
  ToggleMiniPlayer = '9',
  Tools = 'L',
}

// TODO: This stuff let's me localize my strings eventually
export enum StrId {
  // MediaInfo.tsx strings
  Mono = 'mono',
  Stereo = 'stereo',
  Quadrophonic = 'quadrophonic',
  Channels = ' channels',
  BitDepth = 'bit',
  FilePath = 'File Path',
  Duration = 'Duration:',
  MDHeaderField = 'Field',
  MDHeaderValue = 'Value',
  FilesSelected = 'Files Selected',
  RawMetadata = 'Raw Metadata',
  // Metadata Editor
  ChooseCoverArt = 'Select Cover Art Image',
  ImageName = 'Images',
  ErrNotSingleAndNotMultiple = 'Not Single and not Multiple (This is a bug!)',
  ErrSingleAndMultiple = 'Both Single and Multiple (This is a bug!)',
  Title = 'Title',
  ArtistTooltip = "Multiple artists are specified like this: 'Artist 1, Artist 2 & Artist 3'",
  Artists = 'Artist(s)',
  Album = 'Album',
  Year = 'Year',
  TrackNum = 'Track #',
  DiskNum = 'Disk #',
  DiskName = 'Disk Name',
  Compilation = 'Compilation',
  Soundtrack = 'Soundtrack',
  AdditionalArtists = 'Additional Artist(s)',
  VariationsTooltip = 'Separate vartiations with a semicolon',
  Variations = 'Variation(s)',
  AlbumCover = 'Album Cover',
  ChooseFile = 'Choose File...',
  FromClipboard = 'From Clipboard',
  ViewNowPlaying = 'Now Playing',
  ViewAlbums = 'Albums',
  ViewArtists = 'Artists',
  ViewSongs = 'All Songs',
  ViewPlaylists = 'Playlists',
  ViewSettings = 'Settings',
  ViewTools = 'Tools',
  ImportFiles = 'Import Files...',
}

export function st(id: StrId): string {
  return id;
}

export const CurrentView = Object.freeze({
  disabled: -1,
  none: 0,
  recent: 1,
  albums: 2,
  artists: 3,
  songs: 4,
  playlists: 5,
  now_playing: 6,
  settings: 7,
  search: 8,
  tools: 9,
} as const);
export type CurrentViewEnum = (typeof CurrentView)[keyof typeof CurrentView];
export const isCurrentView: typecheck<CurrentViewEnum> = (
  val: unknown,
): val is CurrentViewEnum =>
  isNumber(val) &&
  Number.isInteger(val) &&
  val >= CurrentView.disabled &&
  val <= CurrentView.tools;

export const TranscodeFormatTargetName = Object.freeze({
  m4a: 'm4a',
  mp3: 'mp3',
  aac: 'aac',
} as const);
export type TranscodeFormatTargetNameEnum =
  (typeof TranscodeFormatTargetName)[keyof typeof TranscodeFormatTargetName];
const TranscodeFormatTargetNameEnumValues: readonly TranscodeFormatTargetNameEnum[] =
  Object.values(TranscodeFormatTargetName);
export const isTranscodeFormatTargetName = chkValidConst(
  TranscodeFormatTargetNameEnumValues,
);

export const TranscodeSource = Object.freeze({
  Playlist: 'p',
  Artist: 'r',
  Album: 'l',
  Disk: 'd',
} as const);
export type TranscodeSourceEnum =
  (typeof TranscodeSource)[keyof typeof TranscodeSource];
const TranscodeSourceEnumValues: readonly TranscodeSourceEnum[] =
  Object.values(TranscodeSource);
export const isTranscodeSource = chkValidConst(TranscodeSourceEnumValues);

export type TranscodeSourceLocation = {
  type: TranscodeSourceEnum;
  loc: string;
};

export const isXcodeSrcLoc = chkObjectOfType<TranscodeSourceLocation>({
  type: isTranscodeSource,
  loc: isString,
});

export type TranscodeState = {
  curStatus: string;
  filesTranscoded: string[];
  filesFound: number;
  filesPending: number;
  filesUntouched: number;
  filesFailed?: { file: string; error: string }[];
  itemsRemoved?: string[];
};

export type TranscodeInfo = {
  source: { type: TranscodeSourceEnum; loc: string };
  dest: string;
  artwork: boolean;
  mirror: boolean;
  format: TranscodeFormatTargetNameEnum;
  bitrate: number;
};

export const isXcodeInfo = chkObjectOfType<TranscodeInfo>({
  source: isXcodeSrcLoc,
  dest: isString,
  artwork: isBoolean,
  mirror: isBoolean,
  format: isTranscodeFormatTargetName,
  bitrate: isNumber,
});

export type IgnoreItemType = 'path-root' | 'path-keyword' | 'dir-name';
export type IgnoreItem = { type: IgnoreItemType; value: string };
export function IsIgnoreItemType(obj: unknown): obj is IgnoreItemType {
  return obj === 'path-root' || obj === 'path-keyword' || obj === 'dir-name';
}
export const isIgnoreItemFn = chkObjectOfType<IgnoreItem>({
  type: IsIgnoreItemType,
  value: isString,
});
export const isIgnoreItemArrayFn = chkArrayOf<IgnoreItem>(isIgnoreItemFn);

/*
export enum Decisions {
  approve,
  reject,
}

export function isDecision(obj: unknown): obj is Decisions {
  return (obj as any) in Decisions;
}

export function sillyText(obj: string) {
  if (isDecision(obj)) {
    console.log(obj);
  } else {
    console.log('Not a decision: ' + obj);
  }
}

export function isEnum<T>(obj: unknown): obj is T {
  return (obj as any) in keyof T;
}
*/
