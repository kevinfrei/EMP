import { Pickle, Type, Unpickle } from '@freik/core-utils';
import { AtomEffectParams } from '@freik/web-utils';
import { act, create } from 'react-test-renderer';
import { AtomEffect, DefaultValue, RecoilRoot } from 'recoil';
import { FluentInitIcons } from '../../FluentInit';
import { CallMain } from '../../__mocks__/MyWindow';
import { VolumeControl } from '../VolumeControl';

export function oneWayFromMain<T>(
  get: () => T | Promise<T>,
  asyncKey?: string,
  asyncDataCoercion?: (data: unknown) => T | undefined,
): AtomEffect<T> {
  return ({ node, trigger, setSelf, onSet }: AtomEffectParams<T>): void => {
    if (trigger === 'get') {
      const res = get();
      if (!Type.isPromise(res)) {
        setSelf(res);
      } else {
        res.then(setSelf).catch((rsn) => {
          throw rsn;
        });
      }
    }
    onSet((newVal /* , oldVal */) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      throw Error(`Invalid assignment to server-side-only atom ${node.key}`);
    });
  };
}

function bidirectionalSyncWithTranslate<T>(
  toPickleable: (val: T) => unknown,
  fromUnpickled: (val: unknown) => T | void,
  asyncUpdates?: boolean,
): AtomEffect<T> {
  return ({
    node,
    trigger,
    setSelf,
    onSet,
  }: AtomEffectParams<T>): (() => void) | void => {
    if (trigger === 'get') {
      CallMain('read-from-storage', node.key)
        .then((value) => {
          if (value) {
            const data = fromUnpickled(Unpickle(value));
            if (data) {
              setSelf(data);
            }
          }
        })
        .catch(() => {
          throw new Error(`${node.key} Get failed in bidirectional sync`);
        });
    }
    onSet((newVal, oldVal) => {
      if (newVal instanceof DefaultValue) {
        return;
      }
      const newPickled = Pickle(toPickleable(newVal));
      if (
        oldVal instanceof DefaultValue ||
        Pickle(toPickleable(oldVal)) !== newPickled
      ) {
        WriteToStorage(node.key, newPickled).catch(() => {
          throw new Error(`${node.key} save to main failed`);
        });
      }
    });
  };
}

function syncWithMain<T>(asyncUpdates?: boolean): AtomEffect<T> {
  return bidirectionalSyncWithTranslate<T>(
    (a) => a as unknown,
    (a) => a as T,
    asyncUpdates,
  );
}

jest.mock('../../MyWindow');
jest.mock('@freik/elect-render-utils', () => ({
  Effects: {
    bidirectionalSyncWithTranslate,
    syncWithMain,
    oneWayFromMain,
  },
  FreikElem: {},
  Ipc: {},
  MediaQuery: {},
  Util: {},
  useListener: {},
}));
it('renders without crashing', async () => {
  await act(async () => {
    FluentInitIcons();
    create(
      <RecoilRoot>
        <VolumeControl />
      </RecoilRoot>,
    );
    return new Promise((res) => res());
  });
});
