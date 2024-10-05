import { CoordinateDto, StartTileDto } from '@app/model/dto/map/coordinate.dto';
import { DoorTileDto } from '@app/model/dto/map/door.dto';
import { MapDto } from '@app/model/dto/map/map.dto';
import { ItemDto, TileDto } from '@app/model/dto/map/tiles.dto';
import { MapDocument } from '@app/model/schemas/map.schema';
import { Coordinate, DBMap, Map, TileCategory } from '@common/map.types';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

const HALF = 0.5;
const SMALL_MAP_SIZE = 10;
const MEDIUM_MAP_SIZE = 15;
const LARGE_MAP_SIZE = 20;
const SMALL_MAP_START_TILES = 2;
const MEDIUM_MAP_START_TILES = 4;
const LARGE_MAP_START_TILES = 6;

@Injectable()
export class AdminService {
    private directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
    ];

    constructor(@InjectModel(Map.name) public mapModel: Model<MapDocument>) {}

    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find({});
    }

    async getMapById(mapId: string): Promise<DBMap> {
        const objectId = new Types.ObjectId(mapId);
        const map = await this.mapModel.findOne({ _id: objectId });
        if (!map) {
            throw new NotFoundException(mapId);
        }
        return map;
    }

    async verifyMap(mapDto: MapDto): Promise<void> {
        if (!(await this.isUnique(mapDto.name))) {
            throw new ConflictException('Un jeu avec ce nom existe déjà');
        } else if (this.isOutOfBounds(mapDto.startTiles, mapDto.tiles, mapDto.doorTiles, mapDto.items, mapDto.mapSize)) {
            throw new ForbiddenException("Tous les éléments doivent être à l'intérieur de la carte");
        } else if (!this.isBelowHalf(mapDto.doorTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('La surface de jeu doit contenir plus de 50% de tuiles de terrain');
        } else if (!this.isAllTilesAccessible(mapDto.startTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('Le jeu ne doit pas avoir de tuile de terrain isolée');
        } else if (!this.areDoorsFree(mapDto.doorTiles, mapDto.tiles)) {
            throw new ForbiddenException('Toutes les portes doivent être libérées');
        } else if (!this.areStartTilePlaced(mapDto.startTiles, mapDto.mapSize)) {
            throw new ForbiddenException(
                'Les tuiles de départ doivent toutes être placées (2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte)',
            );
        }
    }

    async addMap(map: MapDto): Promise<void> {
        await this.verifyMap(map);
        try {
            await this.mapModel.create(map);
        } catch (error) {
            throw new Error('La création du jeu a échoué');
        }
    }

    async deleteMap(mapId: string): Promise<void> {
        try {
            const objectId = new Types.ObjectId(mapId);
            const res = await this.mapModel.deleteOne({
                _id: objectId,
            });
            if (res.deletedCount === 0) {
                throw new NotFoundException("Le jeu n'a pas été trouvé");
            }
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new BadRequestException('La suppression du jeu a échoué');
        }
    }

    async modifyMap(mapId: string, updateMapDto: MapDto): Promise<DBMap> {
        await this.verifyMapModification(mapId, updateMapDto);
        try {
            this.verifyMapModification(mapId, updateMapDto);
            const existingMap = await this.mapModel.findById(mapId);

            if (existingMap) {
                existingMap.set({ ...updateMapDto });
                existingMap.isVisible = false;
                existingMap.lastModified = new Date();
                return await existingMap.save();
            } else {
                const newMap = new this.mapModel({
                    ...updateMapDto,
                    _id: new Types.ObjectId(),
                    isVisible: false,
                    lastModified: new Date(),
                });
                return await newMap.save();
            }
        } catch (error) {
            throw new Error("Le jeu n'a pas pu être modifié");
        }
    }

    async verifyMapModification(mapId: string, mapDto: MapDto): Promise<void> {
        const idObject = new Types.ObjectId(mapId);
        const existingMap = await this.mapModel.findOne({
            name: mapDto.name,
            _id: { $ne: idObject },
        });
        if (existingMap) {
            throw new ConflictException('Un jeu avec ce nom existe déjà');
        } else if (this.isOutOfBounds(mapDto.startTiles, mapDto.tiles, mapDto.doorTiles, mapDto.items, mapDto.mapSize)) {
            throw new ForbiddenException("Tous les éléments doivent être à l'intérieur de la carte");
        } else if (!this.isBelowHalf(mapDto.doorTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('La surface de jeu doit contenir plus de 50% de tuiles de terrain');
        } else if (!this.isAllTilesAccessible(mapDto.startTiles, mapDto.tiles, mapDto.mapSize)) {
            throw new ForbiddenException('Le jeu ne doit pas avoir de tuile de terrain isolée');
        } else if (!this.areDoorsFree(mapDto.doorTiles, mapDto.tiles)) {
            throw new ForbiddenException('Toutes les portes doivent être libérées');
        } else if (!this.areStartTilePlaced(mapDto.startTiles, mapDto.mapSize)) {
            throw new ForbiddenException(
                'Les tuiles de départ doivent toutes être placées (2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte)',
            );
        }
    }

    async visibilityToggle(mapId: string) {
        const map = await this.getMapById(mapId);
        return await this.mapModel.findByIdAndUpdate(
            map._id,
            { isVisible: !map.isVisible },
            {
                new: true,
            },
        );
    }

    private async isUnique(mapName: string): Promise<boolean> {
        return !(await this.mapModel.findOne({ name: mapName }));
    }

    private isBelowHalf(doors: DoorTileDto[], tiles: TileDto[], mapSize: CoordinateDto): boolean {
        const totalTiles: number = mapSize.x * mapSize.y;
        const wallTiles = tiles.filter((tile) => tile.category === TileCategory.Wall);
        const occupiedTiles: number = doors.length + wallTiles.length;
        return occupiedTiles < HALF * totalTiles;
    }

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

    private dfs(coordinate: CoordinateDto, mapMatrix: boolean[][], visited: CoordinateDto[], mapSize: CoordinateDto): void {
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
    private isVisited(coordinate: Coordinate, coordinates: Coordinate[]): boolean {
        return coordinates.some((tile) => tile.x === coordinate.x && tile.y === coordinate.y);
    }

    private isCoordinateOutOfBounds(coordinate: Coordinate, mapSize: Coordinate): boolean {
        return coordinate.x >= mapSize.x || coordinate.y >= mapSize.y || coordinate.x < 0 || coordinate.y < 0;
    }

    private isOutOfBounds(startTiles: StartTileDto[], tiles: TileDto[], doors: DoorTileDto[], items: ItemDto[], mapSize: CoordinateDto): boolean {
        const tileOutOfBounds = tiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const startTileOutOfBounds = startTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const doorTileOutOfBounds = doors.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, mapSize));
        const itemOutOfBounds = items.some((item) => this.isCoordinateOutOfBounds(item.coordinate, mapSize));

        return tileOutOfBounds || startTileOutOfBounds || doorTileOutOfBounds || itemOutOfBounds;
    }

    private areDoorsFree(doors: DoorTileDto[], tiles: TileDto[]): boolean {
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

    private areStartTilePlaced(startTiles: StartTileDto[], mapSize: CoordinateDto): boolean {
        if (mapSize.x === SMALL_MAP_SIZE && startTiles.length === SMALL_MAP_START_TILES) {
            return true;
        } else if (mapSize.x === MEDIUM_MAP_SIZE && startTiles.length === MEDIUM_MAP_START_TILES) {
            return true;
        } else if (mapSize.x === LARGE_MAP_SIZE && startTiles.length === LARGE_MAP_START_TILES) {
            return true;
        }
        return false;
    }
}
