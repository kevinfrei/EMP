import { isBoolean } from '@freik/typechk';
import { atomFromMain } from './Storage';

export const rescanInProgressState = atomFromMain(
  'RescanInProgress',
  false,
  isBoolean,
);
