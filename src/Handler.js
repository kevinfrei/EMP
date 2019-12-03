// @flow

import logger from 'simplelogger';

import type { Store } from 'undux';
import type { State } from './MyStore';

const log = logger.bind('handler');
logger.disable('handler');

const AsyncMessageHandler = (store: Store<State>, message: string) => {
  // TODO: Make this do real stuff
  const [msg, num] = message.split(':');
  if (num !== undefined) {
    const val: number = Number.parseInt(num);
    store.set('foo')(val);
  }
  store.set('bar')(msg);
};

const AsyncReplyHandler = (
  store: Store<State>,
  event: Object,
  ...args: Array<string>
) => {
  if (store.get('request') !== 'sent') {
    // TODO: Make sure this is handled properly somehow
    log(
      'Reply received but request not sent, already replied to, or overlapped.'
    );
    return;
  }
  store.set('request')('none');
  // TODO: Handle the async reply here...
};

export { AsyncMessageHandler, AsyncReplyHandler };
