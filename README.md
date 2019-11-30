# It's a slowly-turning-into-something Electron-based local music player
### Because iTunes, er, "Music" doesn't play flac :/
* Why? I dunno. Because Apple is lame.

I'm old. I have a whole lot of music that I purchased on CD's over the past
many, many years. I like having high quality music playable from the PC I'm
working on. When that PC was a Windows PC, the incredibly ancient Windows Media
Player would play Flac, as would "Groove Music" I imagine. But I'm on a Mac on
a regular basis these days and Vox is **awful**, VLC is a bad music player (a
great video player, but not great for music, IMO)

Currently, this is mostly just `create-react-app` and the
`electron-quick-start` shoved together with a very anemic
[AmplitudeJS](https://521dimensions.com/open-source/amplitudejs/)-based play
back thingamajig. I've added a couple of *very minor* things, which I ought to
document it, I suppose. I'm going to just start creating github issues to
slowly build up capabilities I want.

I'm grabbing some random stuff from
[here](https://serversideup.net/building-a-single-song-player/) to get
AmplitudeJS up and going. Initial test just plays a file I've got locally.

And, before going too far, I think I'd like to integrate some of [this
stuff](https://blog.avocode.com/4-must-know-tips-for-building-cross-platform-electron-apps-f3ae9c2bffff)
into my starter thing, because it sounds like a good idea. I'm not sure how
much is already now the default, but if it's not, I'm gonna add it.

---

Music player stuff. First: I have a *lot* of media. Last time I checked it was
over 20,000 songs spread across about 2000 albums and the same general number
of artists. Navigating a collection that large results in a number of issues.
The first is general purpose "using too much memory". I should validate that
it's a problem, as maybe just keeping the simple metadata DB in memory isn't a
challenge, but the UI definitely needs a fair bit of virtualization, as 20,000
song `div`s is likely going to make Electron fall to it's knees. The second
issue is general navigation: Artists/Albums/Songs lists are probably too messy.
I think I might take a page out of the old Windows Phone UI and have a "first
letter" initial entry into Artists and Albums lists. Not sure about Songs. That
might just make more sense to only allow it to be searched, but never scrolled.
Finally, playlists. M3U's are fine, but there are definitely better ways to
produce playlists than just blindly adding entire albums/artists, or one by
one. That's an interesting interaction problem to think about in the future...

# Electron quick start stuff:

This is a minimal Electron application based on the [Quick Start
Guide](https://electronjs.org/docs/tutorial/quick-start) within the Electron
documentation.


# Create React App stuff:

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app).

