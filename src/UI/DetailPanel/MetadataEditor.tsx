import {
  Checkbox,
  DefaultButton,
  DirectionalHint,
  Image,
  ImageFit,
  PrimaryButton,
  Stack,
  Text,
  TextField,
  TooltipHost,
} from '@fluentui/react';
import { useId } from '@fluentui/react-hooks';
import {
  AlbumKey,
  FullMetadata,
  MakeError,
  MakeLogger,
  Media,
  SongKey,
  Type,
} from '@freik/core-utils';
import { useEffect, useState } from 'react';
import { CallbackInterface, useRecoilCallback, useRecoilValue } from 'recoil';
import { SetMediaInfo } from '../../ipc';
import {
  ImageFromClipboard,
  IsDev,
  ShowOpenDialog,
  UploadFileForAlbum,
  UploadFileForSong,
  UploadImageForAlbum,
  UploadImageForSong,
} from '../../MyWindow';
import { albumCoverUrlFamily, picCacheAvoiderFamily } from '../../Recoil/Local';
import { getAlbumKeyForSongKeyFamily } from '../../Recoil/ReadOnly';
import { onRejected } from '../../Tools';

const log = MakeLogger('MetadataEditor', false && IsDev());
const err = MakeError('MetadataEditor-err'); // eslint-disable-line

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
  // These are for tooltips in FluentUI
  const priArtistsId = useId('md-priArtists');
  const secArtistsId = useId('md-secArtists');
  const variationsId = useId('md-variations');

  const isMultiple = !props.forSong && Type.isArrayOfString(props.forSongs);
  const isSingle = Type.isString(props.forSong) && !props.forSongs;

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
  }, [props.forSong]);

  // This is a helper to read the overridden value (from state) if it's set
  // otherwise, fall back to the pv (props.val) data (and then empty string)
  const val = (v: false | string, pv?: string) => (v !== false ? v : pv || '');
  // The diskNum and trackNum are extracted from the single
  const trimmedTrack = (props.track || '').trim();
  const diskNum =
    trimmedTrack.length > 2
      ? trimmedTrack.substr(0, trimmedTrack.length - 2)
      : '';
  const trackNum =
    trimmedTrack.length > 2
      ? Number.parseInt(trimmedTrack.substr(diskNum.length), 10).toString()
      : trimmedTrack;
  const isVa = val(vaType, props.va) === 'va';
  const isOST = val(vaType, props.va) === 'ost';
  const setVa = () => setVaType(isVa ? '' : 'va');
  const setOST = () => setVaType(isOST ? '' : 'ost');
  const isNumber = (vl?: string) => {
    if (Type.isString(vl)) {
      const num = Number.parseInt(vl, 10);
      return num.toString() === vl.trim() && vl.trim() !== 'NaN';
    }
    return false;
  };

  const onSubmit = () => {
    // TODO: Save the changed values to the metadata override 'cache'
    // and reflect those changes in the music DB

    // Worst case: trigger a rescan of the music on the back end, I guess :(

    for (const songKey of Type.isArrayOfString(props.forSongs)
      ? props.forSongs
      : [props.forSong]) {
      log('Originally:');
      log(props);
      log('updated to:');
      const md: Partial<FullMetadata> = { originalPath: '*' + songKey };
      if (artist) {
        md.artist = Media.splitArtistString(artist);
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
      if (vars !== false) {
        md.variations = vars.split(';').map((s) => s.trim());
      }
      if (moreArtists !== false) {
        md.moreArtists = Media.splitArtistString(moreArtists);
      }
      log(md);
      SetMediaInfo(md).catch(onRejected('Saving Metadata failed'));
    }
  };

  const uploadImage = async (
    cbInterface: CallbackInterface,
    uploadSong: (sk: SongKey) => Promise<void>,
    uploadAlbum: (ak: AlbumKey) => Promise<void>,
  ) => {
    // Easy: one song:
    if (props.forSong !== undefined) {
      await uploadSong(props.forSong);
      const albumKey = cbInterface.snapshot
        .getLoadable(getAlbumKeyForSongKeyFamily(props.forSong))
        .valueOrThrow();
      setTimeout(
        () => cbInterface.set(picCacheAvoiderFamily(albumKey), (p) => p + 1),
        250,
      );
    } else {
      // Messy: Multiple songs
      const albumsSet: Set<AlbumKey> = new Set();
      for (const song of props.forSongs!) {
        const albumKey = cbInterface.snapshot
          .getLoadable(getAlbumKeyForSongKeyFamily(song))
          .valueOrThrow();
        if (albumsSet.has(albumKey)) {
          continue;
        }
        albumsSet.add(albumKey);
        await uploadAlbum(albumKey);
        // This bonks the URL so it will be reloaded after we've uploaded the image
        setTimeout(
          () => cbInterface.set(picCacheAvoiderFamily(albumKey), (p) => p + 1),
          250,
        );
      }
    }
  };

  const onImageFromClipboard = useRecoilCallback((cbInterface) => async () => {
    const img = ImageFromClipboard();
    if (img !== undefined) {
      await uploadImage(
        cbInterface,
        async (sk: SongKey) => await UploadImageForSong(sk, img),
        async (ak: AlbumKey) => await UploadImageForAlbum(ak, img),
      );
    }
  });
  const onSelectFile = useRecoilCallback((cbInterface) => async () => {
    const selected = await ShowOpenDialog({
      title: 'Select Cover Art image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
    });
    if (selected !== undefined) {
      await uploadImage(
        cbInterface,
        async (sk: SongKey) => await UploadFileForSong(sk, selected[0]),
        async (ak: AlbumKey) => await UploadFileForAlbum(ak, selected[0]),
      );
    }
  });
  const coverUrl = useRecoilValue(albumCoverUrlFamily(props.albumId || '___'));
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
        label="Title"
        value={val(title, props.title)}
        onChange={(e, nv) => nv && setTitle(nv)}
      />
      <TooltipHost
        content="Multiple artists are specified like this: 'Artist 1, Artist 2 & Artist 3'"
        // This id is used on the tooltip itself, not the host
        // (so an element with this id only exists when the tooltip is shown)
        id={priArtistsId}
        calloutProps={{ gapSpace: 0 }}
        styles={{ root: { display: 'inline-block' } }}
        directionalHint={DirectionalHint.bottomAutoEdge}
      >
        <TextField
          label="Artist(s)"
          value={val(artist, props.artist)}
          onChange={(e, nv) => nv && setArtist(nv)}
          aria-describedby={priArtistsId}
        />
      </TooltipHost>
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          label="Album"
          value={val(album, props.album)}
          onChange={(e, nv) => nv && setAlbum(nv)}
          style={{ width: 400 }}
        />
        <TextField
          label="Year"
          value={val(year, props.year)}
          onChange={(e, nv) => (nv === '' || isNumber(nv)) && setYear(nv!)}
          style={{ width: 80 }}
        />
      </Stack>
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          disabled={isMultiple}
          label="Track #"
          value={val(track, trackNum)}
          onChange={(e, nv) => nv && isNumber(nv) && setTrack(nv)}
          style={{ width: 100 }}
        />
        <Stack horizontal verticalAlign="end">
          <TextField
            label="Disk #"
            value={val(disk, diskNum)}
            onChange={(e, nv) => (nv === '' || isNumber(nv)) && setDisk(nv!)}
            style={{ width: 100 }}
          />
          &nbsp;
          <DefaultButton>Clear</DefaultButton>
        </Stack>
        <Stack
          verticalAlign="space-evenly"
          style={{ marginTop: 15, marginRight: 20, width: 85 }}
        >
          <Checkbox label="Compilation" checked={isVa} onChange={setVa} />
          <Checkbox label="Soundtrack" checked={isOST} onChange={setOST} />
        </Stack>
      </Stack>
      <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
        <TooltipHost
          content="Multiple artists are specified like this: 'Artist 1, Artist 2 & Artist 3'"
          // This id is used on the tooltip itself, not the host
          // (so an element with this id only exists when the tooltip is shown)
          id={secArtistsId}
          calloutProps={{ gapSpace: 0 }}
          styles={{ root: { display: 'inline-block' } }}
          directionalHint={DirectionalHint.bottomAutoEdge}
        >
          <TextField
            style={{ width: 400 }}
            label="Additional Artist(s)"
            aria-describedby={secArtistsId}
            value={val(moreArtists, props.moreArtists)}
            onChange={(e, nv) => nv && setMoreArtists(nv)}
          />
        </TooltipHost>
        <DefaultButton onClick={() => setMoreArtists('')}>Clear</DefaultButton>
      </Stack>
      <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
        <TooltipHost
          content="Separate vartiations with a semicolon"
          // This id is used on the tooltip itself, not the host
          // (so an element with this id only exists when the tooltip is shown)
          id={variationsId}
          calloutProps={{ gapSpace: 0 }}
          styles={{ root: { display: 'inline-block' } }}
          directionalHint={DirectionalHint.bottomAutoEdge}
        >
          <TextField
            style={{ width: 400 }}
            label="Variation(s)"
            aria-describedby={variationsId}
            value={val(vars, props.variations)}
            onChange={(e, nv) => nv && setVars(nv)}
          />
        </TooltipHost>
        <DefaultButton onClick={() => setVars('')}>Clear</DefaultButton>
      </Stack>
      <div style={{ height: 10 }} />
      <Stack horizontal horizontalAlign="end">
        <PrimaryButton onClick={onSubmit}>Save</PrimaryButton>
      </Stack>
      <Image
        alt="Album Cover"
        src={coverUrl}
        imageFit={ImageFit.centerContain}
        height={350}
      />
      <br />
      <Stack horizontal horizontalAlign="center">
        <DefaultButton text="Choose File..." onClick={onSelectFile} />
        &nbsp;
        <DefaultButton text="From Clipboard" onClick={onImageFromClipboard} />
      </Stack>
    </>
  );
}
