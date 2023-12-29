import {
  chkArrayOf,
  chkObjectOfType,
  isBoolean,
  isNumber,
  isString,
} from '@freik/typechk';

export const enum IpcId {
  ClearHates = 'clear-hates',
  ClearLikes = 'clear-likes',
  DeletePlaylist = 'delete-playlist',
  FlushImageCache = 'flush-image-cache',
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

export const enum Keys {
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
export const enum StrId {
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

export const enum CurrentView {
  disabled = -1,
  none = 0,
  recent = 1,
  albums = 2,
  artists = 3,
  songs = 4,
  playlists = 5,
  now_playing = 6,
  settings = 7,
  search = 8,
  tools = 9,
}

export const enum TranscodeFormatTargets {
  m4a = 'm4a',
  mp3 = 'mp3',
  aac = 'aac',
}
export type TranscodeFormatTargetNames = 'm4a' | 'mp3' | 'aac';

export const enum TranscodeSourceType {
  Playlist = 'p',
  Artist = 'r',
  Album = 'l',
  Disk = 'd',
}
export function isTranscodeSourceType(v: unknown): v is TranscodeSourceType {
  return v === 'p' || v === 'r' || v === 'l' || v === 'd';
}

export type TranscodeSourceLocation = {
  type: TranscodeSourceType;
  loc: string;
};

export const isXcodeSrcLoc = chkObjectOfType<TranscodeSourceLocation>({
  type: isTranscodeSourceType,
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
  source: { type: TranscodeSourceType; loc: string };
  dest: string;
  artwork: boolean;
  mirror: boolean;
  format: TranscodeFormatTargetNames;
  bitrate: number;
};

export const isXcodeInfo = chkObjectOfType<TranscodeInfo>({
  source: isXcodeSrcLoc,
  dest: isString,
  artwork: isBoolean,
  mirror: isBoolean,
  format: (o: unknown): o is TranscodeFormatTargetNames => {
    return o === 'm4a' || o === 'mp3' || o === 'aac';
  },
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
