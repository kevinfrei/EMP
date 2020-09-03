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
import {
  SortWithArticles,
  AlbumListSort,
  ArtistListSort,
  SongListSort,
  SyncLoc,
  syncedAtom,
} from '../Atoms';

import { VerticalScrollDiv } from '../Scrollables';

import deletePic from '../img/delete.svg';
import addPic from '../img/add.svg';

import './styles/Settings.css';

declare interface MyWindow extends Window {
  remote: Electron.Remote;
}
declare var window: MyWindow;

declare type PopupItem = {
  title: string;
  syncedAtom: syncedAtom<string>;
  types: string[];
  names: string[];
};

const removeFromSet = (set: string[], val: string): string[] => {
  const newSet = new Set(set);
  newSet.delete(val);
  return [...newSet];
};

function GetDirs() {
  return window.remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
  });
}

function SortPopup({ item }: { item: PopupItem }): JSX.Element {
  const [value, setter] = useRecoilState(item.syncedAtom.atom);
  const names: string[] = item.names;
  const selected = value ? item.types.indexOf(value) : -1;
  const select = (key: string | null) => setter(key);
  const SyncingElement = item.syncedAtom.AtomSyncer;
  return (
    <Row>
      <Col xs={3} style={{ height: '35px' }}>
        <SyncingElement />
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

function RecoilLocations() {
  const [newLoc, setNewLoc] = useRecoilState(SyncLoc.atom);
  return (
    <>
      {(newLoc || []).map((elem) => (
        <Row key={elem}>
          <Col xs={1}>
            <img
              className="delete-pic pic-button"
              src={deletePic}
              alt="Delete Item"
              onClick={() => setNewLoc(removeFromSet(newLoc!, elem))}
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
              const locs: string[] | undefined = GetDirs();
              if (locs) {
                setNewLoc([...locs, ...newLoc]);
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
}

function ArticleSorting() {
  const [articles, setArticles] = useRecoilState(SortWithArticles.atom);
  return (
    <Row>
      <Col xs={3}>
        <span style={{ float: 'right' }}>Consider articles</span>
      </Col>
      <Col>
        <input
          type="checkbox"
          checked={articles === true}
          onChange={() => setArticles(!articles)}
        ></input>
      </Col>
    </Row>
  );
}

const Settings = () => {
  const store = Store.useStore();
  const album = {
    title: 'Album',
    syncedAtom: AlbumListSort,
    types: ['AlbumTitle', 'AlbumYear', 'ArtistAlbum', 'ArtistYear'],
    names: ['Title', 'Year', 'Artist, then Title', 'Artist, then Year'],
  };
  const artist = {
    title: 'Artist',
    syncedAtom: ArtistListSort,
    types: ['AlbumCount', 'ArtistName', 'SongCount'],
    names: ['# of Albums', 'Name', '# of songs'],
  };
  const song = {
    title: 'Song',
    syncedAtom: SongListSort,
    types: ['SongTitle', 'ArtistAlbum', 'AlbumTrack'],
    names: ['Title', 'Artist, then Album', 'Album'],
  };

  return (
    <>
      <div id="current-view" />
      <React.Suspense fallback={<div>Loading Locations...</div>}>
        <VerticalScrollDiv scrollId="settingsPos" layoutId="current-view">
          <Card>
            <Card.Body>
              <Card.Title>Music Locations</Card.Title>
              <Container>
                <SyncLoc.AtomSyncer />
                <RecoilLocations />
              </Container>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Card.Title>Sorting Preferences</Card.Title>
              <Container>
                <SortPopup item={album} />
                <SortPopup item={artist} />
                <SortPopup item={song} />
                <ArticleSorting />
              </Container>
            </Card.Body>
          </Card>
        </VerticalScrollDiv>
      </React.Suspense>
    </>
  );
};
export default Settings;
