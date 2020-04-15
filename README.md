# It's a slowly-turning-into-something Electron-based local music player
### Because iTunes, er, "Music" doesn't play flac :/
* Why? Because Apple is lame.

I'm old. I have a whole lot of music that I purchased on CD's over the past
many, many years. I like having high quality music playable from the PC I'm
working on. When that PC was a Windows PC, the incredibly ancient Windows Media
Player would play Flac, as would "Groove Music" I imagine. But I'm on a Mac on
a regular basis these days and Vox is **awful** (I'm not paying a monthly fee
for the privilege of listening to the music I've already purchased, thanks very
much), VLC is a bad music player (a great video player, but not great for
music, IMO)

## What's the current state?

I've got playback working. Double-clicking on artists, albums, and songs adds to the 'Now Playing' list. Repeat & Shuffle generally work the way you expect. `yarn start` will launch it. The trouble is that there's something buggy in the electron packager so that the results of `yarn build` don't actually work :/

## Stuff to do

1. Debounce the living crap out of state saving to disk. Seriously, that's outta control.
2. Add custom Playlist capabilities
3. Make adding new music "append" new keys (no key re-use)
4. Make changing music "migrate" keys?
5. Add album covers
6. Maybe try to get band photos?
7. Make a miniplayer?
8. Bundle the thing into a dist!

## Stuff to remember

### Persisting stuff across runs

In order to persist some state across runs of the app, you need to add the name
of the key to the `ValidKeyNames` list in
[MyStore.js](https://github.com/kevinfrei/music/blob/master/src/MyStore.js) as
well as the `KeyWhiteList` function in
[persist.js](https://github.com/kevinfrei/music/blob/master/static/main/persist.js).
To load it at UI refresh, add a request to `ConfigureIPC` in
[Handler.js](https://github.com/kevinfrei/music/blob/master/src/Handler.js). To
ensure that it gets updated, you'll also be editing `ConfigureIPC` to subscribe
to updates. Very little of this is close to ideal, but it's what I wound up
with while hacking away during quarantine.

## Old stuff

This started as a `create-react-app` and `electron-quick-start` shoved together with a very anemic
[AmplitudeJS](https://521dimensions.com/open-source/amplitudejs/)-based play
back thingamajig. I ripped out Amplitude (it was overkill, and didn't mesh well with React/Undux) and I've got a core set of capabilities working.

Music player stuff. First: I have a *lot* of media. Last time I checked it was
over 20,000 songs spread across about 2000 albums and the same general number
of artists. Navigating a collection that large results in a number of issues.
The first is general purpose "using too much memory". Turns out, though, that
just keeping the simple metadata DB in memory isn't a challenge, but the UI
definitely needs a some virtualization, as 20,000 song `div`s is likely going
to make Electron fall to it's knees. The second issue is general navigation:
Artists/Albums/Songs lists are probably too messy. I think I might take a page
out of the old Windows Phone UI and have a "first letter" initial entry into
Artists and Albums lists. Not sure about Songs. That might just make more sense
to only allow it to be searched, but never scrolled. Finally, playlists. M3U's
are fine, but there are definitely better ways to produce playlists than just
blindly adding entire albums/artists, or one by one. That's an interesting
interaction problem to think about in the future...

# Electron quick start stuff:

This is a minimal Electron application based on the [Quick Start
Guide](https://electronjs.org/docs/tutorial/quick-start) within the Electron
documentation.


# Create React App stuff:

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app).

