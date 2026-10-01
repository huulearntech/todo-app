import { createZodDto } from "nestjs-zod";
import { rruleSchema, type RRule as RRulePayload } from "@todo/shared";


export class RRuleDto extends createZodDto(rruleSchema) {}
export interface RRuleDto extends RRulePayload {}