import { Player } from '@common/game';

export enum GameCreationEvents {
    GameClosed = 'gameClosed',
    PlayerLeft = 'playerLeft',
    CreateGame = 'createGame',
    GameCreated = 'gameCreated',
    JoinGame = 'joinGame',
    GameLocked = 'gameLocked',

    YouJoined = 'youJoined',
    PlayerJoined = 'playerJoined',
    CurrentPlayers = 'currentPlayers',
    GameNotFound = 'gameNotFound',

    GetPlayers = 'getPlayers',
    KickPlayer = 'kickPlayer',
    PlayerKicked = 'playerKicked',

    GetGameData = 'getGameData',
    CurrentGame = 'currentGame',

    AccessGame = 'accessGame',
    GameAccessed = 'gameAccessed',

    InitializeGame = 'initializeGame',
    GameInitialized = 'gameInitialized',

    ToggleGameLockState = 'toggleGameLockState',
    GameLockToggled = 'gameLockToggled',

    GameAlreadyStarted = 'gameAlreadyStarted',

    IfStartable = 'ifStartable',
    IsStartable = 'isStartable',

    LeaveGame = 'leaveGame',
}

export interface KickPlayerData {
    gameId: string;
    playerId: string;
}

export interface JoinGameData {
    player: Player;
    gameId: string;
}

export interface ToggleGameLockStateData {
    isLocked: boolean;
    gameId: string;
}
