import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
export class OptionDto { @IsString() @IsNotEmpty() text!: string; @IsBoolean() isCorrect!: boolean; }
export class QuestionDto {
  @IsString() @IsNotEmpty() text!: string;
  @IsArray() @ArrayMinSize(2) @ValidateNested({ each: true }) @Type(() => OptionDto) options!: OptionDto[];
}
export class CreateAssignmentDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsUUID() classroomId!: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => QuestionDto) questions!: QuestionDto[];
}
export class AnswerDto { @IsUUID() questionId!: string; @IsUUID() optionId!: string; }
