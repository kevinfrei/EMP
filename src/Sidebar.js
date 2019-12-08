// @flow
import React from 'react';
import Store from './MyStore';

import recentPic from './img/recent.svg';
import albumPic from './img/album.svg';
import artistPic from './img/artist.svg';
import songPic from './img/song.svg';
import playlistPic from './img/playlist.svg';
import nowPlayingPic from './img/playing.svg';
import settingsPic from './img/settings.svg';

import './Sidebar.css';

import type { ViewNames } from './MyStore';

const Sidebar = () => {
  let store = Store.useStore();
  const plain = {};
  const selected = {
    background: 'rgba(200,200,200,.3)',
    borderRadius: '6px'
  };
  const is = (nm: ViewNames) =>
    store.get('curView') === nm ? selected : plain;
  const cl = (nm: ViewNames) => () => store.set('curView')(nm);
  return (
    <div id="sidebar">
      <div className="search-bar">
        <input id="search" type="text" placeholder="Search" />
      </div>
      <br />
      <div
        className="sidebar-container"
        style={is('recent')}
        onClick={cl('recent')}
      >
        <img src={recentPic} className="sidebar-icon" alt="recent"></img>
        <span className="sidebar-text">Recently Added</span>
      </div>
      <div
        className="sidebar-container"
        style={is('album')}
        onClick={cl('album')}
      >
        <img src={albumPic} className="sidebar-icon" alt="album"></img>
        <span className="sidebar-text">Albums</span>
      </div>
      <div
        className="sidebar-container"
        style={is('artist')}
        onClick={cl('artist')}
      >
        <img src={artistPic} className="sidebar-icon" alt="artist"></img>
        <span className="sidebar-text">Artists</span>
      </div>
      <div
        className="sidebar-container"
        style={is('song')}
        onClick={cl('song')}
      >
        <img src={songPic} className="sidebar-icon" alt="song"></img>
        <span className="sidebar-text">Songs</span>
      </div>
      <div
        className="sidebar-container"
        style={is('playlist')}
        onClick={cl('playlist')}
      >
        <img src={playlistPic} className="sidebar-icon" alt="playlist"></img>
        <span className="sidebar-text">Playlists</span>
      </div>
      <div
        className="sidebar-container"
        style={is('current')}
        onClick={cl('current')}
      >
        <img
          src={nowPlayingPic}
          className="sidebar-icon"
          alt="now playing"
        ></img>
        <span className="sidebar-text">Now Playing</span>
      </div>
      <hr />
      <div
        className="sidebar-container"
        style={is('settings')}
        onClick={cl('settings')}
      >
        <img src={settingsPic} className="sidebar-icon" alt="settings"></img>
        <span className="sidebar-text">Settings</span>
      </div>
    </div>
  );
};

export default Sidebar;
