import { MapController } from '@app/controllers/map/map.controller';
import { Player, playerSchema } from '@app/model/dto/player/player.schema';
import { Map, mapSchema } from '@app/model/schemas/map.schema';
import { MapService } from '@app/services/map/map.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './controllers/admin/admin.controller';
import { PlayerController } from './controllers/player/player.controller';
import { AdminService } from './services/admin/admin.service';
import { PlayerService } from './services/character/player.service';

@Module({
    // decorateur qui permet d'indique que la classe regroupe controleur, service, etc.
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), // charge les configs comme .env disponible partout dans appmodule
        MongooseModule.forRootAsync({
            imports: [ConfigModule], // importe le module qui fournit configservice
            inject: [ConfigService], // injecte configservice dans usefactory
            useFactory: async (config: ConfigService) => ({
                // retourne la configuration pour mongoose
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([
            { name: Map.name, schema: mapSchema },
            { name: Player.name, schema: playerSchema },
        ]),
    ],
    controllers: [MapController, AdminController, PlayerController],
    providers: [MapService, AdminService, PlayerService, Logger],
})
export class AppModule {}
