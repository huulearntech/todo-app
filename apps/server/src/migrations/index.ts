import { CreateLexorankTaskFunctions1727860000000 } from './1727860000000-CreateLexorankTaskFunctions';
import { SeedDefaultColorsForUsers1728100000000 } from './1728100000000-SeedDefaultColorsForUsers';
import { AddColorToProjects1728200000000 } from './1728200000000-AddColorToProjects';
import { CreateTrigramSearchIndexes1728300000000 } from './1728300000000-CreateTrigramSearchIndexes';
import { FixTimeRangeAndStandardizeDescription1728400000000 } from './1728400000000-FixTimeRangeAndStandardizeDescription';
import { FixCreateTaskPriorityEnum1728400001000 } from './1728400001000-FixCreateTaskPriorityEnum';
import { CreateTaskOccurrencesAndBackfill1728500000000 } from './1728500000000-CreateTaskOccurrencesAndBackfill';

export const migrations = [
  SeedDefaultColorsForUsers1728100000000,
  AddColorToProjects1728200000000,
  CreateLexorankTaskFunctions1727860000000,
  CreateTrigramSearchIndexes1728300000000,
  FixTimeRangeAndStandardizeDescription1728400000000,
  FixCreateTaskPriorityEnum1728400001000,
  CreateTaskOccurrencesAndBackfill1728500000000,
];
export {
  CreateLexorankTaskFunctions1727860000000,
  SeedDefaultColorsForUsers1728100000000,
  AddColorToProjects1728200000000,
  CreateTrigramSearchIndexes1728300000000,
  FixTimeRangeAndStandardizeDescription1728400000000,
  FixCreateTaskPriorityEnum1728400001000,
  CreateTaskOccurrencesAndBackfill1728500000000,
};
