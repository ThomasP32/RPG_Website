export interface Game {
    name: string;
    mapSize: number; // 10, 15, ou 20
    gameMode: string; // classique ou ctf
    //mapPreview: string; // matrice sauvegardé dans BD
    lastModified: string;
}
