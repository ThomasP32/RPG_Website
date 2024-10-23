import { Injectable } from '@angular/core';
import { Character } from '@app/interfaces/character';
import { Avatar } from '@common/game';
import { Observable, of } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    // il faut rajouter isAvailable pour eviter de rerender la page dans character-form (si on rerender on perd
    // le socket et je sais pas pourquoi mais le socket se créé seulement à la page de départ on pourrait régler ca après mais
    // ca me semble quand meme etre bien de l'avoir ici)
    private characters = [
        {
            id: Avatar.Avatar1,
            name: 'Alistair Clockhaven',
            image: '../../assets/characters/1.png',
            preview: '../../assets/previewcharacters/1.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar2,
            name: 'Arachnoform',
            image: '../../assets/characters/2.png',
            preview: '../../assets/previewcharacters/2.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar3,
            name: 'Archibald Light',
            image: '../../assets/characters/3.png',
            preview: '../../assets/previewcharacters/3.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar4,
            name: 'Archpriest Mechanohr',
            image: '../../assets/characters/4.png',
            preview: '../../assets/previewcharacters/4.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar5,
            name: 'Cyron Vex',
            image: '../../assets/characters/5.png',
            preview: '../../assets/previewcharacters/5.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar6,
            name: 'Magnus Brassguard',
            image: '../../assets/characters/6.png',
            preview: '../../assets/previewcharacters/6.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar7,
            name: 'Professor Quicksprocket',
            image: '../../assets/characters/7.png',
            preview: '../../assets/previewcharacters/7.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar8,
            name: 'Reginald Gearwhisle',
            image: '../../assets/characters/8.png',
            preview: '../../assets/previewcharacters/8.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar9,
            name: 'Vance Steelstrike',
            image: '../../assets/characters/9.png',
            preview: '../../assets/previewcharacters/9.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar10,
            name: 'Zephyr Gearwind',
            image: '../../assets/characters/10.png',
            preview: '../../assets/previewcharacters/10.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar11,
            name: 'Dr. Veselius',
            image: '../../assets/characters/11.png',
            preview: '../../assets/previewcharacters/11.png',
            isAvailable: true,
        },
        {
            id: Avatar.Avatar12,
            name: 'Grimmauld Ironfist',
            image: '../../assets/characters/12.png',
            preview: '../../assets/previewcharacters/12.png',
            isAvailable: true,
        },
    ];

    setDisabledAvatars(avatars: Avatar[]): void {
        console.log('Received avatars:', avatars);
        this.characters.forEach((character) => {
            if (avatars.includes(character.id)) {
                character.isAvailable = false;
            }
        });
    }

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }

    getAvatarPreview(avatar: Avatar): string {
        return this.characters.find((character) => character.id === avatar)?.preview || '';
    }
}
