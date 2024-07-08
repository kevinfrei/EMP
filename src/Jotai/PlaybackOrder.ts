import { IpcId } from '@freik/emp-shared';
import { isBoolean } from '@freik/typechk';
import { atomFromMain } from './Storage';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');
export const shuffleState = atomFromMain(IpcId.Shuffle, isBoolean);

export const repeatState = atomFromMain(IpcId.Repeat, isBoolean);
