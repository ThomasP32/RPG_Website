import { Mode } from '@common/map.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CoordinateDto, StartTileDto } from './coordinate.dto';
import { DoorTileDto } from './door.dto';
import { ItemDto, TileDto } from './tiles.dto';

export class MapDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Un nom pour le jeu est obligatoire' })
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'Une description pour le jeu est obligatoire' })
    description: string;

    @ApiProperty()
    @IsString()
    imagePreview: string;

    @ApiProperty({ enum: Mode })
    @IsEnum(Mode)
    mode: Mode;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    mapSize: CoordinateDto;

    @ApiProperty({ type: [StartTileDto] })
    @IsArray()
    @ArrayNotEmpty({ message: 'Il faut placer au moins deux points de départ sur votre carte' })
    @ValidateNested({ each: true })
    @Type(() => StartTileDto)
    startTiles: StartTileDto[];

    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemDto)
    items: ItemDto[];

    @ApiProperty({ type: [TileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TileDto)
    tiles: TileDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DoorTileDto)
    doorTiles: DoorTileDto[];
}
