import { CoordinateDto, StartTileDto } from '@app/http/model/dto/map/coordinate.dto';
import { DoorTileDto } from '@app/http/model/dto/map/door.dto';
import { MapDto } from '@app/http/model/dto/map/map.dto';
import { ItemDto, TileDto } from '@app/http/model/dto/map/tiles.dto';
import { MapDocument } from '@app/http/model/schemas/map/map.schema';
import { HALF, MapConfig, MapSize } from '@common/constants';
import { DIRECTIONS } from '@common/directions';
import { Coordinate, DetailedMap, ItemCategory, Map, Mode, TileCategory } from '@common/map.types';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class AdminService {
    @InjectModel(Map.name) public mapModel: Model<MapDocument>;

    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find({});
    }

    async getMapById(mapId: string): Promise<DetailedMap> {
        const objectId = new Types.ObjectId(mapId);
        const map = await this.mapModel.findOne({ _id: objectId }, { __v: 0 });
        if (!map) {
            throw new NotFoundException(mapId);
        }
        return map;
    }

    async verifyMap(mapDto: MapDto): Promise<void> {
        if (!(await this.isUnique(mapDto.name))) {
            throw new ConflictException('Un jeu avec ce nom existe déjà');
        } else if (this.isOutOfBounds(mapDto)) {
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
        } else if (!this.areItemsPlaced(mapDto.items, mapDto.mapSize)) {
            throw new ForbiddenException(
                'Des items sont manquants (au moins 2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte',
            );
        } else if (!this.isFlagPlaced(mapDto.items, mapDto.mode)) {
            throw new ForbiddenException('Le drapeau doit être placé pour un jeu en mode CTF.');
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
            const response = await this.mapModel.deleteOne({
                _id: objectId,
            });
            if (response.deletedCount === 0) {
                throw new NotFoundException("Le jeu n'a pas été trouvé");
            }
        } catch (err) {
            if (err instanceof NotFoundException) {
                throw err;
            }
            throw new BadRequestException('La suppression du jeu a échoué');
        }
    }

    async modifyMap(mapId: string, updateMapDto: MapDto): Promise<DetailedMap> {
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
        } else if (this.isOutOfBounds(mapDto)) {
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
        } else if (!this.areItemsPlaced(mapDto.items, mapDto.mapSize)) {
            throw new ForbiddenException(
                'Des items sont manquants (au moins 2 pour une petite carte, 4 pour une moyenne carte et 6 pour une grande carte)',
            );
        } else if (!this.isFlagPlaced(mapDto.items, mapDto.mode)) {
            throw new ForbiddenException('Le drapeau doit être placé pour un jeu en mode CTF.');
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

        for (const direction of DIRECTIONS) {
            const newX = coordinate.x + direction.x;
            const newY = coordinate.y + direction.y;

            if (!this.isCoordinateOutOfBounds({ x: newX, y: newY }, mapSize)) {
                if (mapMatrix[newY][newX] && !this.isVisited({ x: newX, y: newY }, visited)) {
                    this.dfs({ x: newX, y: newY }, mapMatrix, visited, mapSize);
                }
            }
        }
    }
    private isVisited(coordinate: Coordinate, coordinates: Coordinate[]): boolean {
        return coordinates.some((tile) => tile.x === coordinate.x && tile.y === coordinate.y);
    }

    private isCoordinateOutOfBounds(coordinate: Coordinate | CoordinateDto, mapSize: Coordinate | CoordinateDto): boolean {
        return coordinate.x >= mapSize.x || coordinate.y >= mapSize.y || coordinate.x < 0 || coordinate.y < 0;
    }

    private isOutOfBounds(map: MapDto): boolean {
        const tileOutOfBounds = map.tiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, map.mapSize));
        const startTileOutOfBounds = map.startTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, map.mapSize));
        const doorTileOutOfBounds = map.doorTiles.some((tile) => this.isCoordinateOutOfBounds(tile.coordinate, map.mapSize));
        const itemOutOfBounds = map.items.some((item) => this.isCoordinateOutOfBounds(item.coordinate, map.mapSize));

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
                tiles.some(
                    (tile) =>
                        tile.coordinate.x === door.coordinate.x + 1 && tile.coordinate.y === door.coordinate.y && tile.category === TileCategory.Wall,
                ) ||
                tiles.some(
                    (tile) =>
                        tile.coordinate.x === door.coordinate.x - 1 && tile.coordinate.y === door.coordinate.y && tile.category === TileCategory.Wall,
                ) ||
                doors.some((otherDoor) => otherDoor.coordinate.x === door.coordinate.x + 1 && otherDoor.coordinate.y === door.coordinate.y) ||
                doors.some((otherDoor) => otherDoor.coordinate.x === door.coordinate.x - 1 && otherDoor.coordinate.y === door.coordinate.y);

            const isBlockedVertically =
                tiles.some(
                    (tile) =>
                        tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y + 1 && tile.category === TileCategory.Wall,
                ) ||
                tiles.some(
                    (tile) =>
                        tile.coordinate.x === door.coordinate.x && tile.coordinate.y === door.coordinate.y - 1 && tile.category === TileCategory.Wall,
                ) ||
                doors.some((otherDoor) => otherDoor.coordinate.x === door.coordinate.x && otherDoor.coordinate.y === door.coordinate.y + 1) ||
                doors.some((otherDoor) => otherDoor.coordinate.x === door.coordinate.x && otherDoor.coordinate.y === door.coordinate.y - 1);

            const isValidDoor = (hasWallsHorizontally && !isBlockedVertically) || (hasWallsVertically && !isBlockedHorizontally);

            if (!isValidDoor) {
                return false;
            }
        }

        return true;
    }

    private areStartTilePlaced(startTiles: StartTileDto[], mapSize: CoordinateDto): boolean {
        const isSmallMapTilesPlaced = mapSize.x === MapConfig[MapSize.SMALL].size && startTiles.length === MapConfig[MapSize.SMALL].nbItems;
        const isMediumMapTilesPlaced = mapSize.x === MapConfig[MapSize.MEDIUM].size && startTiles.length === MapConfig[MapSize.MEDIUM].nbItems;
        const isLargeMapTilesPlaced = mapSize.x === MapConfig[MapSize.LARGE].size && startTiles.length === MapConfig[MapSize.LARGE].nbItems;
        return isSmallMapTilesPlaced || isMediumMapTilesPlaced || isLargeMapTilesPlaced;
    }

    private areItemsPlaced(items: ItemDto[], mapSize: CoordinateDto): boolean {
        const isSmallMapTilesPlaced = mapSize.x === MapConfig[MapSize.SMALL].size && items.length === MapConfig[MapSize.SMALL].nbItems;
        const isMediumMapTilesPlaced = mapSize.x === MapConfig[MapSize.MEDIUM].size && items.length === MapConfig[MapSize.MEDIUM].nbItems;
        const isLargeMapTilesPlaced = mapSize.x === MapConfig[MapSize.LARGE].size && items.length === MapConfig[MapSize.LARGE].nbItems;
        return isSmallMapTilesPlaced || isMediumMapTilesPlaced || isLargeMapTilesPlaced;
    }

    private isFlagPlaced(items: ItemDto[], mode: Mode): boolean {
        if (mode === Mode.Ctf) {
            return items.some((item) => item.category === ItemCategory.Flag);
        } else {
            return true;
        }
    }
}
