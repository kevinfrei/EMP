[@freik/elect-render-utils](../README.md) / [Exports](../modules.md) /
MediaQuery

# Namespace: MediaQuery

## Table of contents

### Functions

- [SubscribeMediaMatcher](MediaQuery.md#subscribemediamatcher)
- [UnsubscribeMediaMatcher](MediaQuery.md#unsubscribemediamatcher)

## Functions

### SubscribeMediaMatcher

▸ **SubscribeMediaMatcher**(`mq`, `handler`): `void`

Add a listener for a media query, and invoke it once, which is necessary to get
it to start paying attention, apparently?

Use it like this:

```typescript
const handleWidthChange = useMyTransaction(
  ({ set }) =>
    ev: MediaQueryList | MediaQueryListEvent) => {
      set(isMiniplayerState, ev.matches);
    },
);
useEffect(() => {
  SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
  return () => UnsubscribeMediaMatcher(handleWidthChange);
});
```

#### Parameters

| Name      | Type                                                        | Description                                         |
| :-------- | :---------------------------------------------------------- | :-------------------------------------------------- |
| `mq`      | `string`                                                    | The media query to listen for changes in            |
| `handler` | (`ev`: `MediaQueryList` \| `MediaQueryListEvent`) => `void` | The function to invoke when the media query changes |

#### Returns

`void`

#### Defined in

[src/mediaquery.ts:24](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/mediaquery.ts#L24)

---

### UnsubscribeMediaMatcher

▸ **UnsubscribeMediaMatcher**(`handler`): `void`

Remove the mediaquery listener. See
[SubscribeMediaMatcher](MediaQuery.md#subscribemediamatcher) for an example

#### Parameters

| Name      | Type                                                        | Description                                     |
| :-------- | :---------------------------------------------------------- | :---------------------------------------------- |
| `handler` | (`ev`: `MediaQueryList` \| `MediaQueryListEvent`) => `void` | the handler that had been previously subscribed |

#### Returns

`void`

#### Defined in

[src/mediaquery.ts:39](https://github.com/kevinfrei/elect-render-tools/blob/1e1a61f/src/mediaquery.ts#L39)
