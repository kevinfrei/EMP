[@freik/elect-render-utils](../README.md) / [Exports](../modules.md) / Effects

# Namespace: Effects

## Table of contents

### Functions

- [bidirectionalSyncWithTranslate](Effects.md#bidirectionalsyncwithtranslate)
- [oneWayFromMain](Effects.md#onewayfrommain)
- [syncWithMain](Effects.md#syncwithmain)
- [translateToMain](Effects.md#translatetomain)

## Functions

### bidirectionalSyncWithTranslate

▸ **bidirectionalSyncWithTranslate**<`T`\>(`toPickleable`, `fromUnpickled`,
`asyncUpdates?`): `AtomEffect`<`T`\>

An Atom effect to acquire the value from main, and save it back when modified,
after processing it from the original type to JSON using Pickling.

#### Type parameters

| Name | Description                                                  |
| :--- | :----------------------------------------------------------- |
| `T`  | Type of the atom (implied from the function types passed in) |

#### Parameters

| Name            | Type                                | Description                                                                            |
| :-------------- | :---------------------------------- | :------------------------------------------------------------------------------------- |
| `toPickleable`  | (`val`: `T`) => `unknown`           | The function to translate the type T to a pickleable type                              |
| `fromUnpickled` | (`val`: `unknown`) => `void` \| `T` | The function to translate from the pickleable type to T                                |
| `asyncUpdates?` | `boolean`                           | Optionally true if you also need to respond to asynchronous server (main) side changes |

#### Returns

`AtomEffect`<`T`\>

an AtomEffect<T>

#### Defined in

[src/effects.ts:186](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/effects.ts#L186)

---

### oneWayFromMain

▸ **oneWayFromMain**<`T`\>(`get`, `asyncKey`, `asyncDataCoercion`):
`AtomEffect`<`T`\>

At atom effect for pulling data from the IPC channel, with asynchronous setting
from the main process, but with no ability to push data _back_ through the IPC
channel (i.e. one way from Main :)

#### Type parameters

| Name | Description                                    |
| :--- | :--------------------------------------------- |
| `T`  | the type of the atom (implied from the getter) |

#### Parameters

| Name                | Type                                      | Description                                                                                                           |
| :------------------ | :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `get`               | () => `T` \| `Promise`<`T`\>              | The function (or promise) that gets the value                                                                         |
| `asyncKey`          | `string`                                  | The key for an asynchronous assignment                                                                                |
| `asyncDataCoercion` | (`data`: `unknown`) => `undefined` \| `T` | The value that takes the message from Main and translates it to the T datatype (or returns nothing if it's incorrect) |

#### Returns

`AtomEffect`<`T`\>

#### Defined in

[src/effects.ts:98](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/effects.ts#L98)

▸ **oneWayFromMain**<`T`\>(`get`): `AtomEffect`<`T`\>

At atom effect for pulling data from the IPC channel, with no ability to push
data _back_ through the IPC channel (i.e. one way from Main :)

This version doesn't include the ability to update the value asynchronously from
the main process.

#### Type parameters

| Name | Description                                    |
| :--- | :--------------------------------------------- |
| `T`  | the type of the atom (implied from the getter) |

#### Parameters

| Name  | Type                         | Description                                   |
| :---- | :--------------------------- | :-------------------------------------------- |
| `get` | () => `T` \| `Promise`<`T`\> | The function (or promise) that gets the value |

#### Returns

`AtomEffect`<`T`\>

#### Defined in

[src/effects.ts:115](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/effects.ts#L115)

---

### syncWithMain

▸ **syncWithMain**<`T`\>(`asyncUpdates?`): `AtomEffect`<`T`\>

An Atom effect to acquire the value from main, and save it back when modified,
after processing it from the original type to JSON using Pickling.

#### Type parameters

| Name | Description          |
| :--- | :------------------- |
| `T`  | the type of the atom |

#### Parameters

| Name            | Type      | Description                                                                            |
| :-------------- | :-------- | :------------------------------------------------------------------------------------- |
| `asyncUpdates?` | `boolean` | Optionally true if you also need to respond to asynchronous server (main) side changes |

#### Returns

`AtomEffect`<`T`\>

#### Defined in

[src/effects.ts:266](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/effects.ts#L266)

---

### translateToMain

▸ **translateToMain**<`T`\>(`toString`, `fromString`): `AtomEffect`<`T`\>

At atom effect that uses the provided stringification/destringification
functions to get/set a value that gets saved & loaded from the app's persistent
data storage (implemented in @freik/elect-main-utils)

#### Type parameters

| Name | Description                                                     |
| :--- | :-------------------------------------------------------------- |
| `T`  | The type of the atom (implied from the to/fromString functions) |

#### Parameters

| Name         | Type                                 | Description                                          |
| :----------- | :----------------------------------- | :--------------------------------------------------- |
| `toString`   | (`input`: `T`) => `string`           | Translation function to a string for communication   |
| `fromString` | (`input`: `string`) => `void` \| `T` | Translation function from a string for communication |

#### Returns

`AtomEffect`<`T`\>

The Recoil effect

#### Defined in

[src/effects.ts:55](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/effects.ts#L55)
