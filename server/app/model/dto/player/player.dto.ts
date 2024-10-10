import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PlayerDto {
    @ApiProperty()
    @IsString()
    gameId: string;

    @ApiProperty()
    @IsNumber()
    avatarType: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

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
