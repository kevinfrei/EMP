# electron-renderer

This exports a single "InitRender()" function that you **must** call in your
renderer.js file. This is specifically to be used with the other 3 electron
packages to make a bunch of common things easy to do in Electron.

To use them, do this:

```shell
yarn add @freik/elect-main-utils @freik/elect-render-utils @freik/electron-renderer @freik/web-utils
```

or

```shell
npm install @freik/elect-main-utils @freik/elect-render-utils @freik/electron-renderer @freik/web-utils
```

and then, in the renderer.js file, do this:

```javascript
import { InitRender } from '@freik/electron-renderer';
InitRender();
```

And away you go! The other 3 components live here:

| npm module                                                                     | description                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@freik/elect-main-utils`](https://github.com/kevinfrei/elect-main-tools)     | Main process helpers for the nodejs code                                                                                                                     |
| [`@freik/elect-render-utils`](https://github.com/kevinfrei/elect-render-tools) | Render process helper code that lives on the React/www side of the world                                                                                     |
| [`@freik/web-utils`](https://github.com/kevinfrei/web-utils)                   | General React helpers, plus some [Recoil](recoiljs.org) and [FluentUI WWW](https://developer.microsoft.com/en-us/fluentui#/get-started) controls and helpers |
