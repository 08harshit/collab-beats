import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsInt()
  hostId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
