import { IsArray, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
export class ClassroomDto { @IsString() @IsNotEmpty() name!: string; }
export class TeacherDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) classroomIds?: string[];
}
export class ParentDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) childIds?: string[];
}
export class ChildDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsUUID() classroomId!: string;
  @IsOptional() @IsDateString() birthDate?: string;
}
export class LinkChildDto { @IsUUID() childId!: string; }
