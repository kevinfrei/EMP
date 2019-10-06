// @flow
import type { Store } from 'undux';
import type { State } from './MyStore';

const Handler = (store: Store<State>, message: string) => {
  const [msg, num] = message.split(':');
  if (num !== undefined) {
    const val: number = Number.parseInt(num);
    store.set('foo')(val);
  }
  store.set('bar')(msg);
};

export default Handler;