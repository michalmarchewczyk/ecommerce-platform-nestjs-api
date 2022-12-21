import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PageGroupDto } from './page-group.dto';
import { Type } from 'class-transformer';

export class PageUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;

  @IsOptional()
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @IsNotEmptyObject({ nullable: false }, { each: true })
  @Type(() => PageGroupDto)
  groups?: PageGroupDto[];
}
