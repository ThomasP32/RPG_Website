import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';
import { CoordinateDto } from '@app/http/model/dto/map/coordinate.dto';

export class DoorTileDto {
    @ApiProperty({ type: CoordinateDto })
    @ValidateNested()
    @Type(() => CoordinateDto)
    coordinate: CoordinateDto;

    @ApiProperty({ default: false })
    @IsBoolean()
    isOpened: boolean;
}
