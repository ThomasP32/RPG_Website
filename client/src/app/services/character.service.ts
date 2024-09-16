import { Injectable } from '@angular/core';
import { Character } from '@app/interfaces/character';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    constructor() {}

    private characters = [
        { id: 1, name: 'Character 1', image: 'https://www.pngplay.com/wp-content/uploads/6/Final-Fantasy-Game-Character-Transparent-Background.png' },
        { id: 2, name: 'Character 2', image: 'https://www.pngplay.com/wp-content/uploads/6/Final-Fantasy-Game-Character-Background-PNG-Image.png' },
        { id: 3, name: 'Character 3', image: 'https://freepngimg.com/save/13973-final-fantasy-png-picture/348x588' },
        {
            id: 4,
            name: 'Character 4',
            image: 'https://static.wikia.nocookie.net/finalfantasy/images/a/a7/Ffxiii_2_serah_cg_render.png/revision/latest?cb=20110903174424',
        },
        { id: 5, name: 'Character 5', image: 'https://i.pinimg.com/originals/2b/b3/6b/2bb36b1a8a8fcdb915c114844a504ad0.png' },
        { id: 6, name: 'Character 6', image: 'https://www.pngplay.com/wp-content/uploads/6/Final-Fantasy-Game-Transparent-Background.png' },
        {
            id: 7,
            name: 'Character 7',
            image: 'https://static.wikia.nocookie.net/finalfantasy/images/d/d3/WoLDissidiaModel.PNG/revision/latest?cb=20110706100935',
        },
        { id: 8, name: 'Character 8', image: 'https://www.nicepng.com/png/detail/42-420500_-img-dissidia-final-fantasy-nt-characters.png' },
        { id: 9, name: 'Character 9', image: 'https://wallpapers.com/images/hd/sephiroth-final-fantasy-v-i-i-character-ctd7gpq1p3ie6l3b.jpg' },
        { id: 10, name: 'Character 10', image: 'https://www.pngall.com/wp-content/uploads/4/Final-Fantasy-VII-Remake-PNG-High-Quality-Image.png' },
        {
            id: 11,
            name: 'Character 11',
            image: 'https://e7.pngegg.com/pngimages/882/41/png-clipart-bard-dark-elf-graphy-forsaken-world-war-of-shadows-elf-game-cg-artwork-thumbnail.png',
        },
        { id: 12, name: 'Character 12', image: 'https://s-media-cache-ak0.pinimg.com/originals/fe/ee/96/feee9648005bc28befb3b8dbd2bb29d6.png' },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }
}
