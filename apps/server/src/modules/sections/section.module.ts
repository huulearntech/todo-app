import { Module } from "@nestjs/common";
import { SectionController } from "./section.controller";
import { SectionService } from "./section.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Section } from "./section.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Section])], // Import the Task entity for use in this module
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}