import { CreateLexorankTaskFunctions1727860000000 } from './1727860000000-CreateLexorankTaskFunctions';
import { SeedDefaultColorsForUsers1728100000000 } from './1728100000000-SeedDefaultColorsForUsers';
import { AddColorToProjects1728200000000 } from './1728200000000-AddColorToProjects';
import { CreateTrigramSearchIndexes1728300000000 } from './1728300000000-CreateTrigramSearchIndexes';

export const migrations = [
  SeedDefaultColorsForUsers1728100000000,
  AddColorToProjects1728200000000,
  CreateLexorankTaskFunctions1727860000000,
  CreateTrigramSearchIndexes1728300000000,
];
export {
  CreateLexorankTaskFunctions1727860000000,
  SeedDefaultColorsForUsers1728100000000,
  AddColorToProjects1728200000000,
  CreateTrigramSearchIndexes1728300000000,
};
