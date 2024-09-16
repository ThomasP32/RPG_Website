import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, Validate, ValidateNested } from 'class-validator';
import { IsOutOfMap } from './game.dto.constraints';

export class CoordinateDto {
    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;
}

export class DoorTileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty({ default: false })
    @IsBoolean()
    isOpened: boolean;
}

export class CreateGameDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ default: false })
    @IsBoolean()
    isVisible: boolean;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    mapSize: CoordinateDto;

    @ApiProperty({ type: [CoordinateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    startTiles: CoordinateDto[];

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    attributeItem1: CoordinateDto;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    attributeItem2: CoordinateDto;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    conditionItem1: CoordinateDto;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    conditionItem2: CoordinateDto;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    functionItem1: CoordinateDto;

    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    functionItem2: CoordinateDto;

    @ApiProperty({ type: [CoordinateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    waterTiles: CoordinateDto[];

    @ApiProperty({ type: [CoordinateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    iceTiles: CoordinateDto[];

    @ApiProperty({ type: [CoordinateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => CoordinateDto)
    wallTiles: CoordinateDto[];

    @ApiProperty({ type: [DoorTileDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Validate(IsOutOfMap)
    @Type(() => DoorTileDto)
    doorTiles: DoorTileDto[];

    @ApiProperty()
    _id?: string;
}
