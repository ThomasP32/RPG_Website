import { TestBed } from '@angular/core/testing';
import { Game, GameCtf, Player } from '@common/game';
import { ItemCategory, Mode, TileCategory } from '@common/map.types';
import { EndgameService } from './endgame.service';

describe('EndgameService', () => {
    let service: EndgameService;

    const mockPlayer: Player = {
        socketId: 'player-socket-id',
        name: 'Player1',
        avatar: 1,
        isActive: true,
        specs: {
            evasions: 2,
            life: 100,
            speed: 10,
            attack: 15,
            defense: 10,
            attackBonus: 4,
            defenseBonus: 4,
            movePoints: 5,
            actions: 2,
            nVictories: 0,
            nDefeats: 0,
            nCombats: 0,
            nEvasions: 0,
            nLifeTaken: 0,
            nLifeLost: 0,
            nItemsUsed: 0,
        },
        inventory: [],
        position: { x: 0, y: 0 },
        initialPosition: { x: 0, y: 0 },
        turn: 0,
        visitedTiles: [{ x: 0, y: 0 }],
    };

    const mockGameCtf: GameCtf = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 2 }, isOpened: false },
            { coordinate: { x: 2, y: 1 }, isOpened: true },
        ],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer],
        mode: Mode.Ctf,
        nPlayersCtf: [mockPlayer],
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [{ x: 1, y: 2 }],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };

    const mockGameDoor: Game = {
        id: 'test-game-id',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [
            { coordinate: { x: 1, y: 2 }, isOpened: false },
            { coordinate: { x: 2, y: 1 }, isOpened: true },
        ],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [{ x: 1, y: 2 }],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };
    const mockGameNoDoor: Game = {
        id: 'test-game-id-no-door',
        hostSocketId: 'test-socket',
        hasStarted: true,
        currentTurn: 0,
        mapSize: { x: 10, y: 10 },
        tiles: [
            { coordinate: { x: 2, y: 2 }, category: TileCategory.Water },
            { coordinate: { x: 3, y: 3 }, category: TileCategory.Ice },
            { coordinate: { x: 4, y: 4 }, category: TileCategory.Wall },
        ],
        doorTiles: [],
        startTiles: [{ coordinate: { x: 0, y: 0 } }],
        items: [{ coordinate: { x: 0, y: 1 }, category: ItemCategory.Armor }],
        players: [mockPlayer],
        mode: Mode.Classic,
        nTurns: 0,
        debug: false,
        nDoorsManipulated: [],
        duration: 0,
        isLocked: true,
        name: 'game',
        description: 'game description',
        imagePreview: 'image-preview',
    };
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EndgameService],
        });
        service = TestBed.inject(EndgameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getPlayerTilePercentage', () => {
        it('should calculate correct percentage for player visited tiles', () => {
            const percentage = service.getPlayerTilePercentage(mockPlayer, mockGameDoor);
            expect(percentage).toBe(1);
        });
    });

    describe('gameDurationInMinutes', () => {
        it('should format duration less than 1 minute', () => {
            expect(service.gameDurationInMinutes(45)).toBe('00:45');
        });

        it('should format duration with single-digit seconds', () => {
            expect(service.gameDurationInMinutes(65)).toBe('01:05');
        });

        it('should format duration with multiple minutes', () => {
            expect(service.gameDurationInMinutes(185)).toBe('03:05');
        });

        it('should format duration with zero seconds', () => {
            expect(service.gameDurationInMinutes(120)).toBe('02:00');
        });

        it('should handle zero duration', () => {
            expect(service.gameDurationInMinutes(0)).toBe('00:00');
        });
    });

    describe('gameTilePercentage', () => {
        it('should calculate percentage of unique tiles visited by all players', () => {
            const percentage = service.gameTilePercentage(mockGameDoor);
            expect(percentage).toBe(1);
        });
    });

    describe('gameDoorPercentage', () => {
        it('should calculate percentage of doors opened', () => {
            const percentage = service.gameDoorPercentage(mockGameDoor);
            expect(percentage).toBe(50);
        });
        it('should return 0 if no doors', () => {
            const percentage = service.gameDoorPercentage(mockGameNoDoor);
            expect(percentage).toBe(0);
        });
    });

    describe('getFlagPickupPlayers', () => {
        it('should return number of unique players who picked up flag', () => {
            const players = service.getFlagPickupPlayers(mockGameCtf);
            expect(players).toBe(1);
        });
    });

    describe('sortTable', () => {
        it('should sort table', () => {
            service.sortTable(1);
            expect(service.isSortingAsc).toBe(true);
        });
        it('should sort table by column', () => {
            const table = document.createElement('table');
            table.id = 'stats-table';
            const row = table.insertRow();
            row.insertCell(0).innerHTML = '1';
            row.insertCell(1).innerHTML = '2';
            row.insertCell(2).innerHTML = '3';
            document.body.appendChild(table);
            service.sortTable(1);
            expect(service.isSortingAsc).toBe(true);
            expect(table.rows[0].cells[0].innerHTML).toBe('1');
            document.body.removeChild(table);
        });
        describe('sortTable', () => {
            it('should sort table by column in ascending order', () => {
                const table = document.createElement('table');
                table.id = 'stats-table';
                const rows = [
                    ['A', '10'],
                    ['C', '5'],
                    ['B', '15'],
                ];

                rows.forEach((row) => {
                    const tr = document.createElement('tr');
                    row.forEach((cellText) => {
                        const td = document.createElement('td');
                        td.textContent = cellText;
                        tr.appendChild(td);
                    });
                    table.appendChild(tr);
                });
                document.body.appendChild(table);

                service.sortTable(1);

                const sortedRows = table.rows;
                expect(sortedRows[1].cells[1].textContent).toBe('5');
                expect(sortedRows[2].cells[1].textContent).toBe('15');

                document.body.removeChild(table);
            });
            it('should sort a table of numbers in ascending order', () => {
                const table = document.createElement('table');
                const tbody = document.createElement('tbody');
                tbody.innerHTML = `
                  <tr><td>10</td><td>20</td></tr>
                  <tr><td>5</td><td>30</td></tr>
                `;
                table.appendChild(tbody);
                document.body.appendChild(table);

                service.sortTable(0);
                service.sortTable(1);

                const rows = tbody.rows;
                expect(rows[0].cells[0].textContent).toBe('10');
                expect(rows[1].cells[0].textContent).toBe('5');

                document.body.removeChild(table);
            });
        });
    });
});
