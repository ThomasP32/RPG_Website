import { CoordinateDto, CreateMapDto, DoorTileDto, ItemDto, StartTileDto, TileDto } from '@app/model/dto/map/create-map.dto';
import { UpdateMapDto } from '@app/model/dto/map/update-map.dto';
import { MapDocument } from '@app/model/schemas/map';
import { Coordinate, Map, TileCategory } from '@common/map.types';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

    async getMapById(mapId: string): Promise<Map> {
        try {
            const objectId = new Types.ObjectId(mapId);
            const map = await this.mapModel.findOne({ _id: objectId });
            if (!map) {
                throw new NotFoundException(mapId);
            }
            return map;
        } catch (err) {
            throw new Error(`Failed to find map with id ${err.message}`);
        }
    }

    async verifyMap(mapDto: CreateMapDto): Promise<void> {
        if (!(await this.isUnique(mapDto.name))) {
            throw new ConflictException('A map with this name already exists');
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

    async addMap(map: CreateMapDto): Promise<void> {
        await this.verifyMap(map);
        try {
            await this.mapModel.create(map);
        } catch (error) {
            throw new Error('Failed to add map');
        }
    }

    async deleteMap(mapId: string): Promise<void> {
        try {
            const objectId = new Types.ObjectId(mapId);
            const res = await this.mapModel.deleteOne({
                _id: objectId,
            });
            if (res.deletedCount === 0) {
                throw new NotFoundException('Could not find map to delete');
            }
        } catch (err) {
            if (err.message !== 'Could not find map to delete') {
                throw new BadRequestException('Failed to delete map');
            }
        }
    }

    // ici on a un problème: on veut que quand on sauvegarde les modif dun jeu supprimé, ca créé un nouveau jeu,
    // mais comment recuperer les data manquante de ce jeu sil est plus sur la db?
    // à revoir ou créer un truc qui fait une sauvegarde qqpart du jeu dès qu'on accède à sa page de modification
    async modifyMap(mapId: string, updateMapDto: UpdateMapDto): Promise<Map> {
        const map = await this.getMapById(mapId);

        if (!map) {
            throw new NotFoundException('Map not found');
        }

        if (updateMapDto.name && !(await this.isUnique(updateMapDto.name))) {
            throw new Error('A map with this name already exists');
        }

        // Mise à jour des propriétés basiques
        map.name = updateMapDto.name ?? map.name;
        map.description = updateMapDto.description ?? map.description;
        map.mode = updateMapDto.mode ?? map.mode;

        // Validation et mise à jour des éléments de la carte
        const { startTiles, tiles, doorTiles, items } = updateMapDto;
        const newTiles = tiles ?? map.tiles;
        const newDoorTiles = doorTiles ?? map.doorTiles;

        if (startTiles || tiles || doorTiles) {
            if (this.isOutOfBounds(startTiles ?? map.startTiles, newTiles, newDoorTiles, items ?? map.items, map.mapSize)) {
                throw new ForbiddenException('All elements must be inside map');
            }

            if (!this.isBelowHalf(newDoorTiles, newTiles, map.mapSize)) {
                throw new ForbiddenException('Map must contain more than 50% of grass tiles');
            }

            if (!this.isAllTilesAccessible(startTiles ?? map.startTiles, newTiles, map.mapSize)) {
                throw new ForbiddenException('Map must not have any isolated ground tile');
            }

            if (!this.areDoorsFree(newDoorTiles, newTiles)) {
                throw new ForbiddenException('All doors must be free');
            }

            map.startTiles = startTiles ?? map.startTiles;
            map.tiles = newTiles;
            map.doorTiles = newDoorTiles;
        }

        // Mise à jour des items
        if (items && this.isOutOfBounds(map.startTiles, map.tiles, map.doorTiles, items, map.mapSize)) {
            throw new ForbiddenException('All elements must be inside map');
        }

        map.items = items ?? map.items;
        map.isVisible = false;
        map.lastModified = new Date();

        return await this.mapModel.findByIdAndUpdate(map._id, map, { new: true, upsert: true });
    }

    public async visibilityToggle(mapId: string) {
        const map = await this.getMapById(mapId);
        return await this.mapModel.findByIdAndUpdate(
            map._id,
            { isVisible: !map.isVisible },
            {
                new: true,
                upsert: true,
            },
        );
    }

    private async isUnique(mapName: string): Promise<boolean> {
        return !(await this.mapModel.findOne({ name: mapName }));
    }

    private isBelowHalf(doors: DoorTileDto[], tiles: TileDto[], mapSize: CoordinateDto): boolean {
        const totalTiles: number = mapSize.x * mapSize.y;
        const occupiedTiles: number = doors.length + tiles.length;
        return occupiedTiles < 0.5 * totalTiles;
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
        if (mapSize.x === 10 && startTiles.length === 2) {
            return true;
        } else if (mapSize.x === 15 && startTiles.length === 4) {
            return true;
        } else if (mapSize.x === 20 && startTiles.length === 6) {
            return true;
        }
        return false;
    }
}
