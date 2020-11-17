import { Checkbox, PrimaryButton, Stack, TextField } from '@fluentui/react';
import { MakeLogger, Type } from '@freik/core-utils';
import { SongKey } from '@freik/media-utils';
import React, { useEffect, useState } from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define

const log = MakeLogger('MetadataEditor', true);

export function MetadataEditor(props: {
  forSong?: SongKey;
  artist?: string;
  album?: string;
  track?: string;
  title?: string;
  year?: string;
  va?: 'va' | 'ost';
}): JSX.Element {
  const [artist, setArtist] = useState<false | string>(false);
  const [album, setAlbum] = useState<false | string>(false);
  const [track, setTrack] = useState<false | string>(false);
  const [disk, setDisk] = useState<false | string>(false);
  const [title, setTitle] = useState<false | string>(false);
  const [year, setYear] = useState<false | string>(false);
  const [vaType, setVaType] = useState<false | string>(false);
  const trimmedTrack = props.track ? props.track.trim() : '';
  const diskNum =
    trimmedTrack.length > 2
      ? trimmedTrack.substr(0, trimmedTrack.length - 2)
      : '';
  const trackNum =
    trimmedTrack.length > 2
      ? trimmedTrack.substr(diskNum.length)
      : trimmedTrack;
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
  const isVa = vaType === 'va';
  const isOST = vaType === 'ost';
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

    log(`onSubmit for song: ${props.forSong || ''}`);
    log(artist);
    log(album);
    log(track);
    log(disk);
    log(title);
    log(vaType);
    log(year);
  };

  const val = (v: false | string, pv?: string) => (v !== false ? v : pv || '');
  return (
    <>
      <TextField
        label="Title"
        value={val(title, props.title)}
        onChange={(e, nv) => nv && setTitle(nv)}
      />
      <TextField
        label="Artist"
        defaultValue={props.artist || ''}
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
          onChange={(e, nv) => nv && isNumber(nv) && setYear(nv)}
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
          onChange={(e, nv) => nv && isNumber(nv) && setDisk(nv)}
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
