// @flow
import React from 'react';

const MixedSongLine = () => (
  <div>
    <span>01 - Title</span>
    <span>Arist</span>
    <span>Album</span>
  </div>
);
const MixedSongsView = () => (
  <>
    <MixedSongLine />
    <MixedSongLine />
    <MixedSongLine />
  </>
);

export default MixedSongsView;
