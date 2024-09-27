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
        },
        {
            id: 2,
            name: 'Arachnoform',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/2.png',
        },
        {
            id: 3,
            name: 'Archibald Lighbulb',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/3.png',
        },
        {
            id: 4,
            name: 'Archpriest Mechanohr',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/4.png',
        },
        {
            id: 5,
            name: 'Cyron Vex',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/5.png',
        },
        {
            id: 6,
            name: 'Magnus Brassguard',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/6.png',
        },
        {
            id: 7,
            name: 'Professor Quicksprocket',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/7.png',
        },
        {
            id: 8,
            name: 'Big Bob',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/8.png',
        },
        {
            id: 9,
            name: 'Vance Steelstrike',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/9.png',
        },
        {
            id: 10,
            name: 'Zephyr Gearwind',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/10.png',
        },
        {
            id: 11,
            name: 'Dr. Veselius',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/11.png',
        },
        {
            id: 12,
            name: 'Grimmauld Ironfist',
            // eslint-disable-next-line max-len
            image: '../../assets/characters/12.png',
        },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }
}
