# EMP: Electron Music Player

> A little Hat Tip to us older Seattleites ;)

### Because macOS iTunes, er, "Music" doesn't play flac files

I'm old. I have a whole lot of music that I purchased on CD's over the past
many, many years. I like having high quality music playable from the computer
I'm working on. When that computer was a Windows PC, the incredibly ancient
Windows Media Player would play Flac, as would "Groove Music" I imagine (and
anything else probably, because of the pluggable (and highly overarchitected)
nature of audio/video handling in Windows). But I'm on a Mac on a regular basis
these days. Vox is **awful** (I'm not paying a monthly fee for the privilege of
listening to the music I've already purchased, thanks very much) and VLC is a
bad music player (a great video player, but not great for music, IMO)

What's it look like? Kind of like iTunes' ugly stepsister (#notadesigner!), but
here you go:

![Albums view](doc/albums.jpg)

![Playlist view](doc/playlist.jpg)

It's not yet packaged for general consumption, but if you're a nerd like me, you
can probably get it to work from the repository easily enough
(`yarn ; yarn start` ought to do it)

## What's the current state?

It pretty much works. There still might be a few "first launch" problems that
mean you might have to start it a couple times before it's actually running, but
overall? It's completely functional.

## Stuff to do

### Bugs

- Some of the artwork & metadata settings aren't implemented
- Various Artists/Soundtracks still probably want some work (it's an eternal
  battle)
- FluentUI has a bug for RTL layout (file path in File Details sticks the first
  character at the end of the string :D). Maybe report it?

### Core Capabilities

- **both** MediaInfo/Metadata editing!
  - Support adding/editing album covers
  - File name vs. metadata difference cleanup (this would be _awesome_)
  - Update data from file metadata (optionally overriding filename acquisition?)
  - (longer term) Update file metadata!
- **render** Add expandable (& editable) playlist view
- **main** Version the persistence data. I have troubles if I change the disk
  format :/
- **render** Add typing to scroll to the appropriate spot in the song list
- **render** Make search group headers a little more informative
- **render** Make search headers clickable (i.e. sort the list of stuff)
- **render** Get the cursor set properly for clickable stuff
- **both** Add "Recently Added" capabilities
  - Something involving no Key Reuse probably...
- **render** Improve the Search view a bit
- **both** Audio file placement for clean-up, perhaps?
- **both** Add 'favorite/love' attribute for songs
- **both** "Auto" playlists (something involving stuff like "this artist" and
  "not this keyword" kind of stuff.
- **both** Import/Export M3U's (and other playlist formats one might care about)

### Logic improvements/changes

- Transcode for phone (dump stuff out ready to import into iTunes, for example)
  - The lion's share of the work for this is already in my `@freik/media-utils`
    module.

### UI Improvements

- Make an actual "About" screen
- Get some controls in the menu with appropriate keyboard shortcuts
- Maybe use of the album-art package to get artist pix
- Improve/Expand the views for Albums and Artists.
- DetailsList is nifty, but a little bit buggy. Maybe try making my own?

### Other

- Testing! Testing! Testing!

### "Other" communication

To generally communicate, you'll need to have a message name registered on both
sides. In the **main** process, you'll need to register it in the `CommsSetup`
function in
[Communication.ts](https://github.com/kevinfrei/EMP/blob/main/static/main/Communication.ts).
In the **render** process, you should add a function that handles any data
validation in [ipc.ts](https://github.com/kevinfrei/EMP/blob/main/src/ipc.ts).
The 'get-media-info' message is a reasonable example to check out. Nothing is
persisted between runs, it's just a simple little "please give me the data for
this song" RPC.

## Old stuff

I've migrated everything from Flow to TypeScript, because support from all the
modules I use is much better in TypeScript. Honestly, the only other thing that
seems better to me about TypeScript over Flow is documentation. TypeScript is
kind of dumb (it doesn't get value propagation as well as Flow) and holy crap is
it **_slow_**: 5-10 seconds to type check my 5000 lines of code :o but I'm not
particularly blocked by the speed on compilation. My brain is far slower than
that, and the tooling is much better. So it's all TypeScript, because types are
good for your health.

I started out using Undux (with Flow), as Undux seemed to handle Flow types very
nicely. But a month or so after my migration to TypeScript was complete,
[Recoil](https://recoiljs.org) was released. One of the key authors is on my
team, and it was kinda "his idea" (Hi, Dave!). It supports React Suspense in an
incredibly elegant fashion, and I've been drooling over it for since early 2019.
Now that it's been open-sourced, Undux is completely gone and I'm well past
feature parity, adding nifty "capabilities" like updating the music library
without requiring a restart or two. "Features" like that :D

During the Undux to Recoil conversion, I kept hitting weird React issues with
some of the virtualized list tech I was using, so I said screw it and also
started migrating off of Bootstrap and onto FluentUI. Honestly FluentUI isn't
the prettiest or the easiest to 'style' (the mechanism is pretty weird, involved
calling functions and having pairs of styles in a single object...), but its
defaults certainly look better than Bootstrap, plus it's Microsoft tech, so it's
generally well documented, and scalable. The `DetailsList` component is almost
magical. I highly recommend it. I still see a few weird bugs, but it's not clear
whether they're due to my code, or if the component has issues. Hurray for web
tech, I guess.

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

### Recoil Notes

For data that "lives" on the server/in the main process, there are a couple
different models. If it's "read only" that can be trivially modeled using
_selectors_. Just make the getter download data from the server. If it might
change, however, (i.e. the user changes the paths to search for music from, thus
changing the music DB) you'd need to make the dependency clear by invoking the
getter on the thing the read-only value depends on (even if you don't use it on
the client side).

For data that is changing in the render process, but is also stored on the
server/in the main process, there's a big more complex data flow necessary. You
can't really model the dependency of the data accurately in just _atoms_ and
_selectors_. There's a new (as of v0.0.12)
[API](https://recoiljs.org/docs/api-reference/core/useRecoilTransactionObserver)
for watching changes so that you can do things like encode the data in a URL, or
save it back to the server.

Prior to Recoil v0.1.2, I had a little `useBackedState` hook that rolled a
number of things into a single chunk of state, and registered stuff with the
`useRecoilTransactionObserver` API, but it didn't work with more than a single
callsite to `useBackedState` per atom. With Recoil 0.1.2, `AtomEffects` are the
new hotness, and it appears to work really well. I'm going to try to get rid of
all my weird 1-off communication and shift to AtomEffects. I'm not quite there,
but I should also be able to address the MusicDB update race that I've been
ignoring. I might switch back to something less integrated into the Atom, but it
has definitely forced me to be more clear about how back end communication
occurs.

### Electron quick start stuff:

This is a minimal Electron application based on the
[Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start) within the
Electron documentation.

### Create React App stuff:

This project was bootstrapped with
[Create React App](https://github.com/facebook/create-react-app).
