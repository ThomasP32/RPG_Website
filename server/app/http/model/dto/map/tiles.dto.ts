import { ItemCategory, TileCategory } from '@common/map.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { CoordinateDto } from '@app/http/model/dto/map/coordinate.dto';

export class TileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty()
    @IsEnum(TileCategory)
    category: TileCategory;
}

export class ItemDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty()
    @IsEnum(ItemCategory)
    category: ItemCategory;
}
