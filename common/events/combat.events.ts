import { Game, Player } from '@common/game';

export enum CombatEvents {
    StartCombat = 'startCombat',
    Attack = 'attack',
    StartEvasion = 'startEvasion',
    CurrentPlayer = 'currentPlayer',

    CombatStarted = 'combatStarted',
    GetCombats = 'getCombats',
    CombatStartedSignal = 'combatStartedSignal',
    YouStartedCombat = 'YouStartedCombat',

    EvasionSuccess = 'evasionSuccess',
    CombatFinishedByEvasion = 'combatFinishedByEvasion',
    EvasionFailed = 'evasionFailed',

    DiceRolled = 'diceRolled',
    AttackFailure = 'attackFailure',
    AttackSuccess = 'attackSuccess',

    CombatFinished = 'combatFinished',
    CombatFinishedNormally = 'combatFinishedNormally',
    GameFinishedPlayerWon = 'gameFinishedPlayerWon',
    ResumeTurnAfterCombatWin = 'resumeTurnAfterCombatWin',

    YourTurnCombat = 'yourTurnCombat',
    PlayerTurnCombat = 'playerTurnCombat',

    CombatFinishedByDisconnection = 'combatFinishedByDisconnection',
}
export interface CombatStartedData {
    challenger: Player;
    opponent: Player;
}

export interface StartCombatData {
    gameId: string;
    opponent: Player;
}

export interface CombatFinishedByEvasionData {
    updatedGame: Game;
    evadingPlayer: Player;
}

export interface CombatFinishedData {
    updatedGame: Game;
    winner: Player;
    loser: Player;
}
