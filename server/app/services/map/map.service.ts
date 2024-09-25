import { MapDocument } from '@app/model/database/map';
import { CoordinateDto, CreateMapDto, DoorTileDto, ItemDto, StartTileDto, TileDto } from '@app/model/dto/map/create-map.dto';
import { UpdateMapDto } from '@app/model/dto/map/update-map.dto';
import { Coordinate, ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    constructor(
        @InjectModel(Map.name) public mapModel: Model<MapDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.mapModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        const maps: CreateMapDto[] = [
            {
                name: 'Test de jeu',
                description: 'un simple jeu', 
                mode: Mode.Ctf, 
                imagePreview: 'url dimage',
                isVisible: false,
                mapSize: { x: 10, y: 10 },
                startTiles: [{ coordinate: { x: 5, y: 1 } }],
                items: [{ coordinate: { x: 1, y: 3 }, category: ItemCategory.Sword }],
                tiles: [{ coordinate: { x: 3, y: 4 }, category: TileCategory.Ice }],
                doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }]

            },
        ];
        await this.mapModel.insertMany(maps);
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
    }
    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find({});
    }
    async getMapByName(mapName: string): Promise<Map> {
        try {
            return await this.mapModel.findOne({ name: mapName });
        } catch (err) {
            return Promise.reject(`Failed to find map : ${err.message}`);
        }
    }
    async addMap(map: CreateMapDto): Promise<void> {
        await this.verifyMap(map);
        try {
            await this.mapModel.create(map);
        } catch (error) {
            return Promise.reject(`Failed to add map`);
        }
    }
    async deleteMap(mapName: string): Promise<void> {
        try {
            const res = await this.mapModel.deleteOne({
                name: mapName,
            });
            if (res.deletedCount === 0) {
                return Promise.reject('Could not find course');
            }
        } catch (err) {
            return Promise.reject(`Failed to delete course: ${err}`);
        }
    }

    // ici on a un problème: on veut que quand on sauvegarde les modif dun jeu supprimé, ca créé un nouveau jeu,
    // mais comment recuperer les data manquante de ce jeu sil est plus sur la db?
    // à revoir ou créer un truc qui fait une sauvegarde qqpart du jeu dès qu'on accède à sa page de modification
    async modifyMap(mapName: string, updateMapDto: UpdateMapDto): Promise<Map> {
        const map = await this.getMapByName(mapName);

        let isVisibilityToggle: boolean = true;

        if (!map) {
            // je pourrais mettre ici la création dun map avec le data quon a dans updateMap et ensuite faire des comparaisons
            // dans les if et au fond ca revient à la meme qu'un createMapdto juste name est optionnel
            throw new NotFoundException('Map not found');
        }

        if (updateMapDto.name) {
            isVisibilityToggle = false;
            if (!(await this.isUnique(updateMapDto.name))) {
                throw new Error('A map with this name already exists');
            }
            map.name = updateMapDto.name;
        }

        if (updateMapDto.description !== undefined) {
            isVisibilityToggle = false;
            map.description = updateMapDto.description;
        }

        if (updateMapDto.mode !== undefined) {
            map.mode = updateMapDto.mode;
        }

        if (updateMapDto.startTiles !== undefined) {
            if (this.isOutOfBounds(updateMapDto.startTiles, map.tiles, map.doorTiles, map.items, map.mapSize)) {
                throw new ForbiddenException('All elements must be inside map');
            }
            map.startTiles = updateMapDto.startTiles;
            isVisibilityToggle = false;
        }

        if (updateMapDto.tiles !== undefined || updateMapDto.doorTiles !== undefined) {
            if (updateMapDto.tiles !== undefined && updateMapDto.doorTiles !== undefined) {
                if (!this.isBelowHalf(updateMapDto.doorTiles, updateMapDto.tiles, map.mapSize)) {
                    throw new ForbiddenException('Map must contain more than 50% of grass tiles');
                }
                if (this.isOutOfBounds(map.startTiles, updateMapDto.tiles, updateMapDto.doorTiles, map.items, map.mapSize)) {
                    throw new ForbiddenException('All elements must be inside map');
                }
                if (!this.areDoorsFree(updateMapDto.doorTiles, updateMapDto.tiles)) {
                    throw new ForbiddenException('All doors must be free');
                }
                if (!this.isAllTilesAccessible(map.startTiles, updateMapDto.tiles, map.mapSize)) {
                    throw new ForbiddenException('Map must not have any isolated ground tile');
                }
                map.doorTiles = updateMapDto.doorTiles;
                map.tiles = updateMapDto.tiles;
            } else if (updateMapDto.tiles !== undefined && updateMapDto.doorTiles === undefined) {
                if (this.isOutOfBounds(map.startTiles, updateMapDto.tiles, map.doorTiles, map.items, map.mapSize)) {
                    throw new ForbiddenException('All elements must be inside map');
                }
                if (!this.isBelowHalf(map.doorTiles, updateMapDto.tiles, map.mapSize)) {
                    throw new ForbiddenException('Map must contain more than 50% of grass tiles');
                }
                if (!this.isAllTilesAccessible(map.startTiles, updateMapDto.tiles, map.mapSize)) {
                    throw new ForbiddenException('Map must not have any isolated ground tile');
                }
                map.tiles = updateMapDto.tiles;
            } else {
                if (this.isOutOfBounds(map.startTiles, map.tiles, updateMapDto.doorTiles, map.items, map.mapSize)) {
                    throw new ForbiddenException('All elements must be inside map');
                }
                if (!this.isBelowHalf(updateMapDto.doorTiles, map.tiles, map.mapSize)) {
                    throw new ForbiddenException('Map must contain more than 50% of grass tiles');
                }
                if (!this.areDoorsFree(updateMapDto.doorTiles, map.tiles)) {
                    throw new ForbiddenException('All doors must be free');
                }
                map.doorTiles = updateMapDto.doorTiles;
            }
        }

        if (updateMapDto.items !== undefined) {
            if (this.isOutOfBounds(map.startTiles, map.tiles, map.doorTiles, updateMapDto.items, map.mapSize)) {
                throw new ForbiddenException('All elements must be inside map');
            }
            map.items = updateMapDto.items;
        }

        if (updateMapDto.isVisible !== undefined && isVisibilityToggle) {
            map.isVisible = updateMapDto.isVisible;
        } else if (!isVisibilityToggle) {
            map.isVisible = false;
        }

        map.lastModified = new Date();
        return await this.mapModel.findByIdAndUpdate(map._id, map, {
            new: true,
            upsert: true,
        });
    }

    // private verifyMapCoordinates(map : CreateMapDto) {
    //     if (this.isOutOfBounds2(map.startTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.wallTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.iceTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.waterTiles, map.mapSize.x) ||
    //         this.isOutOfBounds2(map.doorTiles.map(doorTile => doorTile.coordinate), map.mapSize.x) ||
    //         this.isOutOfBounds(map.attributeItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.attributeItem2, map.mapSize.x) ||
    //         this.isOutOfBounds(map.conditionItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.conditionItem2, map.mapSize.x) ||
    //         this.isOutOfBounds(map.functionItem1, map.mapSize.x) ||
    //         this.isOutOfBounds(map.functionItem2, map.mapSize.x) ) {
    //             return true

    //         }
    //         return false
    // }
    // ----------------------->
    async isUnique(mapName: string): Promise<boolean> {
        if (await this.getMapByName(mapName)) {
            return false;
        }
        return true;
    }

    private isBelowHalf(doors: DoorTileDto[], tiles: TileDto[], mapSize: CoordinateDto): boolean {
        const totalTiles: number = mapSize.x * mapSize.y;
        const occupiedTiles: number = doors.length + tiles.length;
        return occupiedTiles < 0.5 * totalTiles;
    }

    private directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
    ];

    private isAllTilesAccessible(startTiles: StartTileDto[], tiles: TileDto[], mapSize: CoordinateDto): boolean {
        const startTile = startTiles[0].coordinate;
        const visited: CoordinateDto[] = [];

        const mapMatrix: boolean[][] = Array.from({ length: mapSize.y }, () => Array(mapSize.x).fill(true));

        tiles.forEach((tile) => {
            if (tile.category === TileCategory.Wall) {
                mapMatrix[tile.coordinate.y][tile.coordinate.x] = false;
            }
        });
        this.dfs(startTile, mapMatrix, visited, mapSize);

        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                if (mapMatrix[y][x] && !this.isVisited({ x, y }, visited)) {
                    return false;
                }
            }
        }
        return true;
    }

    dfs(coordinate: CoordinateDto, mapMatrix: boolean[][], visited: CoordinateDto[], mapSize: CoordinateDto): void {
        visited.push(coordinate);

        for (const direction of this.directions) {
            const newX = coordinate.x + direction.x;
            const newY = coordinate.y + direction.y;

            // Vérifier si la nouvelle position est dans les limites de la carte
            if (newX >= 0 && newX < mapSize.x && newY >= 0 && newY < mapSize.y) {
                if (mapMatrix[newY][newX] && !this.isVisited({ x: newX, y: newY }, visited)) {
                    this.dfs({ x: newX, y: newY }, mapMatrix, visited, mapSize);
                }
            }
        }
    }
    isVisited(coordinate: Coordinate, coordinates: Coordinate[]): boolean {
        return coordinates.some((tile) => tile.x === coordinate.x && tile.y === coordinate.y);
    }

    isCoordinateOutOfBounds(coordinate: Coordinate, mapSize: Coordinate): boolean {
        return coordinate.x >= mapSize.x || coordinate.y >= mapSize.y || coordinate.x < 0 || coordinate.y < 0;
    }

    isOutOfBounds(startTiles: StartTileDto[], tiles: TileDto[], doors: DoorTileDto[], items: ItemDto[], mapSize: CoordinateDto): boolean {
        const tileOutOfBounds = tiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const startTileOutOfBounds = startTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const doorTileOutOfBounds = doors.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const itemOutOfBounds = items.some((item) => this.isCoordinateOutOfBounds(item.coordinate, mapSize));

        return tileOutOfBounds || startTileOutOfBounds || doorTileOutOfBounds || itemOutOfBounds;
    }

    areDoorsFree(doors: DoorTileDto[], tiles: TileDto[]): boolean {
        const walls = tiles.filter((tile) => tile.category === TileCategory.Wall);
        for (const door of doors) {
            const hasWallsHorizontally =
                walls.some((tile) => tile.coordinate.x === door.coordinate.x + 1 && tile.coordinate.y === door.coordinate.y) &&
                walls.some((tile) => tile.coordinate.x === door.coordinate.x - 1 && tile.coordinate.y === door.coordinate.y);

            const hasWallsVertically =
                walls.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y + 1) &&
                walls.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y - 1);

            const isBlockedHorizontally =
                tiles.some((tile) => tile.coordinate.x === door.coordinate.x + 1 && tile.coordinate.y === door.coordinate.y) ||
                tiles.some((tile) => tile.coordinate.x === door.coordinate.x - 1 && tile.coordinate.y === door.coordinate.y);

            const isBlockedVertically =
                tiles.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y + 1) ||
                tiles.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y - 1);

            const isValidDoor = (hasWallsHorizontally && !isBlockedVertically) || (hasWallsVertically && !isBlockedHorizontally);

            if (!isValidDoor) {
                return false;
            }
        }

        return true; // Si toutes les portes sont valides
    }

    areStartTilePlaced(startTiles: StartTileDto[], mapSize: CoordinateDto): boolean {
        if (mapSize.x === 10 && startTiles.length === 2) {
            return true;
        } else if (mapSize.x === 15 && startTiles.length === 4) {
            return true;
        } else if (mapSize.x === 20 && startTiles.length === 6) {
            return true;
        }
        return false;
    }

    async verifyMap(mapDto: CreateMapDto): Promise<void> {
        if (!(await this.isUnique(mapDto.name))) {
            throw new Error('A map with this name already exists');
        } else if (this.isOutOfBounds(mapDto.startTiles, mapDto.tiles, mapDto.doorTiles, mapDto.items, mapDto.mapSize)) {
            throw new ForbiddenException('All elements must be inside map');
        } else if (!this.isBelowHalf(mapDto.doorTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('Map must contain more than 50% of grass tiles');
        } else if (!this.isAllTilesAccessible(mapDto.startTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('Map must not have any isolated ground tile');
        } else if (!this.areDoorsFree(mapDto.doorTiles, mapDto.tiles)) {
            throw new ForbiddenException('All doors must be free');
        } else if (!this.areStartTilePlaced(mapDto.startTiles, mapDto.mapSize)) {
            throw new ForbiddenException('All start tiles must be placed');
        }
    }
}
