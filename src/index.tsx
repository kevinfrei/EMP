import { registerIcons, unregisterIcons } from '@fluentui/react/lib/Styling';
// Note: This approach works with any SVG icon set, not just @fluentui/react-icons-mdl2
import {
  AddIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChromeCloseIcon,
  ChromeMinimizeIcon,
  ChromeRestoreIcon,
  DeleteIcon,
  DependencyAddIcon,
  DislikeIcon,
  DislikeSolidIcon,
  FolderSearchIcon,
  GridViewLargeIcon,
  InfoIcon,
  LikeIcon,
  LikeSolidIcon,
  ListIcon,
  MergeDuplicateIcon,
  MoreIcon,
  RenameIcon,
  SaveIcon,
  UnknownIcon,
} from '@fluentui/react-icons-mdl2';
// import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { Util } from '@freik/elect-render-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import { App } from './UI/App';
import './UI/styles/index.css';

Util.SetInit(() => {
  // initializeIcons();
  unregisterIcons(['']);
  registerIcons({
    icons: {
      add: <AddIcon />,
      dependencyAdd: <DependencyAddIcon />,
      dislike: <DislikeIcon />,
      dislikeSolid: <DislikeSolidIcon />,
      chevronDown: <ChevronDownIcon />,
      chevronRight: <ChevronRightIcon />,
      chromeClose: <ChromeCloseIcon />,
      chromeMinimize: <ChromeMinimizeIcon />,
      delete: <DeleteIcon />,
      folderSearch: <FolderSearchIcon />,
      gridViewLarge: <GridViewLargeIcon />,
      info: <InfoIcon />,
      like: <LikeIcon />,
      likeSolid: <LikeSolidIcon />,
      list: <ListIcon />,
      maximize: <ChromeMaximizeIcon />,
      mergeDuplicate: <MergeDuplicateIcon />,
      more: <MoreIcon />,
      rename: <RenameIcon />,
      restore: <ChromeRestoreIcon />,
      save: <SaveIcon />,
      unknown: <UnknownIcon />,
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
