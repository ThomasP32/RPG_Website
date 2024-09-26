export interface Character {
    id: number;
    name: string;
    image: string;
    preview: string;
    stats: {
        hp: number;
        speed: number;
        attack: number;
        defense: number;
    };
}
