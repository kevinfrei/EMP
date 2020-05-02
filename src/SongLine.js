// @flow

import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import FormControl from 'react-bootstrap/FormControl';
import { Comparisons } from 'my-utils';

import Store from './MyStore';

import { GetDataForSong } from './DataAccess';

import type { SongKey, StoreState } from './MyStore';

export type SongHandler = (store: StoreState, songKey: SongKey) => void;

// template: #TRLC
// #: Track
// T: Title
// R: aRtist
// L: aLbum
// C: Children (for adding buttons/decorators/whatnot)
export type SongLineProps = {
  songKey: SongKey,
  onClick?: SongHandler,
  onDoubleClick?: SongHandler,
  onAuxClick?: SongHandler,
  template?: string,
  children?: React$Node,
  props?: Array<Object>,
};

export default function SongLine({
  songKey,
  onClick,
  onDoubleClick,
  onAuxClick,
  template,
  children,
  ...props
}: /*  as,
  elemAs,*/
SongLineProps) {
  const store = Store.useStore();
  const elementTemplate = (template || 'LR#TC').toUpperCase();
  const data = GetDataForSong(store, songKey);
  const elements = [...elementTemplate].map((chr) => {
    switch (chr) {
      case '#':
        return (
          <span key="#" className="songTrack">
            {data.track}
          </span>
        );
      case 'L':
        return (
          <span key="L" className="songAlbum">
            {data.album}
          </span>
        );
      case 'R':
        return (
          <span key="R" className="songArtist">
            {data.artist}
          </span>
        );
      case 'T':
        return (
          <span key="T" className="songTitle">
            {data.title}
          </span>
        );
      case 'C':
        return <React.Fragment key="C">{children || ''}</React.Fragment>;
      default:
        throw new Error(
          `Invalid template for SongLine: ${chr} can only be one of L, R, #, T, C`
        );
    }
  });
  const nothing: SongHandler = (store, key) => {};
  const click = onClick || nothing;
  const double = onDoubleClick || nothing;
  const aux = onAuxClick || nothing;
  return (
    <div
      onClick={() => click(store, songKey)}
      onDoubleClick={() => double(store, songKey)}
      onAuxClick={() => aux(store, songKey)}
      {...props}
    >
      {elements}
    </div>
  );
}
