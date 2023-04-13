import {
  Checkbox,
  DefaultButton,
  DirectionalHint,
  Image,
  ImageFit,
  PrimaryButton,
  Text,
  TextField,
  TooltipHost,
} from '@fluentui/react';
import { Util } from '@freik/elect-render-utils';
import { AlbumKey, FullMetadata, Metadata, SongKey } from '@freik/media-core';
import { isArrayOfString, isString } from '@freik/typechk';
import {
  Catch,
  MyTransactionInterface,
  onRejected,
  useMyTransaction,
} from '@freik/web-utils';
import debug from 'debug';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { StrId, st } from 'shared';
import {
  UploadFileForAlbum,
  UploadFileForSong,
  UploadImageForAlbum,
  UploadImageForSong,
} from '../../MyWindow';
import {
  albumCoverUrlFuncFam,
  picCacheAvoiderStateFam,
} from '../../Recoil/ImageUrls';
import {
  albumKeyForSongKeyFuncFam,
  metadataEditCountState,
} from '../../Recoil/ReadOnly';
import { SetMediaInfo } from '../../ipc';

const log = debug('EMP:render:MetadataEditor:log');
const err = debug('EMP:render:MetadataEditor:error'); // eslint-disable-line

export type MetadataProps = {
  forSong?: SongKey;
  forSongs?: SongKey[];
  artist?: string;
  album?: string;
  track?: string;
  title?: string;
  year?: string;
  va?: string;
  variations?: string;
  moreArtists?: string;
  albumId?: AlbumKey;
  diskName?: string;
};

export function MetadataEditor(props: MetadataProps): JSX.Element {
  const [artist, setArtist] = useState<false | string>(false);
  const [album, setAlbum] = useState<false | string>(false);
  const [track, setTrack] = useState<false | string>(false);
  const [disk, setDisk] = useState<false | string>(false);
  const [title, setTitle] = useState<false | string>(false);
  const [year, setYear] = useState<false | string>(false);
  const [vaType, setVaType] = useState<false | 'ost' | 'va' | ''>(false);
  const [vars, setVars] = useState<false | string>(false);
  const [moreArtists, setMoreArtists] = useState<false | string>(false);
  const [diskName, setDiskName] = useState<false | string>(false);

  const isMultiple = !props.forSong && isArrayOfString(props.forSongs);
  const isSingle = isString(props.forSong) && !props.forSongs;

  // I don't fully understand why I have to do this, but it seems to work...
  // Without it, if you right-click different songs, whichever fields were
  // edited don't return to their new values :/
  useEffect(() => {
    setArtist(false);
    setAlbum(false);
    setTrack(false);
    setDisk(false);
    setTitle(false);
    setYear(false);
    setVaType(false);
    setVars(false);
    setMoreArtists(false);
    setDiskName(false);
  }, [props.forSong]);

  // This is a helper to read the overridden value (from state) if it's set
  // otherwise, fall back to the pv (props.val) data (and then empty string)
  const val = (v: false | string, pv?: string) => (v !== false ? v : pv || '');
  // The diskNum and trackNum are extracted from the single
  const trimmedTrack = (props.track || '').trim();
  const diskNum =
    trimmedTrack.length > 2
      ? trimmedTrack.substring(0, trimmedTrack.length - 2)
      : '';
  const trackNum =
    trimmedTrack.length > 2
      ? Number.parseInt(trimmedTrack.substring(diskNum.length), 10).toString()
      : trimmedTrack;
  const isVa = val(vaType, props.va) === 'va';
  const isOST = val(vaType, props.va) === 'ost';
  const setVa = () => setVaType(isVa ? '' : 'va');
  const setOST = () => setVaType(isOST ? '' : 'ost');
  const isNumber = (vl?: string) => {
    if (isString(vl)) {
      const num = Number.parseInt(vl, 10);
      return num.toString() === vl.trim() && vl.trim() !== 'NaN';
    }
    return false;
  };

  const onSubmit = useMyTransaction((xact) => () => {
    // This is necessary to invalidate things that may otherwise be confused
    // once the metadata is different
    xact.set(metadataEditCountState, (cur) => cur + 1);

    // TODO: Save the changed values to the metadata override 'cache'
    // and reflect those changes in the music DB

    // Worst case: trigger a rescan of the music on the back end, I guess :(
    for (const songKey of isArrayOfString(props.forSongs)
      ? props.forSongs
      : [props.forSong]) {
      log('Originally:');
      log(props);
      log('updated to:');
      const md: Partial<FullMetadata> = { originalPath: '*' + songKey! };
      if (artist) {
        md.artist = Metadata.SplitArtistString(artist);
      }
      if (album) {
        md.album = album;
      }
      if (year !== false) {
        md.year = Number.parseInt(year.trim(), 10);
      }
      // Cowardly refuse to update track # and title for multi-edit
      if (isSingle) {
        if (track) {
          md.track = Number.parseInt(track.trim(), 10);
        }
        if (title) {
          md.title = title;
        }
      }
      if (vaType !== false && vaType !== undefined && vaType !== '') {
        md.vaType = vaType;
      }
      if (disk !== false) {
        md.disk = disk.trim() ? Number.parseInt(disk.trim(), 10) : 0;
        log('Disk Number:' + md.disk.toString());
      }
      if (diskName !== false) {
        md.diskName = diskName.trim();
      }
      if (vars !== false) {
        md.variations = vars.split(';').map((s) => s.trim());
      }
      if (moreArtists !== false) {
        md.moreArtists = Metadata.SplitArtistString(moreArtists);
      }
      log(md);
      SetMediaInfo(md).catch(onRejected('Saving Metadata failed'));
    }
  });

  const uploadImage = async (
    { get, set }: MyTransactionInterface,
    uploadSong: (sk: SongKey) => Promise<void>,
    uploadAlbum: (ak: AlbumKey) => Promise<void>,
  ) => {
    // Easy: one song:
    if (props.forSong !== undefined) {
      await uploadSong(props.forSong);
      const albumKey = get(albumKeyForSongKeyFuncFam(props.forSong));
      setTimeout(
        () => set(picCacheAvoiderStateFam(albumKey), (p) => p + 1),
        250,
      );
    } else {
      // Messy: Multiple songs
      const albumsSet: Set<AlbumKey> = new Set();
      for (const song of props.forSongs!) {
        const albumKey = get(albumKeyForSongKeyFuncFam(song));
        if (albumsSet.has(albumKey)) {
          continue;
        }
        albumsSet.add(albumKey);
        await uploadAlbum(albumKey);
        // This bonks the URL so it will be reloaded after we've uploaded the image
        setTimeout(
          () => set(picCacheAvoiderStateFam(albumKey), (p) => p + 1),
          250,
        );
      }
    }
  };

  const onImageFromClipboard = useMyTransaction((xact) => () => {
    const img = Util.ImageFromClipboard();
    if (img !== undefined) {
      uploadImage(
        xact,
        async (sk: SongKey) => await UploadImageForSong(sk, img),
        async (ak: AlbumKey) => await UploadImageForAlbum(ak, img),
      ).catch((e) => Catch(e));
    }
  });
  const onSelectFile = useMyTransaction((xact) => () => {
    Util.ShowOpenDialog({
      title: st(StrId.ChooseCoverArt),
      properties: ['openFile'],
      filters: [
        { name: st(StrId.ImageName), extensions: ['jpg', 'jpeg', 'png'] },
      ],
    })
      .then((selected) => {
        return selected !== undefined
          ? uploadImage(
              xact,
              async (sk: SongKey) => await UploadFileForSong(sk, selected[0]),
              async (ak: AlbumKey) => await UploadFileForAlbum(ak, selected[0]),
            )
          : new Promise(() => {
              return;
            });
      })
      .catch((e) => Catch(e));
  });
  const coverUrl = useRecoilValue(albumCoverUrlFuncFam(props.albumId || '___'));
  // Nothing selected: EMPTY!
  if (!isSingle && !isMultiple) {
    return <Text>Not Single and not Multiple (This is a bug!)</Text>;
  }

  if (isMultiple && isSingle) {
    return <Text>Both Single and Multiple (This is a bug!)</Text>;
  }

  return (
    <>
      <TextField
        disabled={isMultiple}
        label={st(StrId.Title)}
        value={val(title, props.title)}
        onChange={(e, nv) => nv && setTitle(nv)}
      />
      <TooltipHost
        content={st(StrId.ArtistTooltip)}
        // This id is used on the tooltip itself, not the host
        // (so an element with this id only exists when the tooltip is shown)
        id="priArtistsId"
        calloutProps={{ gapSpace: 0 }}
        styles={{ root: { display: 'inline-block' } }}
        directionalHint={DirectionalHint.bottomAutoEdge}
      >
        <TextField
          label={st(StrId.Artists)}
          value={val(artist, props.artist)}
          onChange={(e, nv) => nv && setArtist(nv)}
          aria-describedby="priArtistsId"
        />
      </TooltipHost>
      <div className="metadata-specs">
        <TextField
          label={st(StrId.Album)}
          value={val(album, props.album)}
          onChange={(e, nv) => nv && setAlbum(nv)}
          style={{ width: 400 }}
        />
        <TextField
          label={st(StrId.Year)}
          value={val(year, props.year)}
          onChange={(e, nv) => (nv === '' || isNumber(nv)) && setYear(nv!)}
          style={{ width: 80 }}
        />
      </div>
      <div className="metadata-specs">
        <TextField
          disabled={isMultiple}
          label={st(StrId.TrackNum)}
          value={val(track, trackNum)}
          onChange={(e, nv) => nv && isNumber(nv) && setTrack(nv)}
          style={{ width: 60 }}
        />
        <TextField
          label={st(StrId.DiskNum)}
          value={val(disk, diskNum)}
          onChange={(e, nv) => (nv === '' || isNumber(nv)) && setDisk(nv!)}
          style={{ width: 60 }}
        />
        <TextField
          label={st(StrId.DiskName)}
          value={val(diskName, props.diskName)}
          onChange={(e, nv) => nv && setDiskName(nv)}
          style={{ width: 220 }}
        />
        <div>
          <div style={{ height: 13 }} />
          <Checkbox
            label={st(StrId.Compilation)}
            checked={isVa}
            onChange={setVa}
          />
          <div style={{ height: 5 }} />
          <Checkbox
            label={st(StrId.Soundtrack)}
            checked={isOST}
            onChange={setOST}
          />
        </div>
      </div>
      <div className="metadata-clear">
        <TooltipHost
          content={st(StrId.ArtistTooltip)}
          // This id is used on the tooltip itself, not the host
          // (so an element with this id only exists when the tooltip is shown)
          id="secArtistsId"
          calloutProps={{ gapSpace: 0 }}
          styles={{ root: { display: 'inline-block' } }}
          directionalHint={DirectionalHint.bottomAutoEdge}
        >
          <TextField
            style={{ width: 400 }}
            label={st(StrId.AdditionalArtists)}
            aria-describedby="secArtistsId"
            value={val(moreArtists, props.moreArtists)}
            onChange={(e, nv) => nv && setMoreArtists(nv)}
          />
        </TooltipHost>
        <DefaultButton onClick={() => setMoreArtists('')}>Clear</DefaultButton>
      </div>
      <div className="metadata-clear">
        <TooltipHost
          content={st(StrId.VariationsTooltip)}
          // This id is used on the tooltip itself, not the host
          // (so an element with this id only exists when the tooltip is shown)
          id="variationsId"
          calloutProps={{ gapSpace: 0 }}
          styles={{ root: { display: 'inline-block' } }}
          directionalHint={DirectionalHint.bottomAutoEdge}
        >
          <TextField
            style={{ width: 400 }}
            label={st(StrId.VariationsTooltip)}
            aria-describedby="variationsId"
            value={val(vars, props.variations)}
            onChange={(e, nv) => nv && setVars(nv)}
          />
        </TooltipHost>
        <DefaultButton onClick={() => setVars('')}>Clear</DefaultButton>
      </div>
      <div style={{ height: 10 }} />
      <div className="md-save-container">
        <PrimaryButton onClick={onSubmit}>Save</PrimaryButton>
      </div>
      <Image
        alt={st(StrId.AlbumCover)}
        src={coverUrl}
        imageFit={ImageFit.centerContain}
        height={350}
      />
      <br />
      <div>
        <DefaultButton text={st(StrId.ChooseFile)} onClick={onSelectFile} />
        &nbsp;
        <DefaultButton
          text={st(StrId.FromClipboard)}
          onClick={onImageFromClipboard}
        />
      </div>
    </>
  );
}
