import { Type } from '@freik/core-utils';
import { AlbumKey, ArtistKey, Song } from '@freik/media-core';
import { useRecoilValue } from 'recoil';
import { getAlbumByKeyFamily, getArtistStringFamily } from '../Recoil/ReadOnly';

export function ArtistNameFromArtistIds({
  artistIds,
}: {
  artistIds: ArtistKey[];
}): JSX.Element {
  return <>{useRecoilValue(getArtistStringFamily(artistIds))}</>;
}

function AlbumNameForSong({ song }: { song: Song }): JSX.Element {
  const album = useRecoilValue(getAlbumByKeyFamily(song.albumId));
  const diskNum = Math.floor(song.track / 100);
  if (
    diskNum > 0 &&
    Type.has(album, 'diskNames') &&
    Type.isArrayOfString(album.diskNames) &&
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
  const album = useRecoilValue(getAlbumByKeyFamily(albumId));
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
