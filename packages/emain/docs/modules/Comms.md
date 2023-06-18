[@freik/elect-main-utils](../README.md) / [Exports](../modules.md) / Comms

# Namespace: Comms

## Table of contents

### Type aliases

- [Handler](Comms.md#handler)
- [Registerer](Comms.md#registerer)

### Functions

- [AsyncSend](Comms.md#asyncsend)
- [SendToMain](Comms.md#sendtomain)
- [SetupDefault](Comms.md#setupdefault)
- [readFromStorage](Comms.md#readfromstorage)
- [registerChannel](Comms.md#registerchannel)
- [registerProtocolHandler](Comms.md#registerprotocolhandler)
- [writeToStorage](Comms.md#writetostorage)

## Type aliases

### Handler

Ƭ **Handler**<`R`, `T`\>: (`arg`: `T`) => `Promise`<`R` \| `void`\>

#### Type parameters

| Name |
| :--- |
| `R`  |
| `T`  |

#### Type declaration

▸ (`arg`): `Promise`<`R` \| `void`\>

The type of a "channel handler", used by
[registerChannel](Comms.md#registerchannel)

##### Parameters

| Name  | Type |
| :---- | :--- |
| `arg` | `T`  |

##### Returns

`Promise`<`R` \| `void`\>

#### Defined in

[comms.ts:13](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L13)

---

### Registerer

Ƭ **Registerer**<`T`\>: (`scheme`: `string`, `handler`: (`request`:
`ProtocolRequest`, `callback`: (`response`: `T` \| `ProtocolResponse`) =>
`void`) => `void`) => `boolean`

#### Type parameters

| Name |
| :--- |
| `T`  |

#### Type declaration

▸ (`scheme`, `handler`): `boolean`

##### Parameters

| Name      | Type                                                                                                    |
| :-------- | :------------------------------------------------------------------------------------------------------ |
| `scheme`  | `string`                                                                                                |
| `handler` | (`request`: `ProtocolRequest`, `callback`: (`response`: `T` \| `ProtocolResponse`) => `void`) => `void` |

##### Returns

`boolean`

#### Defined in

[comms.ts:132](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L132)

## Functions

### AsyncSend

▸ **AsyncSend**(`message`): `void`

Send a message to the main window. This pairs with Handle in the
elect-render-utils library

#### Parameters

| Name      | Type      | Description                        |
| :-------- | :-------- | :--------------------------------- |
| `message` | `unknown` | The (flattenable) message to send. |

#### Returns

`void`

#### Defined in

[comms.ts:112](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L112)

---

### SendToMain

▸ **SendToMain**(`channel`, ...`data`): `void`

Send arbitrary data to the main window

#### Parameters

| Name      | Type        | Description                |
| :-------- | :---------- | :------------------------- |
| `channel` | `string`    | The name of the channel    |
| `...data` | `unknown`[] | The arbitrary data to send |

#### Returns

`void`

#### Defined in

[comms.ts:94](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L94)

---

### SetupDefault

▸ **SetupDefault**(): `void`

Call this before starting your window. This will register handlers for the
simple read-from/write-to storage calls that elect-render-utils expects

#### Returns

`void`

#### Defined in

[comms.ts:124](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L124)

---

### readFromStorage

▸ **readFromStorage**(`name?`): `Promise`<`string`\>

Read a value from persistence by name, returning it's unprocessed contents

**`async`**

#### Parameters

| Name    | Type     | Description                   |
| :------ | :------- | :---------------------------- |
| `name?` | `string` | the name of the value to read |

#### Returns

`Promise`<`string`\>

Promise resolved to the raw string contents of the value

#### Defined in

[comms.ts:51](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L51)

---

### registerChannel

▸ **registerChannel**<`R`, `T`\>(`key`, `handler`, `checker`): `void`

Registers with electron's
[ipcMain.handle](https://www.electronjs.org/docs/latest/api/ipc-main#ipcmainhandlechannel-listener)
a function that takes a mandatory parameter and returns _string_ data untouched.
It also requires a checker to ensure the data is properly typed

#### Type parameters

| Name |
| :--- |
| `R`  |
| `T`  |

#### Parameters

| Name      | Type                                     | Description                                            |
| :-------- | :--------------------------------------- | :----------------------------------------------------- |
| `key`     | `string`                                 | The id to register a listener for                      |
| `handler` | [`Handler`](Comms.md#handler)<`R`, `T`\> | the function that handles the data                     |
| `checker` | (`v`: `unknown`) => v is T               | a Type Check function for return type of the channel T |

#### Returns

`void`

void

#### Defined in

[comms.ts:26](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L26)

---

### registerProtocolHandler

▸ **registerProtocolHandler**<`ResponseType`\>(`type`, `registerer`,
`processor`, `defaultValue?`): `void`

Helper to check URL's & transition to async functions

#### Type parameters

| Name           |
| :------------- |
| `ResponseType` |

#### Parameters

| Name           | Type                                                                                                   | Default value | Description                                                                                                                                                                                                                                      |
| :------------- | :----------------------------------------------------------------------------------------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`         | `string`                                                                                               | `undefined`   | The 'header' of the protocol. "pix://foo/" for example                                                                                                                                                                                           |
| `registerer`   | [`Registerer`](Comms.md#registerer)<`ResponseType`\>                                                   | `undefined`   | The type of protocol registration function to use. [protocol.registerBufferProtocol](https://www.electronjs.org/docs/latest/api/protocol#protocolregisterfileprotocolscheme-handler) for example. It must match the response type appropriately! |
| `processor`    | (`req`: `ProtocolRequest`, `trimmedUrl`: `string`) => `Promise`<`ResponseType` \| `ProtocolResponse`\> | `undefined`   | The function that will process the protocol request                                                                                                                                                                                              |
| `defaultValue` | `ResponseType` \| `ProtocolResponse`                                                                   | `e404`        | The (optional) default return value (Error 404)                                                                                                                                                                                                  |

#### Returns

`void`

#### Defined in

[comms.ts:152](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L152)

---

### writeToStorage

▸ **writeToStorage**(`keyValuePair`): `Promise`<`void`\>

Write a value to persistence by name.

**`async`**

#### Parameters

| Name           | Type                 | Description                   |
| :------------- | :------------------- | :---------------------------- |
| `keyValuePair` | [`string`, `string`] | The key:value string to write |

#### Returns

`Promise`<`void`\>

#### Defined in

[comms.ts:72](https://github.com/kevinfrei/elect-main-tools/blob/a5c5562/src/comms.ts#L72)
