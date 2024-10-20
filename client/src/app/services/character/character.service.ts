import { Injectable } from '@angular/core';
import { Character } from '@app/interfaces/character';
import { Avatar } from '@common/game';
import { Observable, of } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    private characters = [
        {
            avatar: Avatar.Avatar1,
            name: 'Alistair Clockhaven',
            image: '../../assets/characters/1.png',
            preview: '../../assets/previewcharacters/1.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar2,
            name: 'Arachnoform',
            image: '../../assets/characters/2.png',
            preview: '../../assets/previewcharacters/2.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar3,
            name: 'Archibald Light',
            image: '../../assets/characters/3.png',
            preview: '../../assets/previewcharacters/3.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar4,
            name: 'Archpriest Mechanohr',
            image: '../../assets/characters/4.png',
            preview: '../../assets/previewcharacters/4.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar5,
            name: 'Cyron Vex',
            image: '../../assets/characters/5.png',
            preview: '../../assets/previewcharacters/5.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar6,
            name: 'Magnus Brassguard',
            image: '../../assets/characters/6.png',
            preview: '../../assets/previewcharacters/6.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar7,
            name: 'Professor Quicksprocket',
            image: '../../assets/characters/7.png',
            preview: '../../assets/previewcharacters/7.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar8,
            name: 'Reginald Gearwhisle',
            image: '../../assets/characters/8.png',
            preview: '../../assets/previewcharacters/8.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar9,
            name: 'Vance Steelstrike',
            image: '../../assets/characters/9.png',
            preview: '../../assets/previewcharacters/9.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar10,
            name: 'Zephyr Gearwind',
            image: '../../assets/characters/10.png',
            preview: '../../assets/previewcharacters/10.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar11,
            name: 'Dr. Veselius',
            image: '../../assets/characters/11.png',
            preview: '../../assets/previewcharacters/11.png',
            available: true,
        },
        {
            avatar: Avatar.Avatar12,
            name: 'Grimmauld Ironfist',
            image: '../../assets/characters/12.png',
            preview: '../../assets/previewcharacters/12.png',
            available: true,
        },
    ];

    setDisabledAvatars(avatars: Avatar[]): void {
        console.log('Received avatars:', avatars);
        this.characters.forEach((character) => {
            if (avatars.includes(character.avatar)) {
                character.available = false;
            }
        });
    }

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }

    getAvatarPreview(avatar: Avatar): string {
        return this.characters.find((character) => character.avatar === avatar)?.preview || '';
    }
}
