import { Comms } from '@freik/electron-main';
import { IpcId } from '@freik/emp-shared';
import { MakeLog } from '@freik/logger';

const { log } = MakeLog('EMP:main:SendToUI');

// This is for one-way comms to the UI process

export function SendToUI<T>(name: IpcId, data: T) {
  const obj: { [key: string]: T } = {};
  obj[name] = data;
  log(`Sending ${name} with data:`);
  log(data);
  Comms.AsyncSend(obj);
}
