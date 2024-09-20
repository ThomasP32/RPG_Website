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
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107687733690369/4.png?ex=66ecb49f&is=66eb631f&hm=19cfaca4529d2d5c2e30f1f507ebc18a6e827eb007e14b5da63ff296bd2398e7&',
        },
        {
            id: 2,
            name: 'Arachnoform',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107688052330569/5.png?ex=66ecb49f&is=66eb631f&hm=9719fe481adfa4ebe1918b8ea39c0323b63728e1360f2e2f258ad399b2daf987&',
        },
        {
            id: 3,
            name: 'Archibald Lighbulb',
            // eslint-disable-next-line max-len
            image: 'https://media.discordapp.net/attachments/1285776237268041749/1286107688433877012/6.png?ex=66ecb49f&is=66eb631f&hm=be984fbfd8ea8d6072076266f547fe080e03f9903e50a7223a3dc0d33c2c5507&=&format=webp&quality=lossless&width=662&height=662',
        },
        {
            id: 4,
            name: 'Archpriest Mechanohr',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107688811630705/7.png?ex=66ecb49f&is=66eb631f&hm=a75d48150120a8ca34ec4fb724f7be9f08b2937dcb23130c6ca883e64e8880c6&',
        },
        {
            id: 5,
            name: 'Cyron Vex',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107689306423306/8.png?ex=66ecb49f&is=66eb631f&hm=09d66ce1f407d0ea77978fa97df57f444ff0306758f92373beb404952ab69b74&',
        },
        {
            id: 6,
            name: 'Magnus Brassguard',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107689646297161/9.png?ex=66ecb49f&is=66eb631f&hm=ca791ba8df11242421487f4ee0f836ce4c98bc08a38df80a8ccd630cb1e93279&',
        },
        {
            id: 7,
            name: 'Professor Quicksprocket',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107689956413502/10.png?ex=66ecb4a0&is=66eb6320&hm=b23af4202ec0f9db38b81e7098f40976529cad540c55a29bcfaed5d0fba35596&',
        },
        {
            id: 8,
            name: 'Big Bob',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107690275307571/11.png?ex=66ecb4a0&is=66eb6320&hm=43e7b7a60f996454c52f4f8b6df6db8173dd8e9cf8f409d8ca2b8fe970d39a47&',
        },
        {
            id: 9,
            name: 'Vance Steelstrike',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107690694611004/12.png?ex=66ecb4a0&is=66eb6320&hm=7fe7ca882cd1959ed1f249a8802fa00dc531464d7e56ccfb6cd1684f914a5030&',
        },
        {
            id: 10,
            name: 'Zephyr Gearwind',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107691118362737/13.png?ex=66ecb4a0&is=66eb6320&hm=ab77ec4dc66033c2bbaf5e2de27943d03c6f7788f4fcd0be0d105dfc78941501&',
        },
        {
            id: 11,
            name: 'Dr. Veselius',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107714484699210/14.png?ex=66ecb4a5&is=66eb6325&hm=68ec60f2c270dbd07db576d451a39caa8e408a52e8d28b8f5376d59d8f99a292&',
        },
        {
            id: 12,
            name: 'Grimmauld Ironfist',
            // eslint-disable-next-line max-len
            image: 'https://cdn.discordapp.com/attachments/1285776237268041749/1286107714828636251/15.png?ex=66ecb4a5&is=66eb6325&hm=45f01af3e79321ff5e15ebccc12867c0605c7ffaecdd20d5d797d5d853f80e7c&',
        },
    ];

    getCharacters(): Observable<Character[]> {
        return of(this.characters);
    }
}
