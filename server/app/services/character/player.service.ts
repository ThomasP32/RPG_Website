import { PlayerDto } from '@app/model/dto/player/player.dto';
import { Player, PlayerDocument } from '@app/model/dto/player/player.schema';
import { UpdatePlayerDto } from '@app/model/dto/player/update-player.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PlayerService {
    @InjectModel(Player.name) public playerModel: Model<PlayerDocument>;

    async getAllPlayersFromGame(gameId: string): Promise<Player[]> {
        return await this.playerModel.find({ gameId: gameId });
    }

    async getPlayerById(playerId: string): Promise<Player> {
        const map = await this.playerModel.findById({ playerId });
        if (!map) {
            throw new Error(`Failed to find player with id : ${playerId}`);
        }
        return map;
    }

    async updatePlayer(playerId: string, updatePlayer: UpdatePlayerDto): Promise<Player> {
        return await this.playerModel.findByIdAndUpdate(
            playerId,
            {
                $set: {
                    health: updatePlayer.life,
                    attack: updatePlayer.attack,
                    defense: updatePlayer.defense,
                    speed: updatePlayer.speed,
                },
            },
            { new: true },
        );
    }

    async addPlayer(player: PlayerDto): Promise<void> {
        await this.playerModel.create(player);
    }
}
