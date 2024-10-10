import { ApiProperty } from '@nestjs/swagger';
import { IsNumber} from 'class-validator';

export class UpdatePlayerDto {
    @ApiProperty()
    @IsNumber()
    speed: number;

    @ApiProperty()
    @IsNumber()
    attack: number;

    @ApiProperty()
    @IsNumber()
    life: number;

    @ApiProperty()
    @IsNumber()
    defense: number;
}
