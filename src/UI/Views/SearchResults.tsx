import { Stack, Text } from '@fluentui/react';
import { MakeLogger } from '@freik/core-utils';
import {
  Album,
  AlbumKey,
  Artist,
  ArtistKey,
  Song,
  SongKey,
} from '@freik/media-utils';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import {
  albumByKeySel,
  allAlbumsSel,
  allArtistsSel,
  allSongsSel,
  artistByKeySel,
  searchSel,
  searchTermAtom,
  songByKeySel,
} from '../../Recoil/ReadOnly';
import { AlbumFromSong, ArtistsFromAlbum, ArtistsFromSong } from '../SongList';
import { ViewProps } from './Selector';
import './styles/SearchResults.css';

const log = MakeLogger('SearchResults', true);

function SongItem({ id }: { id: SongKey }): JSX.Element {
  const song = useRecoilValue(songByKeySel(id));
  return (
    <span>
      <span>{song.title}</span>
      {ArtistsFromSong(song)}
      {AlbumFromSong(song)}
    </span>
  );
}

function SongList({ songs }: { songs: SongKey[] }): JSX.Element {
  return (
    <>
      {songs.map((val, index) => (
        <SongItem key={index} id={val} />
      ))}
    </>
  );
}

function AlbumItem({ id }: { id: AlbumKey }): JSX.Element {
  const album = useRecoilValue(albumByKeySel(id));
  return (
    <span>
      <span>
        {album.title}-{album.year}
      </span>
      <span>{ArtistsFromAlbum(album)}</span>
    </span>
  );
}

function AlbumList({ albums }: { albums: AlbumKey[] }): JSX.Element {
  return (
    <>
      {albums.map((val, index) => (
        <AlbumItem key={index} id={val} />
      ))}
    </>
  );
}

function ArtistItem({ id }: { id: ArtistKey }): JSX.Element {
  const artist = useRecoilValue(artistByKeySel(id));
  return (
    <span>
      {artist.name} - {artist.albums.length}
    </span>
  );
}

function ArtistList({ artists }: { artists: ArtistKey[] }): JSX.Element {
  return (
    <>
      {artists.map((val, index) => (
        <ArtistItem key={index} id={val} />
      ))}
    </>
  );
}

type SongEntry = { key: SongKey; song: Song };
type ArtistEntry = { key: ArtistKey; artist: Artist };
type AlbumEntry = { key: AlbumKey; album: Album };
type SearchEntry = SongEntry | AlbumEntry | ArtistEntry;

function SongEntries(keys: SongKey[], songs: Map<SongKey, Song>): SongEntry[] {
  return keys.map((v) => ({ key: v, song: songs.get(v)! }));
}

function ArtistEntries(
  keys: ArtistKey[],
  artists: Map<ArtistKey, Artist>,
): ArtistEntry[] {
  return keys.map((v) => ({ key: v, artist: artists.get(v)! }));
}

function AlbumEntries(
  keys: AlbumKey[],
  albums: Map<AlbumKey, Album>,
): AlbumEntry[] {
  return keys.map((v) => ({ key: v, album: albums.get(v)! }));
}

export default function SearchResultsView({ hidden }: ViewProps): JSX.Element {
  const searchTerm = useRecoilValue(searchTermAtom);
  const searchResults = useRecoilValue(searchSel(searchTerm));
  const songs = useRecoilValue(allSongsSel);
  const artists = useRecoilValue(allArtistsSel);
  const albums = useRecoilValue(allAlbumsSel);

  if (
    !searchResults.albums.length &&
    !searchResults.songs.length &&
    !searchResults.artists.length
  ) {
    return (
      <div
        style={hidden ? { visibility: 'hidden' } : {}}
        className="current-view empty-results"
      >
        <Text>No results found</Text>
      </div>
    );
  }

  const songRes = SongEntries(searchResults.songs, songs);
  const artRes = ArtistEntries(searchResults.artists, artists);
  const albRes = AlbumEntries(searchResults.albums, albums);
  const resultEntries: SearchEntry[] = [...songRes, ...artRes, ...albRes];
  log(resultEntries);
  // I need to create a group hierarchy like this:
  // Songs => Song Results
  // Artists => Artist List => Albums => Per Album Song Results
  // Albums => Album List => Per Album Song Results
  // To deal with that, I need unique keys for duplicate songs
  // the key should be : s<song>, r<artist><song>, l<album><song>
  // Sorting can't mess with the top level groups
  // We should start with Songs, Artist, and Albums expanded
  // which corresponds to the search results

  return (
    <div
      style={hidden ? { visibility: 'hidden' } : {}}
      className="current-view"
    >
      <Stack>
        <Text>Songs</Text>
        <SongList songs={searchResults.songs} />
        <Text>Albums</Text>
        <AlbumList albums={searchResults.albums} />
        <Text>Artist</Text>
        <ArtistList artists={searchResults.artists} />
      </Stack>
    </div>
  );
}
