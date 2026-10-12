import { Module } from '@nestjs/common';
import { TrigramIndexService } from './trigram-index.service';

@Module({
  providers: [TrigramIndexService],
  exports: [TrigramIndexService],
})
export class TrigramIndexModule {}
