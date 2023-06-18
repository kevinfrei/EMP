[@freik/elect-render-utils](../README.md) / [Exports](../modules.md) / Util

# Namespace: Util

## Table of contents

### Functions

- [ImageFromClipboard](Util.md#imagefromclipboard)
- [IsDev](Util.md#isdev)
- [SetInit](Util.md#setinit)
- [ShowOpenDialog](Util.md#showopendialog)

## Functions

### ImageFromClipboard

▸ **ImageFromClipboard**(): `NativeImage` \| `undefined`

Try to get an image from the clipboard. It's good for letting folks "paste" and
image into a region. I think...

#### Returns

`NativeImage` \| `undefined`

An Electron NativeImage type (which can be assigned to an img elem)

#### Defined in

[src/util.ts:64](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/util.ts#L64)

---

### IsDev

▸ **IsDev**(): `boolean`

NYI! This used to work, but now it needs to get support from the main process to
work properly :/

#### Returns

`boolean`

True if the app is in Development mode

#### Defined in

[src/util.ts:13](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/util.ts#L13)

---

### SetInit

▸ **SetInit**(`func`): `void`

This should be invoked from your index.tsx file and render your app in the
function passed in:

```javascript
Util.SetInit(() => {
  initializeIcons();
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      root,
    );
  }
});
```

#### Parameters

| Name   | Type         | Description                  |
| :----- | :----------- | :--------------------------- |
| `func` | () => `void` | Your initial render function |

#### Returns

`void`

#### Defined in

[src/util.ts:38](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/util.ts#L38)

---

### ShowOpenDialog

▸ **ShowOpenDialog**(`options`): `Promise`<`string`[] \| `void`\>

**`async`** Shows an Open dialog for the platform you're on. Use this instead of
the long-deprecated `remote` electron module.

#### Parameters

| Name      | Type                    | Description                                                                                                                             |
| :-------- | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `options` | `OpenDialogSyncOptions` | an [OpenDialogOptions](https://www.electronjs.org/docs/latest/api/dialog) instance describing what kind of Open dialog you want to show |

#### Returns

`Promise`<`string`[] \| `void`\>

A promise that resolves to the array of files/folders selected

#### Defined in

[src/util.ts:52](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/util.ts#L52)
