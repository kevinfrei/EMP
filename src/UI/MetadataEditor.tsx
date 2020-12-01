import { Checkbox, PrimaryButton, Stack, TextField } from '@fluentui/react';
import { MakeLogger, Type } from '@freik/core-utils';
import { FullMetadata, SongKey } from '@freik/media-utils';
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { allSongsState } from '../Recoil/ReadOnly';

const log = MakeLogger('MetadataEditor', true);

export function MetadataEditor(props: {
  forSong?: SongKey;
  artist?: string;
  album?: string;
  track?: string;
  title?: string;
  year?: string;
  va?: string;
  fullPath?: string;
}): JSX.Element {
  const allSongs = useRecoilValue(allSongsState);
  const [artist, setArtist] = useState<false | string>(false);
  const [album, setAlbum] = useState<false | string>(false);
  const [track, setTrack] = useState<false | string>(false);
  const [disk, setDisk] = useState<false | string>(false);
  const [title, setTitle] = useState<false | string>(false);
  const [year, setYear] = useState<false | string>(false);
  const [vaType, setVaType] = useState<false | 'ost' | 'va' | ''>(false);
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
  }, [props.forSong]);
  if (!Type.isString(props.forSong) || !Type.isString(props.fullPath)) {
    return <></>;
  }
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

    // Worst case: trigger a rescan of the music on the back end, I guess...

    const e = (v: string | false) => (v === false ? '' : v);
    const ed = (v: string | false) => (v === false ? undefined : v);
    const nd = (n: string | false) =>
      n === false ? undefined : Number.parseInt(n, 10);
    log(`onSubmit for song: ${props.forSong || ''}`);
    log('Originally:');
    log(props);
    log('updated to:');
    log(`Artist: ${e(artist)}`);
    log(`Album:  ${e(album)}`);
    if (disk) {
      const tn = '0' + val(track, trackNum);
      log(`Track:  ${disk}${tn.substr(tn.length - 2, 2)}`);
    } else if (track) {
      const dn = val(disk, diskNum);
      const tn = '0' + val(track, trackNum);
      log(`Track: ${dn}${tn.substr(tn.length - 2, 2)}`);
    } else {
      log('Track:');
    }
    log(`Title:  ${e(title)}`);
    log(`VAType: ${e(vaType)}`);
    log(`Year:   ${e(year)}`);
    const md: Partial<FullMetadata> = {
      originalPath: props.fullPath || '',
      artist: ed(artist),
      album: ed(album),
      year: nd(year),
      track: nd(trackNum),
      title: ed(title),
      vaType: vaType === false || vaType === '' ? undefined : vaType,
      disk: nd(diskNum),
      /*
        moreArtists?: string[],
        mix?: string[],
        */
    };
  };

  return (
    <>
      <TextField
        label="Title"
        value={val(title, props.title)}
        onChange={(e, nv) => nv && setTitle(nv)}
      />
      <TextField
        label="Artist"
        value={val(artist, props.artist)}
        onChange={(e, nv) => nv && setArtist(nv)}
      />
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          label="Album"
          value={val(album, props.album)}
          onChange={(e, nv) => nv && setAlbum(nv)}
          style={{ width: 450 }}
        />
        <TextField
          label="Year"
          value={val(year, props.year)}
          onChange={(e, nv) => (nv === '' || isNumber(nv)) && setYear(nv!)}
          style={{ width: 100 }}
        />
      </Stack>
      <Stack horizontal horizontalAlign="space-between">
        <TextField
          label="Track #"
          value={val(track, trackNum)}
          onChange={(e, nv) => nv && isNumber(nv) && setTrack(nv)}
          style={{ width: 100 }}
        />
        <TextField
          label="Disk #"
          value={val(disk, diskNum)}
          onChange={(e, nv) => (nv === '' || isNumber(nv)) && setDisk(nv!)}
          style={{ width: 100 }}
        />
        <Stack verticalAlign="space-between" style={{ marginRight: 20 }}>
          <div style={{ height: 10 }} />
          <Checkbox label="Compilation" checked={isVa} onChange={setVa} />
          <Checkbox label="Soundtrack" checked={isOST} onChange={setOST} />
        </Stack>
      </Stack>
      <div style={{ height: 10 }} />
      <Stack horizontal horizontalAlign="end">
        <PrimaryButton onClick={onSubmit} style={{ width: 100 }}>
          Save
        </PrimaryButton>
      </Stack>
    </>
  );
}
