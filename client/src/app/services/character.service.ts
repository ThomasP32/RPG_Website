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
            // eslint-disable-next-line max-len
            image: '../../assets/characters/1.png',
            preview: '../../assets/previewcharacters/1.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 2,
            name: 'Arachnoform',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/2.png',
            preview: '../../assets/previewcharacters/2.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 3,
            name: 'Archibald Light',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/3.png',
            preview: '../../assets/previewcharacters/3.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 4,
            name: 'Archpriest Mechanohr',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/4.png',
            preview: '../../assets/previewcharacters/4.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 5,
            name: 'Cyron Vex',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/5.png',
            preview: '../../assets/previewcharacters/5.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 6,
            name: 'Magnus Brassguard',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/6.png',
            preview: '../../assets/previewcharacters/6.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 7,
            name: 'Professor Quicksprocket',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/7.png',
            preview: '../../assets/previewcharacters/7.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 8,
            name: 'Reginald Gearwhisle',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/8.png',
            preview: '../../assets/previewcharacters/8.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 9,
            name: 'Vance Steelstrike',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/9.png',
            preview: '../../assets/previewcharacters/9.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 10,
            name: 'Zephyr Gearwind',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/10.png',
            preview: '../../assets/previewcharacters/10.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 11,
            name: 'Dr. Veselius',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/11.png',
            preview: '../../assets/previewcharacters/11.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
        {
            id: 12,
            name: 'Grimmauld Ironfist',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/12.png',
            preview: '../../assets/previewcharacters/12.png',
            stats: {
                hp: 4,
                speed: 4,
                attack: 4,
                defense: 4,
            },
        },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }
}
