import { AlbumKey, ArtistKey, Song } from '@freik/media-core';
import { hasFieldType, isArrayOfString } from '@freik/typechk';
import { useAtomValue } from 'jotai';
import { albumByKeyFuncFam, artistStringFuncFam } from '../Jotai/MusicDatabase';

export function ArtistNameFromArtistIds({
  artistIds,
}: {
  artistIds: ArtistKey[];
}): JSX.Element {
  return <>{useAtomValue(artistStringFuncFam(artistIds))}</>;
}

function AlbumNameForSong({ song }: { song: Song }): JSX.Element {
  const album = useAtomValue(albumByKeyFuncFam(song.albumId));
  const diskNum = Math.floor(song.track / 100);
  if (
    diskNum > 0 &&
    hasFieldType(album, 'diskNames', isArrayOfString) &&
    album.diskNames.length >= diskNum &&
    album.diskNames[diskNum - 1].length > 0
  ) {
    return (
      <>
        {album.title}: {album.diskNames[diskNum - 1]}
      </>
    );
  }
  return <>{album.title}</>;
}

function YearForAlbum({ albumId }: { albumId: AlbumKey }): JSX.Element {
  const album = useAtomValue(albumByKeyFuncFam(albumId));
  return <>{album.year !== 0 ? album.year : ''}</>;
}

export function ArtistsForSongRender(theSong: Song): JSX.Element {
  return <ArtistNameFromArtistIds artistIds={theSong.artistIds} />;
}

export function AlbumForSongRender(song: Song): JSX.Element {
  return <AlbumNameForSong song={song} />;
}

export function YearForSongRender(song: Song): JSX.Element {
  return <YearForAlbum albumId={song.albumId} />;
}
