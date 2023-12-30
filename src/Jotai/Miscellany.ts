import { isBoolean } from '@freik/typechk';
import { atomFromMain } from './Storage';

export const RescanInProgressState = atomFromMain(
  'RescanInProgress',
  false,
  isBoolean,
);
