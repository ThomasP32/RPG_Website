import { Coordinate } from "./map.types";

export interface Direction {
    x: number;
    y: number;
}
export const DIRECTIONS: Direction[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 }, 
    { x: -1, y: 0 }, 
    { x: 1, y: 0 },
];

export type MovesMap = Map<
    string,
    {
        path: Coordinate[];
        weight: number;
    }
>;
