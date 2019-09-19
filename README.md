# Update this crap!

Currently, this is just the create-react-app and the electron-quick-start
shoved together. I've added a couple of *very minor* things, but I ought to
document it, I suppose.

And, before going too far, I think I'd like to integrate [this
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

**Use this app along with the [Electron API
Demos](https://electronjs.org/#get-started) app for API code examples to help
you get started.**

A basic Electron application needs just these files:

- `package.json` - Points to the app's main file and lists its details and
  dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This
  is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.

You can learn more about each of these components within the [Quick Start
Guide](https://electronjs.org/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and
[Node.js](https://nodejs.org/en/download/) (which comes with
[npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/electron/electron-quick-start
# Go into the repository
cd electron-quick-start
# Install dependencies
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this
guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/)
or use `node` from the command prompt.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's
  documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) -
  sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) -
  a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small
  applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) -
  an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) -
  small demo apps for the various Electron APIs

## License

[CC0 1.0 (Public Domain)](LICENSE.md)

# Create React App stuff:

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br> Open
[http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br> You will also see any lint errors
in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br> See the section
about [running
tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### `npm run build`

Builds the app for production to the `build` folder.<br> It correctly bundles
React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br> Your app is
ready to be deployed!

See the section about
[deployment](https://facebook.github.io/create-react-app/docs/deployment) for
more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can
`eject` at any time. This command will remove the single build dependency from
your project.

Instead, it will copy all the configuration files and the transitive
dependencies (Webpack, Babel, ESLint, etc) right into your project so you have
full control over them. All of the commands except `eject` will still work, but
they will point to the copied scripts so you can tweak them. At this point
you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for
small and middle deployments, and you shouldn’t feel obligated to use this
feature. However we understand that this tool wouldn’t be useful if you
couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App
documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here:
https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here:
https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here:
https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here:
https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here:
https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here:
https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
