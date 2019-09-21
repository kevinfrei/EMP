// @flow
// @format

import React from 'react';
import Amplitude from 'amplitudejs';

import logo from './logo.svg';
import './App.css';

Amplitude.init([]);

const App = () => {
  const foo: string = 'Visible files:';
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit file <code>src/App.js</code> and save to reload.
        </p>
        <p>
          We are using Node.js v<span id="node-version" />, Chromium v
          <span id="chrome-version" />, and Electron v
          <span id="electron-version" />.
        </p>
        <p>
          {foo} <span id="files" />
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div id="amplitude-player">
        <div id="amplitude-left">
          <img data-amplitude-song-info="cover_art_url" className="album-art" />
          <div
            className="amplitude-visualization"
            id="large-visualization"
          ></div>
          <div id="player-left-bottom">
            <div id="time-container">
              <span className="current-time">
                <span className="amplitude-current-minutes"></span>:
                <span className="amplitude-current-seconds"></span>
              </span>
              <div id="progress-container">
                <div className="amplitude-wave-form"></div>
                <input type="range" className="amplitude-song-slider" />
                <progress
                  id="song-played-progress"
                  className="amplitude-song-played-progress"
                ></progress>
                <progress
                  id="song-buffered-progress"
                  className="amplitude-buffered-progress"
                  value="0"
                ></progress>
              </div>
              <span className="duration">
                <span className="amplitude-duration-minutes"></span>:
                <span className="amplitude-duration-seconds"></span>
              </span>
            </div>

            <div id="control-container">
              <div id="repeat-container">
                <div className="amplitude-repeat" id="repeat"></div>
                <div
                  className="amplitude-shuffle amplitude-shuffle-off"
                  id="shuffle"
                ></div>
              </div>

              <div id="central-control-container">
                <div id="central-controls">
                  <div className="amplitude-prev" id="previous"></div>
                  <div className="amplitude-play-pause" id="play-pause"></div>
                  <div className="amplitude-next" id="next"></div>
                </div>
              </div>

              <div id="volume-container">
                <div className="volume-controls">
                  <div className="amplitude-mute amplitude-not-muted"></div>
                  <input type="range" className="amplitude-volume-slider" />
                  <div className="ms-range-fix"></div>
                </div>
                <div
                  className="amplitude-shuffle amplitude-shuffle-off"
                  id="shuffle-right"
                ></div>
              </div>
            </div>

            <div id="meta-container">
              <span
                data-amplitude-song-info="name"
                className="song-name"
              ></span>

              <div className="song-artist-album">
                <span data-amplitude-song-info="artist"></span>
                <span data-amplitude-song-info="album"></span>
              </div>
            </div>
          </div>
        </div>
        <div id="amplitude-right">
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="0"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">
                Risin' High (feat Raashan Ahmad)
              </span>
              <span className="song-artist">Ancient Astronauts</span>
            </div>
            <a
              href="https://switchstancerecordings.bandcamp.com/track/risin-high-feat-raashan-ahmad"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">3:30</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="1"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">The Gun</span>
              <span className="song-artist">Lorn</span>
            </div>
            <a
              href="https://lorn.bandcamp.com/"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">3:16</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="2"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Anvil</span>
              <span className="song-artist">Lorn</span>
            </div>
            <a
              href="https://lorn.bandcamp.com/"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">3:32</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="3"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">I Came Running</span>
              <span className="song-artist">Ancient Astronauts</span>
            </div>
            <a
              href="https://switchstancerecordings.bandcamp.com/track/i-came-running"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">3:30</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="4"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">First Snow</span>
              <span className="song-artist">Emancipator</span>
            </div>
            <a
              href="https://emancipator.bandcamp.com"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">5:12</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="5"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Terrain</span>
              <span className="song-artist">pg.lost</span>
            </div>
            <a
              href="https://pglost.bandcamp.com/track/terrain"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">5:29</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="6"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Vorel</span>
              <span className="song-artist">Russian Circles</span>
            </div>
            <a
              href="https://russiancircles.bandcamp.com/track/vorel"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">5:29</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="7"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Intro / Sweet Glory</span>
              <span className="song-artist">Jimkata</span>
            </div>
            <a
              href="http://jimkata.bandcamp.com/track/intro-sweet-glory"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">2:39</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="8"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Offcut #6</span>
              <span className="song-artist">Little People</span>
            </div>
            <a
              href="https://littlepeople.bandcamp.com/track/offcut-6"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">1:00</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="9"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Dusk To Dawn</span>
              <span className="song-artist">Emancipator</span>
            </div>
            <a
              href="https://emancipator.bandcamp.com/track/dusk-to-dawn-2"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">5:25</span>
          </div>
          <div
            className="song amplitude-song-container amplitude-play-pause"
            data-amplitude-song-index="10"
          >
            <div className="song-now-playing-icon-container">
              <div className="play-button-container"></div>
              <img
                className="now-playing"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/now-playing.svg"
              />
            </div>
            <div className="song-meta-data">
              <span className="song-title">Anthem</span>
              <span className="song-artist">Emancipator</span>
            </div>
            <a
              href="https://emancipator.bandcamp.com/track/anthem"
              className="bandcamp-link"
              target="_blank"
            >
              <img
                className="bandcamp-grey"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-grey.svg"
              />
              <img
                className="bandcamp-white"
                src="https://521dimensions.com/img/open-source/amplitudejs/blue-player/bandcamp-white.svg"
              />
            </a>
            <span className="song-duration">5:40</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;

/*
// When the bandcamp link is pressed, stop all propagation so AmplitudeJS doesn't
// play the song.

let bandcampLinks = document.getElementsByClassName('bandcamp-link');

for( var i = 0; i < bandcampLinks.length; i++ ){
	bandcampLinks[i].addEventListener('click', function(e){
		e.stopPropagation();
	});
}


let songElements = document.getElementsByClassName('song');

for( var i = 0; i < songElements.length; i++ ){
//		Ensure that on mouseover, CSS styles don't get messed up for active songs.

	songElements[i].addEventListener('mouseover', function(){
		this.style.backgroundColor = '#00A0FF';

		this.querySelectorAll('.song-meta-data .song-title')[0].style.color = '#FFFFFF';
		this.querySelectorAll('.song-meta-data .song-artist')[0].style.color = '#FFFFFF';

		if( !this.classList.contains('amplitude-active-song-container') ){
			this.querySelectorAll('.play-button-container')[0].style.display = 'block';
		}

		this.querySelectorAll('img.bandcamp-grey')[0].style.display = 'none';
		this.querySelectorAll('img.bandcamp-white')[0].style.display = 'block';
		this.querySelectorAll('.song-duration')[0].style.color = '#FFFFFF';
	});

	// Ensure that on mouseout, CSS styles don't get messed up for active songs.

	songElements[i].addEventListener('mouseout', function(){
		this.style.backgroundColor = '#FFFFFF';
		this.querySelectorAll('.song-meta-data .song-title')[0].style.color = '#272726';
		this.querySelectorAll('.song-meta-data .song-artist')[0].style.color = '#607D8B';
		this.querySelectorAll('.play-button-container')[0].style.display = 'none';
		this.querySelectorAll('img.bandcamp-grey')[0].style.display = 'block';
		this.querySelectorAll('img.bandcamp-white')[0].style.display = 'none';
		this.querySelectorAll('.song-duration')[0].style.color = '#607D8B';
	});

	// Show and hide the play button container on the song when the song is clicked.
	songElements[i].addEventListener('click', function(){
		this.querySelectorAll('.play-button-container')[0].style.display = 'none';
	});
}

// Initializes AmplitudeJS

Amplitude.init({
	"songs": [
		{
			"name": "Risin' High (feat Raashan Ahmad)",
			"artist": "Ancient Astronauts",
			"album": "We Are to Answer",
			"url": "https://521dimensions.com/song/Ancient Astronauts - Risin' High (feat Raashan Ahmad).mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/we-are-to-answer.jpg"
		},
		{
			"name": "The Gun",
			"artist": "Lorn",
			"album": "Ask The Dust",
			"url": "https://521dimensions.com/song/08 The Gun.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/ask-the-dust.jpg"
		},
		{
			"name": "Anvil",
			"artist": "Lorn",
			"album": "Anvil",
			"url": "https://521dimensions.com/song/LORN - ANVIL.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/anvil.jpg"
		},
		{
			"name": "I Came Running",
			"artist": "Ancient Astronauts",
			"album": "We Are to Answer",
			"url": "https://521dimensions.com/song/ICameRunning-AncientAstronauts.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/we-are-to-answer.jpg"
		},
		{
			"name": "First Snow",
			"artist": "Emancipator",
			"album": "Soon It Will Be Cold Enough",
			"url": "https://521dimensions.com/song/FirstSnow-Emancipator.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/soon-it-will-be-cold-enough.jpg"
		},
		{
			"name": "Terrain",
			"artist": "pg.lost",
			"album": "Key",
			"url": "https://521dimensions.com/song/Terrain-pglost.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/key.jpg"
		},
		{
			"name": "Vorel",
			"artist": "Russian Circles",
			"album": "Guidance",
			"url": "https://521dimensions.com/song/Vorel-RussianCircles.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/guidance.jpg"
		},
		{
			"name": "Intro / Sweet Glory",
			"artist": "Jimkata",
			"album": "Die Digital",
			"url": "https://521dimensions.com/song/IntroSweetGlory-Jimkata.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/die-digital.jpg"
		},
		{
			"name": "Offcut #6",
			"artist": "Little People",
			"album": "We Are But Hunks of Wood Remixes",
			"url": "https://521dimensions.com/song/Offcut6-LittlePeople.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/we-are-but-hunks-of-wood.jpg"
		},
		{
			"name": "Dusk To Dawn",
			"artist": "Emancipator",
			"album": "Dusk To Dawn",
			"url": "https://521dimensions.com/song/DuskToDawn-Emancipator.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/from-dusk-to-dawn.jpg"
		},
		{
			"name": "Anthem",
			"artist": "Emancipator",
			"album": "Soon It Will Be Cold Enough",
			"url": "https://521dimensions.com/song/Anthem-Emancipator.mp3",
			"cover_art_url": "https://521dimensions.com/img/open-source/amplitudejs/album-art/soon-it-will-be-cold-enough.jpg"
		}
	],
  "callbacks": {
        'play': function(){
            document.getElementById('album-art').style.visibility = 'hidden';
            document.getElementById('large-visualization').style.visibility = 'visible';
        },

        'pause': function(){
            document.getElementById('album-art').style.visibility = 'visible';
            document.getElementById('large-visualization').style.visibility = 'hidden';
        }
    },
  waveforms: {
    sample_rate: 50
  }
});
document.getElementById('large-visualization').style.height = document.getElementById('album-art').offsetWidth + 'px';
*/
