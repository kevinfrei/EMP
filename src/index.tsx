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
import * as serviceWorker from './serviceWorker';
import { App } from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
  // unregisterIcons(['']);
  registerIcons({
    icons: {
      add: <AddIcon />,
      checkmark: <CheckMarkIcon />,
      cancel: <CancelIcon />,
      chevronDown: <ChevronDownIcon />,
      chevronRight: <ChevronRightIcon />,
      chevrondownsmall: <ChevronDownSmallIcon />,
      chevronrightmed: <ChevronRightMedIcon />,
      chevronupsmall: <ChevronUpSmallIcon />,
      chromeClose: <ChromeCloseIcon />,
      chromeMinimize: <ChromeMinimizeIcon />,
      completed: <CompletedIcon />,
      delete: <DeleteIcon />,
      dependencyAdd: <DependencyAddIcon />,
      dislike: <DislikeIcon />,
      dislikeSolid: <DislikeSolidIcon />,
      DownloadDocument: <DownloadDocumentIcon />,
      folderSearch: <FolderSearchIcon />,
      gridViewLarge: <GridViewLargeIcon />,
      groupedascending: <GroupedAscendingIcon />,
      groupeddescending: <GroupedDescendingIcon />,
      info: <InfoIcon />,
      like: <LikeIcon />,
      likeSolid: <LikeSolidIcon />,
      list: <ListIcon />,
      maximize: <ChevronUpIcon />,
      mergeDuplicate: <MergeDuplicateIcon />,
      more: <MoreIcon />,
      rename: <RenameIcon />,
      restore: <ChromeRestoreIcon />,
      save: <SaveIcon />,
      search: <SearchIcon />,
      SearchData: <SearchDataIcon />,
      sortdown: <SortDownIcon />,
      sortup: <SortUpIcon />,
      unknown: <UnknownIcon />,
      volume0: <Volume0Icon />,
      volume1: <Volume1Icon />,
      volume2: <Volume2Icon />,
      volume3: <Volume3Icon />,
      volumedisabled: <VolumeDisabledIcon />,
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
