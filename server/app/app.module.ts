import { AdminController } from '@app/http/controllers/admin/admin.controller';
import { MapController } from '@app/http/controllers/map/map.controller';
import { Map, mapSchema } from '@app/http/model/schemas/map/map.schema';
import { AdminService } from '@app/http/services/admin/admin.service';
import { MapService } from '@app/http/services/map/map.service';
import { ChatRoomGateway } from '@app/socket/game/gateways/chatroom/chatroom.gateway';
import { GameGateway } from '@app/socket/game/gateways/game-creation/game-creation.gateway';
import { ChatroomService } from '@app/socket/game/service/chatroom/chatroom.service';
import { GameCreationService } from '@app/socket/game/service/game-creation/game-creation.service';
import { JournalService } from '@app/socket/game/service/journal/journal.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatGateway } from './socket/game/gateways/combat/combat.gateway';
import { GameManagerGateway } from './socket/game/gateways/game-manager/game-manager.gateway';
import { ServerCombatService } from './socket/game/service/combat/combat.service';
import { CombatCountdownService } from './socket/game/service/countdown/combat/combat-countdown.service';
import { GameCountdownService } from './socket/game/service/countdown/game/game-countdown.service';
import { GameManagerService } from './socket/game/service/game-manager/game-manager.service';
import { VirtualGameManagerService } from './socket/game/service/virtual-game-manager/virtual-game-manager.service';

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
        MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }]),
    ],
    controllers: [MapController, AdminController],
    providers: [
        MapService,
        AdminService,
        GameCreationService,
        GameGateway,
        Logger,
        ChatRoomGateway,
        ChatroomService,
        CombatGateway,
        ServerCombatService,
        GameManagerGateway,
        GameManagerService,
        JournalService,
        GameCountdownService,
        CombatCountdownService,
        VirtualGameManagerService,
    ],
})
export class AppModule {}
