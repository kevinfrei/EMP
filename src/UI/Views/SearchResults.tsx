import { Stack, Text } from '@fluentui/react';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-use-before-define
import { useRecoilValue } from 'recoil';
import { searchSel, searchTermAtom } from '../../Recoil/ReadOnly';
import { ViewProps } from './Selector';

export default function SearchResultsView({ hidden }: ViewProps): JSX.Element {
  const searchTerm = useRecoilValue(searchTermAtom);
  console.log('Searching:' + searchTerm);
  const searchResults = useRecoilValue(searchSel(searchTerm));
  const songText = searchResults.songs.join(';');
  const albumText = searchResults.albums.join(':');
  const artistText = searchResults.artists.join('/');
  return (
    <div
      style={hidden ? { visibility: 'hidden' } : {}}
      className="current-view"
    >
      <Stack>
        <Text>Songs</Text>
        <Text>{songText}</Text>
        <Text>Albums</Text>
        <Text>{albumText}</Text>
        <Text>Artist</Text>
        <Text>{artistText}</Text>
      </Stack>
    </div>
  );
}
