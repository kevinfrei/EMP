import { isBoolean } from '@freik/typechk';
import { atomFromMain } from './Storage';

// const log = MakeLogger('ReadWrite');
// const err = MakeError('ReadWrite-err');
export const shuffleState = atomFromMain('shuffle', isBoolean);

export const repeatState = atomFromMain('repeat', isBoolean);
