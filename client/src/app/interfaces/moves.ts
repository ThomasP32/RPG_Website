import { Coordinate } from "@common/map.types";

export type MovesMap = Map<
    string,
    {
        path: Coordinate[];
        weight: number;
    }
>;