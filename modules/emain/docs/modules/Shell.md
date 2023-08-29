[@freik/elect-main-utils](../README.md) / [Exports](../modules.md) / Shell

# Namespace: Shell

## Table of contents

### Functions

- [ShowOpenDialog](Shell.md#showopendialog)
- [isOpenDialogOptions](Shell.md#isopendialogoptions)
- [showFile](Shell.md#showfile)

## Functions

### ShowOpenDialog

▸ **ShowOpenDialog**(`options`): `Promise`<`string`[] \| `void`\>

Show an "Open" dialog, configured according to `options`

#### Parameters

| Name      | Type                | Description                                                                                        |
| :-------- | :------------------ | :------------------------------------------------------------------------------------------------- |
| `options` | `OpenDialogOptions` | the [OpenDialogOptions](https://www.electronjs.org/docs/latest/api/dialog) used to show the dialog |

#### Returns

`Promise`<`string`[] \| `void`\>

the list of files/folders selected by the user

#### Defined in

[shell.ts:73](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/shell.ts#L73)

---

### isOpenDialogOptions

▸ **isOpenDialogOptions**(`obj`): obj is OpenDialogOptions

Type Check for
[OpenDialogOptions](https://www.electronjs.org/docs/latest/api/dialog)

#### Parameters

| Name  | Type      | Description              |
| :---- | :-------- | :----------------------- |
| `obj` | `unknown` | The object to type check |

#### Returns

obj is OpenDialogOptions

True if obj is
[OpenDialogOptions](https://www.electronjs.org/docs/latest/api/dialog)

#### Defined in

[shell.ts:62](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/shell.ts#L62)

---

### showFile

▸ **showFile**(`filePath?`): `Promise`<`void`\>

Show a file or folder in the OS shell (Finder/Explorer/Linux whatever you call
it)

#### Parameters

| Name        | Type     | Description                            |
| :---------- | :------- | :------------------------------------- |
| `filePath?` | `string` | The path to the file or folder to show |

#### Returns

`Promise`<`void`\>

#### Defined in

[shell.ts:92](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/shell.ts#L92)
