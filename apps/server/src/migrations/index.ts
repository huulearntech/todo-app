import { CreateLexorankTaskFunctions1727860000000 } from './1727860000000-CreateLexorankTaskFunctions';
import { NormalizeUserEmailAndTaskOccurrenceConstraint1728000000000 } from './1728000000000-NormalizeUserEmailAndTaskOccurrenceConstraint';
import { SecurityAndDataIntegrityConstraints1728100000000 } from './1728100000000-SecurityAndDataIntegrityConstraints';
import { CreateLexorankSectionFunctions1728200000000 } from './1728200000000-CreateLexorankSectionFunctions';
import { CreateTasksTimeRangeGistIndex1728300000000 } from './1728300000000-CreateTasksTimeRangeGistIndex';

export const migrations = [
  CreateLexorankTaskFunctions1727860000000,
  NormalizeUserEmailAndTaskOccurrenceConstraint1728000000000,
  SecurityAndDataIntegrityConstraints1728100000000,
  CreateLexorankSectionFunctions1728200000000,
  CreateTasksTimeRangeGistIndex1728300000000,
];

export {
  CreateLexorankTaskFunctions1727860000000,
  NormalizeUserEmailAndTaskOccurrenceConstraint1728000000000,
  SecurityAndDataIntegrityConstraints1728100000000,
  CreateLexorankSectionFunctions1728200000000,
  CreateTasksTimeRangeGistIndex1728300000000,
};
