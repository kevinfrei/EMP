import { Type } from '@freik/core-utils';

// Typescript enums are very bad and buggy in weird ways
type IpcIdImpl = {
  ClearHates: 'clear-hates';
  ClearLikes: 'clear-likes';
  DeletePlaylist: 'delete-playlist';
  FlushImageCache: 'flush-image-cache';
  GetHates: 'get-hates';
  GetLikes: 'get-likes';
  GetMediaInfo: 'media-info';
  GetMusicDatabase: 'get-music-database';
  GetPlaylists: 'get-playlists';
  LoadPlaylists: 'load-playlists';
  ManualRescan: 'manual-rescan';
  MusicDBUpdate: 'music-database-update';
  RenamePlaylist: 'rename-playlist';
  SavePlaylist: 'save-playlist';
  Search: 'search';
  SetHates: 'set-hates';
  SetLikes: 'set-likes';
  SetMediaInfo: 'set-media-info';
  SetPlaylists: 'set-playlists';
  SetSaveMenu: 'set-save-menu';
  ShowFile: 'show-file';
  ShowLocFromKey: 'show-location-from-key';
  ShowMenu: 'show-menu';
  SubstrSearch: 'subsearch';
  TranscodingUpdate: 'get-xcode-update';
  TranscodingBegin: 'start-xcode';
  UploadImage: 'upload-image';
  MinimizeWindow: 'minimize-window';
  MaximizeWindow: 'maximize-window';
  RestoreWindow: 'restore-window';
  CloseWindow: 'close-window';
  GetPicUri: 'get-pic-uri';
  GetIgnoreList: 'get-ignore-list';
  AddIgnoreItem: 'add-ignore-item';
  RemoveIgnoreItem: 'del-ignore-item';
  PushIgnoreList: 'push-ignore-list';
};
export const IpcId: IpcIdImpl = {
  ClearHates: 'clear-hates',
  ClearLikes: 'clear-likes',
  DeletePlaylist: 'delete-playlist',
  FlushImageCache: 'flush-image-cache',
  GetHates: 'get-hates',
  GetLikes: 'get-likes',
  GetMediaInfo: 'media-info',
  GetMusicDatabase: 'get-music-database',
  GetPlaylists: 'get-playlists',
  LoadPlaylists: 'load-playlists',
  ManualRescan: 'manual-rescan',
  MusicDBUpdate: 'music-database-update',
  RenamePlaylist: 'rename-playlist',
  SavePlaylist: 'save-playlist',
  Search: 'search',
  SetHates: 'set-hates',
  SetLikes: 'set-likes',
  SetMediaInfo: 'set-media-info',
  SetPlaylists: 'set-playlists',
  SetSaveMenu: 'set-save-menu',
  ShowFile: 'show-file',
  ShowLocFromKey: 'show-location-from-key',
  ShowMenu: 'show-menu',
  SubstrSearch: 'subsearch',
  TranscodingUpdate: 'get-xcode-update',
  TranscodingBegin: 'start-xcode',
  UploadImage: 'upload-image',
  MinimizeWindow: 'minimize-window',
  MaximizeWindow: 'maximize-window',
  RestoreWindow: 'restore-window',
  CloseWindow: 'close-window',
  GetPicUri: 'get-pic-uri',
  GetIgnoreList: 'get-ignore-list',
  AddIgnoreItem: 'add-ignore-item',
  RemoveIgnoreItem: 'del-ignore-item',
  PushIgnoreList: 'push-ignore-list',
};
Object.freeze(IpcId);
export type IpcId = string;

type KeysImpl = {
  AddFileLocation: 'O';
  Albums: '2';
  Artists: '3';
  Backward10s: '[';
  Find: 'F';
  Forward10s: ']';
  NextTrack: 'Right';
  NowPlaying: '1';
  Play: 'P';
  Playlists: '5';
  PreviousTrack: 'Left';
  Repeat: 'T';
  SavePlaylist: 'S';
  Settings: ',';
  Shuffle: 'R';
  Songs: '4';
  ToggleMiniPlayer: '9';
  Tools: 'L';
};
export const Keys: KeysImpl = {
  AddFileLocation: 'O',
  Albums: '2',
  Artists: '3',
  Backward10s: '[',
  Find: 'F',
  Forward10s: ']',
  NextTrack: 'Right',
  NowPlaying: '1',
  Play: 'P',
  Playlists: '5',
  PreviousTrack: 'Left',
  Repeat: 'T',
  SavePlaylist: 'S',
  Settings: ',',
  Shuffle: 'R',
  Songs: '4',
  ToggleMiniPlayer: '9',
  Tools: 'L',
};
Object.freeze(Keys);
export type Keys = string;

// TODO: This stuff let's me localize my strings eventually
type StrIdImpl = {
  // MediaInfo.tsx strings
  Mono: 'mono';
  Stereo: 'stereo';
  Quadrophonic: 'quadrophonic';
  Channels: ' channels';
  BitDepth: 'bit';
  FilePath: 'File Path';
  Duration: 'Duration:';
  MDHeaderField: 'Field';
  MDHeaderValue: 'Value';
  FilesSelected: 'Files Selected';
  RawMetadata: 'Raw Metadata';
  // Metadata Editor
  ChooseCoverArt: 'Select Cover Art Image';
  ImageName: 'Images';
  ErrNotSingleAndNotMultiple: 'Not Single and not Multiple (This is a bug!)';
  ErrSingleAndMultiple: 'Both Single and Multiple (This is a bug!)';
  Title: 'Title';
  ArtistTooltip: "Multiple artists are specified like this: 'Artist 1, Artist 2 & Artist 3'";
  Artists: 'Artist(s)';
  Album: 'Album';
  Year: 'Year';
  TrackNum: 'Track #';
  DiskNum: 'Disk #';
  DiskName: 'Disk Name';
  Compilation: 'Compilation';
  Soundtrack: 'Soundtrack';
  AdditionalArtists: 'Additional Artist(s)';
  VariationsTooltip: 'Separate vartiations with a semicolon';
  Variations: 'Variation(s)';
  AlbumCover: 'Album Cover';
  ChooseFile: 'Choose File...';
  FromClipboard: 'From Clipboard';
  ViewNowPlaying: 'Now Playing';
  ViewAlbums: 'Albums';
  ViewArtists: 'Artists';
  ViewSongs: 'All Songs';
  ViewPlaylists: 'Playlists';
  ViewSettings: 'Settings';
  ViewTools: 'Tools';
  ImportFiles: 'Import Files...';
};
export const StrId: StrIdImpl = {
  // MediaInfo.tsx strings
  Mono: 'mono',
  Stereo: 'stereo',
  Quadrophonic: 'quadrophonic',
  Channels: ' channels',
  BitDepth: 'bit',
  FilePath: 'File Path',
  Duration: 'Duration:',
  MDHeaderField: 'Field',
  MDHeaderValue: 'Value',
  FilesSelected: 'Files Selected',
  RawMetadata: 'Raw Metadata',
  // Metadata Editor
  ChooseCoverArt: 'Select Cover Art Image',
  ImageName: 'Images',
  ErrNotSingleAndNotMultiple: 'Not Single and not Multiple (This is a bug!)',
  ErrSingleAndMultiple: 'Both Single and Multiple (This is a bug!)',
  Title: 'Title',
  ArtistTooltip:
    "Multiple artists are specified like this: 'Artist 1, Artist 2 & Artist 3'",
  Artists: 'Artist(s)',
  Album: 'Album',
  Year: 'Year',
  TrackNum: 'Track #',
  DiskNum: 'Disk #',
  DiskName: 'Disk Name',
  Compilation: 'Compilation',
  Soundtrack: 'Soundtrack',
  AdditionalArtists: 'Additional Artist(s)',
  VariationsTooltip: 'Separate vartiations with a semicolon',
  Variations: 'Variation(s)',
  AlbumCover: 'Album Cover',
  ChooseFile: 'Choose File...',
  FromClipboard: 'From Clipboard',
  ViewNowPlaying: 'Now Playing',
  ViewAlbums: 'Albums',
  ViewArtists: 'Artists',
  ViewSongs: 'All Songs',
  ViewPlaylists: 'Playlists',
  ViewSettings: 'Settings',
  ViewTools: 'Tools',
  ImportFiles: 'Import Files...',
};
Object.freeze(StrId);
export type StrId = string;
export function st(id: StrId): string {
  return id;
}

type CurrentViewImpl = {
  disabled: -1;
  none: 0;
  recent: 1;
  albums: 2;
  artists: 3;
  songs: 4;
  playlists: 5;
  now_playing: 6;
  settings: 7;
  search: 8;
  tools: 9;
  // This is necessary if you want to walk the keys for CurrentView
  [keys: string]: number;
};
export const CurrentView: CurrentViewImpl = {
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
};
Object.freeze(CurrentView);
export type CurrentView = number;

type TranscodeFormatTargetsImpl = {
  m4a: 'm4a';
  mp3: 'mp3';
  aac: 'aac';
};
export const TranscodeFormatTargets: TranscodeFormatTargetsImpl = {
  m4a: 'm4a',
  mp3: 'mp3',
  aac: 'aac',
};
Object.freeze(TranscodeFormatTargets);
export type TranscodeFormatTargets = 'm4a' | 'mp3' | 'aac';
export type TranscodeFormatTargetNames = TranscodeFormatTargets;

type TranscodeSourceTypeImpl = {
  Playlist: 'p';
  Artist: 'r';
  Album: 'l';
  Disk: 'd';
};
export const TranscodeSourceType: TranscodeSourceTypeImpl = {
  Playlist: 'p',
  Artist: 'r',
  Album: 'l',
  Disk: 'd',
};
Object.freeze(TranscodeSourceType);
export type TranscodeSourceType = 'p' | 'r' | 'l' | 'd';
export type TranscodeSourceTypeNames = TranscodeSourceType;
export function isTranscodeSourceType(v: unknown): v is TranscodeSourceType {
  return v === 'p' || v === 'r' || v === 'l' || v === 'd';
}

export type TranscodeSourceLocation = {
  type: TranscodeSourceType;
  loc: string;
};

export const isXcodeSrcLoc = Type.isSpecificTypeFn<TranscodeSourceLocation>([
  ['type', isTranscodeSourceType],
  ['loc', Type.isString],
]);

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

export const isXcodeInfo = Type.isSpecificTypeFn<TranscodeInfo>([
  ['source', isXcodeSrcLoc],
  ['dest', Type.isString],
  ['artwork', Type.isBoolean],
  ['mirror', Type.isBoolean],
  [
    'format',
    (o: unknown): o is TranscodeFormatTargetNames => {
      return o === 'm4a' || o === 'mp3' || o === 'aac';
    },
  ],
  ['bitrate', Type.isNumber],
]);

export type IgnoreItemType = 'path-root' | 'path-keyword' | 'dir-name';
export type BackEndIgnoreItem = { type: IgnoreItemType; value: string };
export function IsIgnoreItemType(obj: unknown): obj is IgnoreItemType {
  return obj === 'path-root' || obj === 'path-keyword' || obj === 'dir-name';
}
const isBackendIgnoreItemFn = Type.isSpecificTypeFn<BackEndIgnoreItem>(
  [
    ['type', IsIgnoreItemType],
    ['value', Type.isString],
  ],
  ['type', 'value'],
);
export const isBackendIgnoreItemArrayFn = Type.isArrayOfFn<BackEndIgnoreItem>(
  isBackendIgnoreItemFn,
);

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
