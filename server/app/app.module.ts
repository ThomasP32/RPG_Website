import { AdminController } from '@app/http/controllers/admin/admin.controller';
import { MapController } from '@app/http/controllers/map/map.controller';
import { Map, mapSchema } from '@app/http/model/schemas/map/map.schema';
import { AdminService } from '@app/http/services/admin/admin.service';
import { MapService } from '@app/http/services/map/map.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { JournalService } from '@app/services/journal/journal.service';
import { ChatRoomGateway } from '@app/socket/game/gateways/chatroom/chatroom.gateway';
import { GameGateway } from '@app/socket/game/gateways/game-creation/game-creation.gateway';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatroomService } from './services/chatroom/chatroom.service';
import { CombatService } from './services/combat/combat.service';
import { CombatCountdownService } from './services/countdown/combat/combat-countdown.service';
import { GameCountdownService } from './services/countdown/game/game-countdown.service';
import { GameManagerService } from './services/game-manager/game-manager.service';
import { ItemsManagerService } from './services/items-manager/items-manager.service';
import { VirtualGameManagerService } from './services/virtual-game-manager/virtual-game-manager.service';
import { CombatGateway } from './socket/game/gateways/combat/combat.gateway';
import { GameManagerGateway } from './socket/game/gateways/game-manager/game-manager.gateway';

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
        CombatService,
        GameManagerGateway,
        GameManagerService,
        JournalService,
        GameCountdownService,
        CombatCountdownService,
        VirtualGameManagerService,
        ItemsManagerService,
    ],
})
export class AppModule {}
