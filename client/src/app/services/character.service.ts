import { Injectable } from '@angular/core';
import { Character } from '@app/interfaces/character';
import { Observable, of } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    private characters = [
        {
            id: 1,
            name: 'Alistair Clockhaven',
            image: '../../assets/characters/1.png',
            preview: '../../assets/previewcharacters/1.png',
        },
        {
            id: 2,
            name: 'Arachnoform',
            image: '../../assets/characters/2.png',
            preview: '../../assets/previewcharacters/2.png',
        },
        {
            id: 3,
            name: 'Archibald Light',
            image: '../../assets/characters/3.png',
            preview: '../../assets/previewcharacters/3.png',
        },
        {
            id: 4,
            name: 'Archpriest Mechanohr',
            image: '../../assets/characters/4.png',
            preview: '../../assets/previewcharacters/4.png',
        },
        {
            id: 5,
            name: 'Cyron Vex',
            image: '../../assets/characters/5.png',
            preview: '../../assets/previewcharacters/5.png',
        },
        {
            id: 6,
            name: 'Magnus Brassguard',
            image: '../../assets/characters/6.png',
            preview: '../../assets/previewcharacters/6.png',
        },
        {
            id: 7,
            name: 'Professor Quicksprocket',
            image: '../../assets/characters/7.png',
            preview: '../../assets/previewcharacters/7.png',
        },
        {
            id: 8,
            name: 'Reginald Gearwhisle',
            image: '../../assets/characters/8.png',
            preview: '../../assets/previewcharacters/8.png',
        },
        {
            id: 9,
            name: 'Vance Steelstrike',
            image: '../../assets/characters/9.png',
            preview: '../../assets/previewcharacters/9.png',
        },
        {
            id: 10,
            name: 'Zephyr Gearwind',
            image: '../../assets/characters/10.png',
            preview: '../../assets/previewcharacters/10.png',
        },
        {
            id: 11,
            name: 'Dr. Veselius',
            image: '../../assets/characters/11.png',
            preview: '../../assets/previewcharacters/11.png',
        },
        {
            id: 12,
            name: 'Grimmauld Ironfist',
            image: '../../assets/characters/12.png',
            preview: '../../assets/previewcharacters/12.png',
        },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }
}
