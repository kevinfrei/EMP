# EMP: Electron Music Player

> A little Hat Tip to us older Seattleites ;)

### Because macOS iTunes, er, "Music" doesn't play flac files

- Why? Because Apple is lame.

I'm old. I have a whole lot of music that I purchased on CD's over the past
many, many years. I like having high quality music playable from the PC I'm
working on. When that PC was a Windows PC, the incredibly ancient Windows Media
Player would play Flac, as would "Groove Music" I imagine (and anything else
probably, because of the pluggable (and highly overarchitected) nature of
audio/video handling in Windows. But I'm on a Mac on a regular basis these days
and Vox is **awful** (I'm not paying a monthly fee for the privilege of
listening to the music I've already purchased, thanks very much) and VLC is a
bad music player (a great video player, but not great for music, IMO)

What's it look like? Kind of like iTunes' ugly stepsister (#notadesigner!), but
here you go:

![Albums view](doc/albums.jpg)

![Playlist view](doc/playlist.jpg)

It's not yet 'packaged' for general consumption, but if you're a nerd, you can
probably get it to work from the repository easily enough. (Those screen shots
from the 'bootstrap' version. I've moved on to FluenUI since then...)

Also, I migrated everything from Flow to TypeScript, because support from all
the modules I use is much better in TypeScript. Honestly, the only other thing
that seems better to me about TypeScript over Flow is documentation. TypeScript
is kind of dumb (it doesn't get value propagation as well as Flow) and holy crap
is it _slow_. 5-10 seconds to type check my 5000 lines of code :o

## What's the current state?

I've got playback working. Double-clicking on artists, albums, and songs adds to
the 'Now Playing' list. Repeat & Shuffle generally work the way you expect.
`yarn start` will launch it. Albums with jpg's/png's in the same folder will
display those images in the Album list. Honestly, it's semi-functional.
Playlists are the next major piece of functionality to add.

## Stuff to do

### _In Progress_

Migrate to Recoil. One of the two key authors is on my team, and it was kinda
"his idea". It supports React suspense, and I've been drooling over it for about
a year. Now that it's been open-sourced, I'm going to switch from undux to
recoil. Undux is completely gone, but I'm not quite back up to feature parity.
During the conversion, I kept hitting weird React issues with some of the
virtualized lists tech I was using, so I said screw it and also started
migrating off of Bootstrap and onto FluentUI. Honestly FluentUI isn't the
prettiest, but it's defaults certainly look better than Bootstrap, plus it's
Microsoft tech, so it's relatively well documented, and super-duper scalable.
The `DetailsList` component is almost magical. I highly recommend it.

### Recoil Notes

For data that "lives" on the server/in the main process, there are a couple
different models. If it's "read only" that can be trivially modeled using
_selectors_. Just make the getter download data from the server. Even if it
might change (i.e. the user changes the paths to search for music from, thus
changing the music DB) you can make the dependency clear by invoking the getter
on the thing the read-only value depends on (even if you don't use it on the
client side).

For data that is changing, but is also stored on the server/in the main process,
there's a big more complex data flow necessary. You can't really model the
dependency of the data accurately in just _atoms_ and _selectors_. There's a new
[API](https://recoiljs.org/docs/api-reference/core/useRecoilTransactionObserver)
for watching changes so that you can do things like encode the data in a URL, or
save it back to the server.

You can try to do similar stuff with Effects, but I whipped up a
`useBackedState` hook, and it seems to work quite nicely. Instead of
`useRecoilState`, use `useBackedState` with a default, and it will
asynchronously query the server for the initial value (falling back to the
atom's default if the server fails) as well as _register it to be recorded_
using the API mentioned above. Perfect! ering an infinite loop between #2 and
#3.

## This stuff is all out of date

I should review it once I'm happy with the state of my recoil-iness.

### Bugs

- Handle audio files that don't fit my schema
  - Probably start with iTunes schema :/

### Core Capabilities

- **both** Restore active tab between runs
- **main** Get album covers from media tags as well as the folder...
- **main** Update data from file metadata (overriding filename acquisition)
  - Save this stuff between runs, as it's going to be _s l o w_.
- **both** MediaInfo/Metadata editing!
  - Support adding album covers
  - File name vs. metadata difference cleanup (this would be _awesome_)
- **both** Add "Recently Added" capabilities
  - Something involving no Key Reuse probably...
- **both** Make 'Search' work.
- **render** Make a miniplayer!
- **both** Add 'favorite/love' attribute for songs
- **both** "Auto" playlists (something involving stuff like "this artist" and
  "not this keyword" kind of stuff.
- **both** Import/Export M3U's?

### Logic improvements/changes

- Filter song lists down to actual songKeys that exist
- Transcode for phone (dump stuff out ready to import into iTunes, for example)
  - The "work" for this is already in my `@freik/media-utils` module.
- Playlist unique-ification

### UI Improvements

- Sorting lists by clicking headers _everywhere_
  - Indicate the sorting (and invalidate it in Now Playing when shuffled)
  - Inverse sorting when clicking again
- Make an actual "About" screen
- Get some controls in the menu with appropriate keyboard shortcuts
- Maybe use the album-art package to get artist pix & missing album pix
- Improve the views for Albums and Artists.

### Other

- Testing! Testing! Testing!

### "Other" communication

To generally communicate, you'll need to have a message name registered on both
sides. In the **main** process, you'll need to register it in the `Init`
function in
[Communication.ts](https://github.com/kevinfrei/EMP/blob/main/src/Communication.ts).
In the **render** process, you should add a function that handles any data
validation in [ipc.ts](https://github.com/kevinfrei/EMP/blob/main/src/ipc.ts).
The 'mediainfo' message is a reasonable example to check out. Nothing is
persisted between runs, it's just a simple little "please give me the data for
this song" RPC.

## Old stuff

This started as a `create-react-app` and `electron-quick-start` shoved together
with a very anemic
[AmplitudeJS](https://521dimensions.com/open-source/amplitudejs/)-based play
back thingamajig. I ripped out Amplitude (it was overkill, and didn't mesh well
with React) and I've got a core set of capabilities working.

Music player stuff. First: I have a _lot_ of media. Last time I checked it was
over 20,000 songs spread across about 2000 albums and the same general number of
artists. Navigating a collection that large results in a number of issues. The
first is general purpose "using too much memory". Turns out, though, that just
keeping the simple metadata DB in memory isn't a challenge, but the UI
definitely needs a some virtualization, as 20,000 song `div`s is likely going to
make Electron fall to it's knees. The second issue is general navigation:
Artists/Albums/Songs lists are probably too messy. I think I might take a page
out of the old Windows Phone UI and have a "first letter" initial entry into
Artists and Albums lists. Not sure about Songs. That might just make more sense
to only allow it to be searched, but never scrolled. Finally, playlists. M3U's
are fine, but there are definitely better ways to produce playlists than just
blindly adding entire albums/artists, or one by one. That's an interesting
interaction problem to think about in the future...

# Electron quick start stuff:

This is a minimal Electron application based on the
[Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start) within the
Electron documentation.

# Create React App stuff:

This project was bootstrapped with
[Create React App](https://github.com/facebook/create-react-app).
