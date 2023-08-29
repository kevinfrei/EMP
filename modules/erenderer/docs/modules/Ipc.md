[@freik/elect-render-utils](../README.md) / [Exports](../modules.md) / Ipc

# Namespace: Ipc

## Table of contents

### Type aliases

- [ListenKey](Ipc.md#listenkey)
- [MessageHandler](Ipc.md#messagehandler)

### Functions

- [CallMain](Ipc.md#callmain)
- [InvokeMain](Ipc.md#invokemain)
- [PostMain](Ipc.md#postmain)
- [ReadFromStorage](Ipc.md#readfromstorage)
- [Subscribe](Ipc.md#subscribe)
- [Unsubscribe](Ipc.md#unsubscribe)
- [WriteToStorage](Ipc.md#writetostorage)

## Type aliases

### ListenKey

Ƭ **ListenKey**: `Object`

#### Type declaration

| Name  | Type     |
| :---- | :------- |
| `id`  | `string` |
| `key` | `string` |

#### Defined in

[src/ipc.ts:7](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L7)

---

### MessageHandler

Ƭ **MessageHandler**: (`val`: `unknown`) => `void`

#### Type declaration

▸ (`val`): `void`

##### Parameters

| Name  | Type      |
| :---- | :-------- |
| `val` | `unknown` |

##### Returns

`void`

#### Defined in

[src/ipc.ts:8](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L8)

## Functions

### CallMain

▸ **CallMain**<`R`, `T`\>(`channel`, `key`, `typecheck`): `Promise`<`R` \|
`void`\>

**`async`** Call a remote function with type checking on the return value. If
you have no return type, use [PostMain](Ipc.md#postmain) instead.

#### Type parameters

| Name |
| :--- |
| `R`  |
| `T`  |

#### Parameters

| Name        | Type                           | Description                                          |
| :---------- | :----------------------------- | :--------------------------------------------------- |
| `channel`   | `string`                       | The channel to send a message to                     |
| `key`       | `T`                            | The key to communicat to the message                 |
| `typecheck` | (`val`: `unknown`) => val is R | The typecheck function to validate the return type R |

#### Returns

`Promise`<`R` \| `void`\>

A promise that resolves to the typechecked return value of the RPC

#### Defined in

[src/ipc.ts:215](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L215)

---

### InvokeMain

▸ **InvokeMain**<`T`\>(`channel`, `key?`): `Promise`<`unknown` \| `void`\>

**`async`** Invoke a remote function with no type checking or translation. You
probably want to use [CallMain](Ipc.md#callmain) or [PostMain](Ipc.md#postmain)
instead.

#### Type parameters

| Name | Description                           |
| :--- | :------------------------------------ |
| `T`  | The (implied) type of the key to send |

#### Parameters

| Name      | Type     | Description                                    |
| :-------- | :------- | :--------------------------------------------- |
| `channel` | `string` | The channel to send a message to               |
| `key?`    | `T`      | The key to communicate to the message (if any) |

#### Returns

`Promise`<`unknown` \| `void`\>

A promise that resolves to the result of the RPC

#### Defined in

[src/ipc.ts:186](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L186)

---

### PostMain

▸ **PostMain**<`T`\>(`channel`, `key?`): `Promise`<`void`\>

**`async`** Call a remote function with validation of a void result.

#### Type parameters

| Name |
| :--- |
| `T`  |

#### Parameters

| Name      | Type     | Description                           |
| :-------- | :------- | :------------------------------------ |
| `channel` | `string` | The channel to send a message to      |
| `key?`    | `T`      | The key to communicate to the message |

#### Returns

`Promise`<`void`\>

A promise that resolves when the RPC has returned

#### Defined in

[src/ipc.ts:238](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L238)

---

### ReadFromStorage

▸ **ReadFromStorage**(`key`): `Promise`<`string` \| `void`\>

**`async`** Read a key-value from Electron persistent storage

#### Parameters

| Name  | Type     | Description     |
| :---- | :------- | :-------------- |
| `key` | `string` | The key to read |

#### Returns

`Promise`<`string` \| `void`\>

A promise that resolves to the value read (or void if none found)

#### Defined in

[src/ipc.ts:17](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L17)

---

### Subscribe

▸ **Subscribe**(`key`, `handler`): [`ListenKey`](Ipc.md#listenkey)

This subscribes the `handler` to listen for messages coming from the main
process.

#### Parameters

| Name      | Type                         | Description                                        |
| :-------- | :--------------------------- | :------------------------------------------------- |
| `key`     | `string`                     | The message key identified to listen for           |
| `handler` | (`val`: `unknown`) => `void` | The function to invoke upon receipt of the message |

#### Returns

[`ListenKey`](Ipc.md#listenkey)

the key to use to unsubscribe

#### Defined in

[src/ipc.ts:45](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L45)

---

### Unsubscribe

▸ **Unsubscribe**(`listenKey`): `void`

Unsubscribe from a particular message

#### Parameters

| Name        | Type                            | Description                                       |
| :---------- | :------------------------------ | :------------------------------------------------ |
| `listenKey` | [`ListenKey`](Ipc.md#listenkey) | The key returned by [Subscribe](Ipc.md#subscribe) |

#### Returns

`void`

#### Defined in

[src/ipc.ts:64](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L64)

---

### WriteToStorage

▸ **WriteToStorage**(`key`, `data`): `Promise`<`void`\>

**`async`** Write a key-value pair to Electron persistent storage

#### Parameters

| Name   | Type     | Description             |
| :----- | :------- | :---------------------- |
| `key`  | `string` | The key to write        |
| `data` | `string` | The value to be written |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/ipc.ts:28](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/ipc.ts#L28)
