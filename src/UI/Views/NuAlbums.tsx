import {
  getTheme,
  IRectangle,
  ITheme,
  List,
  mergeStyleSets,
} from '@fluentui/react';
import { Album } from '@freik/media-core';
import { useCallback, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { allAlbumsFunc, dataForAlbumFuncFam } from '../../Recoil/ReadOnly';
import { getAlbumImageUrl } from '../../Tools';
import './styles/Albums.css';

const theme: ITheme = getTheme();
const { palette, fonts } = theme;
const ROWS_PER_PAGE = 8;
const MAX_ROW_HEIGHT = 300;

const classNames = mergeStyleSets({
  listGridExampleTile: {
    textAlign: 'center',
    outline: 'none',
    position: 'relative',
    float: 'left',
    // background: palette.neutralLighter,
    selectors: {
      'focus:after': {
        content: '',
        position: 'absolute',
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        boxSizing: 'border-box',
        border: `1px solid ${palette.white}`,
      },
    },
  },
  listGridExampleSizer: {
    paddingBottom: '100%',
  },
  listGridExamplePadder: {
    position: 'absolute',
    left: 5,
    top: 5,
    right: 5,
    bottom: 5,
  },
  listGridExampleLabel: {
    background: 'rgba(0, 0, 0, 0.4)',
    color: '#FFFFFF',
    position: 'absolute',
    padding: 5,
    bottom: 0,
    left: 0,
    width: '100%',
    fontSize: fonts.small.fontSize,
    boxSizing: 'border-box',
  },
  listGridExampleImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    borderRadius: '10px',
    margin: 0,
  },
});

function AlbumCoverView({
  album,
  cols,
}: {
  album: Album;
  cols: number;
}): JSX.Element {
  const albumData = useRecoilValue(dataForAlbumFuncFam(album.key));
  const picurl = getAlbumImageUrl(album.key);

  // const onAddSongsClick = () => AddSongs(store, album.songs).catch(wrn);

  // const onRightClick = SongListDetailContextMenuClick(album.songs);
  if (!album) {
    return <></>;
  }
  return (
    <div
      className={classNames.listGridExampleTile}
      data-is-focusable
      style={{
        width: `${100 / cols}%`,
      }}
    >
      <div className={classNames.listGridExampleSizer}>
        <div className={classNames.listGridExamplePadder}>
          <img
            src={picurl}
            alt="album cover"
            className={classNames.listGridExampleImage}
          />
          <span
            className={classNames.listGridExampleLabel}
          >{`${albumData.album}- ${albumData.year} [${albumData.artist}]`}</span>
        </div>
      </div>
    </div>
  );
}

export function NuAlbumView(): JSX.Element {
  const columnCount = useRef(0);
  const rowHeight = useRef(0);

  const getItemCountForPage = useCallback(
    (itemIndex?: number, surfaceRect?: IRectangle) => {
      if (itemIndex === 0 && surfaceRect) {
        columnCount.current = Math.ceil(surfaceRect.width / MAX_ROW_HEIGHT);
        rowHeight.current = Math.floor(surfaceRect.width / columnCount.current);
      }
      return columnCount.current * ROWS_PER_PAGE;
    },
    [],
  );

  const onRenderCell = (item?: Album) => {
    return item !== undefined ? (
      <AlbumCoverView album={item} cols={columnCount.current} />
    ) : (
      <></>
    );
  };
  const albums = useRecoilValue(allAlbumsFunc);
  const getPageHeight = useCallback((): number => {
    const res = rowHeight.current * ROWS_PER_PAGE;
    return Number.isNaN(res) ? ROWS_PER_PAGE : res;
  }, [rowHeight]);
  return (
    <div className="albumCoverList">
      <List
        className="listGridExample"
        items={[...albums.values()]}
        getItemCountForPage={getItemCountForPage}
        getPageHeight={getPageHeight}
        renderedWindowsAhead={4}
        onRenderCell={onRenderCell}
      />
    </div>
  );
}
