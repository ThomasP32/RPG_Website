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
            id: Avatar.Avatar1,
            image: './assets/characters/1.png',
            preview: './assets/previewcharacters/1_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar2,
            image: './assets/characters/2.png',
            preview: './assets/previewcharacters/2_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar3,
            image: './assets/characters/3.png',
            preview: './assets/previewcharacters/3_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar4,
            image: './assets/characters/4.png',
            preview: './assets/previewcharacters/4_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar5,
            image: './assets/characters/5.png',
            preview: './assets/previewcharacters/5_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar6,
            image: './assets/characters/6.png',
            preview: './assets/previewcharacters/6_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar7,
            image: './assets/characters/7.png',
            preview: './assets/previewcharacters/7_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar8,
            image: './assets/characters/8.png',
            preview: './assets/previewcharacters/8_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar9,
            image: './assets/characters/9.png',
            preview: './assets/previewcharacters/9_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar10,
            image: './assets/characters/10.png',
            preview: './assets/previewcharacters/10_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar11,
            image: './assets/characters/11.png',
            preview: './assets/previewcharacters/11_preview.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar12,
            image: './assets/characters/12.png',
            preview: './assets/previewcharacters/12_preview.png',
            isAvailable: true,
        },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }

    resetCharacterAvailability(): void {
        this.characters.forEach((character) => {
            character.isAvailable = true;
        });
    }
    getAvatarPreview(avatar: Avatar): string {
        return this.characters.find((character) => character.id === avatar)?.preview || '';
    }
}
