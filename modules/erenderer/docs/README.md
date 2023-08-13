@freik/elect-render-utils / [Exports](modules.md)

# @freik/elect-main-utils

These are tools & utilities for the Electron 'render' process within the normal
www code, which is meant to be used in conjuction with my other electron
libraries for simplifying common stuff for Electron applications.

You can find the documentation is [here](docs/modules.md) (it's currently only
typedoc auto-generated API documentation)

To use them, do this:

```shell
yarn add @freik/elect-main-utils @freik/elect-render-utils @freik/electron-renderer @freik/web-utils
```

or

```shell
npm install @freik/elect-main-utils @freik/elect-render-utils @freik/electron-renderer @freik/web-utils
```

The other 3 components live here:

| npm module                                                                   | description                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@freik/elect-main-utils`](https://github.com/kevinfrei/elect-main-tools)   | Main process helpers for the nodejs code                                                                                                                     |
| [`@freik/electron-renderer`](https://github.com/kevinfrei/electron-renderer) | Render process helper code that lives in the nodejs side of the world                                                                                        |
| [`@freik/web-utils`](https://github.com/kevinfrei/web-utils)                 | General React helpers, plus some [Recoil](recoiljs.org) and [FluentUI WWW](https://developer.microsoft.com/en-us/fluentui#/get-started) controls and helpers |
