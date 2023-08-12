[@freik/elect-render-utils](README.md) / Exports

# @freik/elect-render-utils

## Table of contents

### Namespaces

- [Effects](modules/Effects.md)
- [Ipc](modules/Ipc.md)
- [MediaQuery](modules/MediaQuery.md)
- [Util](modules/Util.md)

### Functions

- [FreikElem](modules.md#freikelem)
- [useListener](modules.md#uselistener)

## Functions

### FreikElem

▸ **FreikElem**(): `JSX.Element`

This is the helper JSX element to support IPC with the main process. Use it like
this:

```html
<App>
  <RecoilRoot>
    <FreikElem/>
    <MyOtherStuff/>
  </RecoilRoot>
</All>
```

#### Returns

`JSX.Element`

#### Defined in

[src/helpers.tsx:35](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/helpers.tsx#L35)

---

### useListener

▸ **useListener**(`message`, `listener`): `void`

This is a React Hook that lets you listen for data sent from the main process,
via the
[`AsyncSend`](https://github.com/kevinfrei/elect-main-tools/blob/main/docs/modules/Comms.md#asyncsend)
function in the
[companion module](https://github.com/kevinfrei/elect-main-tools).

#### Parameters

| Name       | Type                          | Description                               |
| :--------- | :---------------------------- | :---------------------------------------- |
| `message`  | `string`                      | The message type to listen to             |
| `listener` | (`args`: `unknown`) => `void` | The function to invoke with the data sent |

#### Returns

`void`

#### Defined in

[src/helpers.tsx:13](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/helpers.tsx#L13)
