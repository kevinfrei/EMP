/* eslint-disable @typescript-eslint/naming-convention */
import { registerIcons } from '@fluentui/react/lib/Styling';
// Note: This approach works with any SVG icon set, not just @fluentui/react-icons-mdl2
import {
  AddIcon,
  CancelIcon,
  CheckMarkIcon,
  ChevronDownIcon,
  ChevronDownSmallIcon,
  ChevronRightIcon,
  ChevronRightMedIcon,
  ChevronUpIcon,
  ChevronUpSmallIcon,
  ChromeCloseIcon,
  ChromeMinimizeIcon,
  ChromeRestoreIcon,
  CompletedIcon,
  DeleteIcon,
  DependencyAddIcon,
  DislikeIcon,
  DislikeSolidIcon,
  DownloadDocumentIcon,
  FolderSearchIcon,
  GridViewLargeIcon,
  GroupedAscendingIcon,
  GroupedDescendingIcon,
  InfoIcon,
  LikeIcon,
  LikeSolidIcon,
  ListIcon,
  MergeDuplicateIcon,
  MoreIcon,
  RenameIcon,
  SaveIcon,
  SearchDataIcon,
  SearchIcon,
  SortDownIcon,
  SortUpIcon,
  UnknownIcon,
  Volume0Icon,
  Volume1Icon,
  Volume2Icon,
  Volume3Icon,
  VolumeDisabledIcon,
} from '@fluentui/react-icons-mdl2';
import { Util } from '@freik/elect-render-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
  // unregisterIcons(['']);

  registerIcons({
    icons: {
      add: <AddIcon style={{ marginBottom: 3 }} />,
      // ✓ : U+2713, &#10003;
      checkmark: <CheckMarkIcon style={{ marginBottom: 3 }} />,
      // 🗙 : U+1f5d9, &#128473;
      cancel: <CancelIcon style={{ marginBottom: 3 }} />,
      // ▽ : U+25BD, &#9661;
      chevronDown: <ChevronDownIcon style={{ marginBottom: 3 }} />,
      // ▷ : U+25b7, &#9655;
      chevronRight: <ChevronRightIcon style={{ marginBottom: 3 }} />,
      // ▿ : U+25BF, &#9663;
      chevrondownsmall: <ChevronDownSmallIcon style={{ marginBottom: 3 }} />,
      // ▹ : U25b9, &#9657;
      chevronrightmed: <ChevronRightMedIcon style={{ marginBottom: 3 }} />,
      // ▵ : U+25b5, &#9653;
      chevronupsmall: <ChevronUpSmallIcon style={{ marginBottom: 3 }} />,
      chromeClose: <ChromeCloseIcon style={{ marginBottom: 3 }} />,
      chromeMinimize: <ChromeMinimizeIcon style={{ marginBottom: 3 }} />,
      chromerestore: <ChromeRestoreIcon style={{ marginBottom: 3 }} />,
      completed: <CompletedIcon style={{ marginBottom: 3 }} />,
      delete: <DeleteIcon style={{ marginBottom: 3 }} />,
      dependencyAdd: <DependencyAddIcon style={{ marginBottom: 3 }} />,
      dislike: <DislikeIcon style={{ marginBottom: 3 }} />,
      dislikeSolid: <DislikeSolidIcon style={{ marginBottom: 3 }} />,
      DownloadDocument: <DownloadDocumentIcon style={{ marginBottom: 3 }} />,
      folderSearch: <FolderSearchIcon style={{ marginBottom: 3 }} />,
      gridViewLarge: <GridViewLargeIcon style={{ marginBottom: 3 }} />,
      groupedascending: <GroupedAscendingIcon style={{ marginBottom: 3 }} />,
      groupeddescending: <GroupedDescendingIcon style={{ marginBottom: 3 }} />,
      info: <InfoIcon style={{ marginBottom: 3 }} />,
      like: <LikeIcon style={{ marginBottom: 3 }} />,
      likeSolid: <LikeSolidIcon style={{ marginBottom: 3 }} />,
      list: <ListIcon style={{ marginBottom: 3 }} />,
      maximize: <ChevronUpIcon style={{ marginBottom: 3 }} />,
      mergeDuplicate: <MergeDuplicateIcon style={{ marginBottom: 3 }} />,
      more: <MoreIcon style={{ marginBottom: 3 }} />,
      rename: <RenameIcon style={{ marginBottom: 3 }} />,
      restore: <ChromeRestoreIcon style={{ marginBottom: 3 }} />,
      save: <SaveIcon style={{ marginBottom: 3 }} />,
      // 🔍: U1F50D, &#128269;
      search: <SearchIcon style={{ marginBottom: 3 }} />,
      SearchData: <SearchDataIcon style={{ marginBottom: 3 }} />,
      sortdown: <SortDownIcon style={{ marginBottom: 3 }} />,
      sortup: <SortUpIcon style={{ marginBottom: 3 }} />,
      unknown: <UnknownIcon style={{ marginBottom: 3 }} />,
      // 🔈: U+1F508, &#128264;
      volume0: <Volume0Icon style={{ marginBottom: 3 }} />,
      // 🔉: U+1F509, &#128265;
      volume1: <Volume1Icon style={{ marginBottom: 3 }} />,
      volume2: <Volume2Icon style={{ marginBottom: 3 }} />,
      // 🔊: U+1F50A, &#128266;
      volume3: <Volume3Icon style={{ marginBottom: 3 }} />,
      // 🔇	: U+1F507, &#128263;
      volumedisabled: <VolumeDisabledIcon style={{ marginBottom: 3 }} />,
    },
  });
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      root,
    );
  }
});
