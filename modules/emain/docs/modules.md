[@freik/elect-main-utils](README.md) / Exports

# @freik/elect-main-utils

## Table of contents

### Namespaces

- [Comms](modules/Comms.md)
- [Shell](modules/Shell.md)

### Type aliases

- [MaybeRectangle](modules.md#mayberectangle)
- [WindowPosition](modules.md#windowposition)

### Variables

- [Persistence](modules.md#persistence)

### Functions

- [GetBrowserWindowPos](modules.md#getbrowserwindowpos)
- [LoadWindowPos](modules.md#loadwindowpos)
- [SaveWindowPos](modules.md#savewindowpos)
- [getMainWindow](modules.md#getmainwindow)
- [setMainWindow](modules.md#setmainwindow)

## Type aliases

### MaybeRectangle

Ƭ **MaybeRectangle**: `Object`

#### Type declaration

| Name     | Type     |
| :------- | :------- |
| `height` | `number` |
| `width`  | `number` |
| `x?`     | `number` |
| `y?`     | `number` |

#### Defined in

[persist.ts:6](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L6)

---

### WindowPosition

Ƭ **WindowPosition**: `Object`

#### Type declaration

| Name          | Type                                          |
| :------------ | :-------------------------------------------- |
| `bounds`      | [`MaybeRectangle`](modules.md#mayberectangle) |
| `isMaximized` | `boolean`                                     |

#### Defined in

[persist.ts:13](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L13)

## Variables

### Persistence

• **Persistence**: `Persist`

A [`persist`](https://github.com/kevinfrei/node-utils/blob/main/src/persist.ts)
interface for the Electron app's persistent data location. It's a good place for
app settings and the like.

#### Defined in

[persist.ts:25](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L25)

## Functions

### GetBrowserWindowPos

▸ **GetBrowserWindowPos**(`st`): `Rectangle`

Translates a WindowPosition into a Rectangle for use elsewhere

#### Parameters

| Name | Type                                          | Description                     |
| :--- | :-------------------------------------------- | :------------------------------ |
| `st` | [`WindowPosition`](modules.md#windowposition) | The WindowPosition to translate |

#### Returns

`Rectangle`

a rectangle which may or may not have and X and Y coordinate

#### Defined in

[persist.ts:104](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L104)

---

### LoadWindowPos

▸ **LoadWindowPos**(): [`WindowPosition`](modules.md#windowposition)

Load the saved position of the window

#### Returns

[`WindowPosition`](modules.md#windowposition)

The previous location of the window for the app

#### Defined in

[persist.ts:58](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L58)

---

### SaveWindowPos

▸ **SaveWindowPos**(`st`): `void`

Save the window position for future use as a window-restore size

#### Parameters

| Name | Type                                          | Description                 |
| :--- | :-------------------------------------------- | :-------------------------- |
| `st` | [`WindowPosition`](modules.md#windowposition) | The window position to save |

#### Returns

`void`

#### Defined in

[persist.ts:94](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/persist.ts#L94)

---

### getMainWindow

▸ **getMainWindow**(): `BrowserWindow` \| `null`

Returns a reference to the main
[BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window) (or
null)

#### Returns

`BrowserWindow` \| `null`

the main window handle (or null)

#### Defined in

[win.ts:15](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/win.ts#L15)

---

### setMainWindow

▸ **setMainWindow**(`win`): `void`

Sets the main window and configures it to update the window position as well as
clear the reference when it's closed

#### Parameters

| Name  | Type            | Description                                                                                                  |
| :---- | :-------------- | :----------------------------------------------------------------------------------------------------------- |
| `win` | `BrowserWindow` | The [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window) to consider the 'main' window |

#### Returns

`void`

#### Defined in

[win.ts:44](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/win.ts#L44)
