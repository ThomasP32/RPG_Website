import Ajv from 'ajv';

const ajv = new Ajv();

const coordinateSchema = {
    type: 'object',
    properties: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
    required: ['x', 'y'],
    additionalProperties: false,
};
const tileSchema = {
    type: 'object',
    properties: {
        coordinate: { $ref: '#/definitions/coordinate' },
        category: { type: 'string', enum: ['water', 'ice', 'wall', 'floor', 'door'] },
    },
    required: ['coordinate', 'category'],
    additionalProperties: false,
};
const doorTileSchema = {
    type: 'object',
    properties: {
        coordinate: { $ref: '#/definitions/coordinate' },
        isOpened: { type: 'boolean' },
    },
    required: ['coordinate', 'isOpened'],
    additionalProperties: false,
};
const startTileSchema = {
    type: 'object',
    properties: {
        coordinate: { $ref: '#/definitions/coordinate' },
    },
    required: ['coordinate'],
    additionalProperties: false,
};
const itemSchema = {
    type: 'object',
    properties: {
        coordinate: { $ref: '#/definitions/coordinate' },
        category: {
            type: 'string',
            enum: ['hat', 'jar', 'key', 'mask', 'random', 'vest', 'acidgun', 'flag'],
        },
    },
    required: ['coordinate', 'category'],
    additionalProperties: false,
};
const mapSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        imagePreview: { type: 'string' },
        mode: { type: 'string', enum: ['ctf', 'classique'] },
        mapSize: { $ref: '#/definitions/coordinate' },
        startTiles: {
            type: 'array',
            items: { $ref: '#/definitions/startTile' },
        },
        items: {
            type: 'array',
            items: { $ref: '#/definitions/item' },
        },
        doorTiles: {
            type: 'array',
            items: { $ref: '#/definitions/doorTile' },
        },
        tiles: {
            type: 'array',
            items: { $ref: '#/definitions/tile' },
        },
    },
    required: ['name', 'description', 'imagePreview', 'mode', 'mapSize', 'startTiles', 'items', 'doorTiles', 'tiles'],
    additionalProperties: false,
    definitions: {
        coordinate: coordinateSchema,
        tile: tileSchema,
        doorTile: doorTileSchema,
        startTile: startTileSchema,
        item: itemSchema,
    },
};
export const validate = ajv.compile(mapSchema);