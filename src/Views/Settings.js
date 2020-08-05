// @flow

import * as React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { useRecoilState } from 'recoil';

import Store from '../MyStore';
import { locations } from '../Atoms';

import { VerticalScrollDiv } from '../Scrollables';

import deletePic from '../img/delete.svg';
import addPic from '../img/add.svg';

import './styles/Settings.css';

const removeFromSet = (set: Array<string>, val: string): Array<string> => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs() {
  return window.remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
  });
}

function sortPopup(item) {
  const names: Array<string> = item.names;
  const selected = item.types.indexOf(item.value);
  const select = (key) => item.setter(key);
  return (
    <Row>
      <Col xs={3} style={{ height: '35px' }}>
        <span style={{ float: 'right' }}>View {item.title} by </span>
      </Col>
      <Col>
        <DropdownButton size="sm" title={item.names[selected]}>
          {names.map((val, index) => (
            <Dropdown.Item
              key={index}
              eventKey={item.types[index]}
              active={index === selected}
              onSelect={select}
            >
              {val}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </Col>
    </Row>
  );
}

const RecoilLocations = () => {
  const [recoilLocations, setRecoilLocations] = useRecoilState(locations);
  return (
    <>
      {recoilLocations.map((elem) => (
        <Row key={elem}>
          <Col xs={1}>
            <img
              className="delete-pic pic-button"
              src={deletePic}
              alt="Delete Item"
              onClick={() =>
                setRecoilLocations(removeFromSet(recoilLocations, elem))
              }
            />
          </Col>
          <Col>{elem}</Col>
        </Row>
      ))}
      <Row>
        <Col xs={1}>
          <img
            className="add-pic pic-button"
            src={addPic}
            alt="add source"
            onClick={() => {
              const locs: ?Array<string> = GetDirs();
              if (locs) {
                setRecoilLocations([...locs, ...recoilLocations]);
              }
            }}
          />
        </Col>
        <Col>
          <em>Add new location to scan</em>
        </Col>
      </Row>
    </>
  );
};

const Settings = () => {
  const store = Store.useStore();
  const articles = store.get('SortWithArticles');
  const setArticles = store.set('SortWithArticles');

  const album = {
    title: 'Album',
    value: store.get('AlbumListSort'),
    setter: store.set('AlbumListSort'),
    types: ['AlbumTitle', 'AlbumYear', 'ArtistAlbum', 'ArtistYear'],
    names: ['Title', 'Year', 'Artist, then Title', 'Artist, then Year'],
  };
  const artist = {
    title: 'Artist',
    value: store.get('ArtistListSort'),
    setter: store.set('ArtistListSort'),
    types: ['AlbumCount', 'ArtistName', 'SongCount'],
    names: ['# of Albums', 'Name', '# of songs'],
  };
  const song = {
    title: 'Song',
    value: store.get('SongListSort'),
    setter: store.set('SongListSort'),
    types: ['SongTitle', 'ArtistAlbum', 'AlbumTrack'],
    names: ['Title', 'Artist, then Album', 'Album'],
  };

  return (
    <>
      <div id="current-view" />
      <VerticalScrollDiv scrollId="settingsPos" layoutId="current-view">
        <React.Suspense fallback={<div>Loading Locations...</div>}>
          <Card>
            <Card.Body>
              <Card.Title>Music Locations</Card.Title>
              <Container>
                <RecoilLocations />
              </Container>
            </Card.Body>
          </Card>
        </React.Suspense>
        <Card>
          <Card.Body>
            <Card.Title>Sorting Preferences</Card.Title>
            <Container>
              {sortPopup(album)}
              {sortPopup(artist)}
              {sortPopup(song)}
              <Row>
                <Col xs={3}>
                  <span style={{ float: 'right' }}>Consider articles</span>
                </Col>
                <Col>
                  <input
                    type="checkbox"
                    checked={articles}
                    onChange={() => setArticles(!articles)}
                  ></input>
                </Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
      </VerticalScrollDiv>
    </>
  );
};
export default Settings;
