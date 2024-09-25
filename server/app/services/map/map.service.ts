import { MapDocument } from '@app/model/database/map';
import { CreateMapDto } from '@app/model/dto/map/create-map.dto';
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
                doorTiles: [{ coordinate: { x: 1, y: 2 }, isOpened: true }],
            },
        ];
        await this.mapModel.insertMany(maps);
        this.logger.log('THIS ADDS DATA TO THE DATABASE, DO NOT USE OTHERWISE');
    }

    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find({});
    }

    // async getMapById(mapId: string): Promise<Map> {
    //     try {
    //         const objectId = new Types.ObjectId(mapId);
    //         return await this.mapModel.findOne({ _id: objectId });
    //     } catch (err) {
    //         return Promise.reject(`Failed to find map: ${err}`);
    //     }
    // }

    async getMapByName(mapName: string): Promise<Map> {
        try {
            const map = await this.mapModel.findOne({ name: mapName });
            if (!map) {
                throw new NotFoundException(`DB contains no map named ${mapName}`);
            }
            return map;
        } catch (err) {
            return Promise.reject(`Failed to find map: ${err}`);
        }
    }

    async addMap(mapDto: CreateMapDto): Promise<void> {
        await this.verifyMap(mapDto);
        try {
            await this.mapModel.create(mapDto);
        } catch(error) {
            return Promise.reject(`Failed to add map`);
        }
    }

    async deleteMap(mapName: string): Promise<void> {
        try {
            const res = await this.mapModel.deleteOne({
                name: mapName,
            });
            if (res.deletedCount === 0) {
                throw new Error('Could not find map to delete');
            }
        } catch (err) {
            return Promise.reject(`Failed to delete map: ${err}`);
        }
    }

    async toggleVisibility(mapName: string): Promise<void> {
        try {
            const map = await this.getMapByName(mapName);
            if (!map) {
                return Promise.reject('Map not found');
            }
            await this.mapModel.findByIdAndUpdate(
                map._id,
                { isVisible: !map.isVisible }, // Mise à jour de la visibilité
                { new: true }, // Option pour retourner le document mis à jour
            );
        } catch (err) {
            return Promise.reject(`Failed to toggle visibility: ${err}`);
        }
    }

    async isUnique(mapName: string): Promise<boolean> {
        if (await this.mapModel.findOne({ name: mapName })) {
            return false;
        }
        return true;
    }

    private isBelowHalf(mapDto: CreateMapDto): boolean {
        const totalTiles: number = mapDto.mapSize.x * mapDto.mapSize.y;
        const occupiedTiles: number = mapDto.doorTiles.length + mapDto.tiles.length;
        return occupiedTiles < 0.5 * totalTiles;
    }

    private directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
    ];

    private isAllTilesAccessible(mapDto: CreateMapDto): boolean {
        const startTile = mapDto.startTiles[0].coordinate;
        const visited: Coordinate[] = [];
        const mapSize = mapDto.mapSize;
        const tiles = mapDto.tiles;

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

    dfs(coordinate: Coordinate, mapMatrix: boolean[][], visited: Coordinate[], mapSize: Coordinate): void {
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

    isOutOfBounds(mapDto: CreateMapDto): boolean {
        const tileOutOfBounds = mapDto.tiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapDto.mapSize));
        const startTileOutOfBounds = mapDto.startTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapDto.mapSize));
        const doorTileOutOfBounds = mapDto.doorTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapDto.mapSize));
        const itemOutOfBounds = mapDto.items.some((item) => this.isCoordinateOutOfBounds(item.coordinate, mapDto.mapSize));

        return tileOutOfBounds || startTileOutOfBounds || doorTileOutOfBounds || itemOutOfBounds;
    }

    areDoorsFree(mapDto: CreateMapDto): boolean {
        const walls = mapDto.tiles.filter((tile) => tile.category === TileCategory.Wall);
        for (const door of mapDto.doorTiles) {
            const hasWallsHorizontally =
                walls.some((tile) => tile.coordinate.x === door.coordinate.x + 1 && tile.coordinate.y === door.coordinate.y) &&
                walls.some((tile) => tile.coordinate.x === door.coordinate.x - 1 && tile.coordinate.y === door.coordinate.y);

            const hasWallsVertically =
                walls.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y + 1) &&
                walls.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y - 1);

            const isBlockedHorizontally =
                mapDto.tiles.some((tile) => tile.coordinate.x === door.coordinate.x + 1 && tile.coordinate.y === door.coordinate.y) ||
                mapDto.tiles.some((tile) => tile.coordinate.x === door.coordinate.x - 1 && tile.coordinate.y === door.coordinate.y);

            const isBlockedVertically =
                mapDto.tiles.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y + 1) ||
                mapDto.tiles.some((tile) => tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y - 1);

            const isValidDoor = (hasWallsHorizontally && !isBlockedVertically) || (hasWallsVertically && !isBlockedHorizontally);

            if (!isValidDoor) {
                return false;
            }
        }

        return true; // Si toutes les portes sont valides
    }

    areStartTilePlaced(mapDto: CreateMapDto): boolean {
        if (mapDto.mapSize.x === 10 && mapDto.startTiles.length === 2) {
            return true;
        } else if (mapDto.mapSize.x === 15 && mapDto.startTiles.length === 4) {
            return true;
        } else if (mapDto.mapSize.x === 20 && mapDto.startTiles.length === 6) {
            return true;
        }
        return false;
    }

    async verifyMap(mapDto: CreateMapDto): Promise<void> {
        if (!(await this.isUnique(mapDto.name))) {
            throw new Error('A map with this name already exists');
        } else if (this.isOutOfBounds(mapDto)) {
            throw new ForbiddenException('All elements must be inside map');
        } else if (!this.isBelowHalf(mapDto)) {
            throw new ForbiddenException('Map must contain more than 50% of grass tiles');
        } else if (!this.isAllTilesAccessible(mapDto)) {
            throw new ForbiddenException('Map must not have any isolated ground tile');
        } else if (!this.areDoorsFree(mapDto)) {
            throw new ForbiddenException('All doors must be free');
        } else if (!this.areStartTilePlaced(mapDto)) {
            throw new ForbiddenException('All start tiles must be placed');
        }
    }
}
