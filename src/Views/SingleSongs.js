// @flow

import React from 'react';

const SingleSongLine = () => (
  <div>
    <span>01 - Title</span>
    <span>Arist</span>
    <span>Album</span>
  </div>
);

const SingleSongs = () => (
  <>
    <SingleSongLine/>
    <SingleSongLine/>
  </>
);

export default SingleSongs;
