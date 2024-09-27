import { Mode } from '@common/map.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DoorTileDto, ItemDto, StartTileDto, TileDto } from './create-map.dto';

export class UpdateMapDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ type: String, enum: Mode })
    @IsOptional()
    @IsEnum(Mode)
    mode?: Mode;

    @ApiProperty()
    @IsOptional()
    @IsString()
    imagePreview?: string;

    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    @ApiProperty({ type: [StartTileDto] })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested()
    @Type(() => StartTileDto)
    startTiles?: StartTileDto[];

    @ApiProperty({ type: [ItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => ItemDto)
    items?: ItemDto[];

    @ApiProperty({ type: [TileDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => TileDto)
    tiles?: TileDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => DoorTileDto)
    doorTiles?: DoorTileDto[];

    @ApiProperty()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastModified?: Date;

    @ApiProperty()
    _id?: string;
}
