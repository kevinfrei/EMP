import { DependencyList, useEffect } from 'react';
import { InitialWireUp, Subscribe, Unsubscribe } from './ipc';

/**
 * This is a React Hook that lets you listen for data sent from the main
 * process, via the
 * [`AsyncSend`](https://github.com/kevinfrei/elect-main-tools/blob/main/docs/modules/Comms.md#asyncsend)
 * function in the [companion module](https://github.com/kevinfrei/elect-main-tools).
 *
 * @param message The message type to listen to
 * @param listener The function to invoke with the data sent
 */
export function useListener(
  message: string,
  listener: (args: unknown) => void,
): void {
  useEffect(() => {
    const subKey = Subscribe(message, listener);
    return () => Unsubscribe(subKey);
  });
}

/**
 * This is the helper JSX element to support IPC with the main process.
 * Use it like this:
 * ```html
 * <App>
 *   <RecoilRoot>
 *     <FreikElem/>
 *     <MyOtherStuff/>
 *   </RecoilRoot>
 * </All>
 * ```
 */
export function ElectronWireUp(): JSX.Element {
  useEffect(InitialWireUp);
  /*
  const callback = useMyTransaction(
    (xact) => (data: unknown) => MenuHandler(xact, data),
  );
  useListener('menuAction', callback);
  const handleWidthChange = useMyTransaction(
    ({ set }) =>
      (ev: MediaQueryList | MediaQueryListEvent) => {
        // set(isMiniplayerState, ev.matches);
      },
  );
  useEffect(() => {
    SubscribeMediaMatcher('(max-width: 499px)', handleWidthChange);
    return () => UnsubscribeMediaMatcher(handleWidthChange);
  });
  const setViewMode = useMyTransaction(({ set }) => (data: unknown) => {
    log('Set View Mode transaction: ', data);
    if (Type.isNumber(data)) {
      log("(it's a number!)");
      set(viewModeState, data);
    }
  });
  useListener('set-view-mode', setViewMode);
  */
  return <></>;
}

/**
 * Add a listener for a media query, and invoke it once, which
 * is necessary to get it to start paying attention, apparently?
 *
 * Use it like this:
 * ```typescript
 * const handleWidthChange = useMyTransaction(
 *   ({ set }) =>
 *     ev: MediaQueryList | MediaQueryListEvent) => {
 *       set(isMiniplayerState, ev.matches);
 *     },
 * );
 * useMediaEffect('(max-width: 499px)', handleWidthChange);
 * ```
 *
 * @param mq The media query to listen for changes in
 * @param handler The function to invoke when the media query changes
 */
export function useMediaEffect(
  mq: string,
  handler: (ev: MediaQueryList | MediaQueryListEvent) => void,
  deps?: DependencyList,
): void {
  let mediaQuery: MediaQueryList | null = null;

  const subscribeMediaMatcher = () => {
    mediaQuery = window.matchMedia(mq);
    mediaQuery.addEventListener('change', handler);
    handler(mediaQuery);
  };

  /**
   * Remove the mediaquery listener. See {@link SubscribeMediaMatcher} for
   * an example
   *
   * @param handler the handler that had been previously subscribed
   */
  const unsubscribeMediaMatcher = () =>
    mediaQuery?.removeEventListener('change', handler);

  return useEffect(() => {
    subscribeMediaMatcher();
    return () => unsubscribeMediaMatcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps, @typescript-eslint/no-unsafe-assignment
  }, [handler, mq, ...(deps || [])]);
}
