import { TestBed } from '@angular/core/testing';
import { Character } from '@app/interfaces/character';
import { Avatar } from '@common/game';
import { CharacterService } from './character.service';

describe('CharacterService', () => {
    let service: CharacterService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CharacterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return an observable of characters', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            expect(characters.length).toBe(12);
            expect(characters[0].name).toBe('Alistair Clockhaven');
            expect(characters[1].name).toBe('Arachnoform');
            done();
        });
    });

    it('should return characters with valid properties', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            characters.forEach((character) => {
                expect(character.id).toBeDefined();
                expect(character.name).toBeDefined();
                expect(character.image).toBeDefined();
                expect(character.isAvailable).toBe(true);
            });
            done();
        });
    });

    it('should return characters with correct avatars', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            const avatars = characters.map((c) => c.id);
            expect(avatars).toEqual([
                Avatar.Avatar1,
                Avatar.Avatar2,
                Avatar.Avatar3,
                Avatar.Avatar4,
                Avatar.Avatar5,
                Avatar.Avatar6,
                Avatar.Avatar7,
                Avatar.Avatar8,
                Avatar.Avatar9,
                Avatar.Avatar10,
                Avatar.Avatar11,
                Avatar.Avatar12,
            ]);
            done();
        });
    });

    it('should disable specified avatars when setDisabledAvatars is called', (done) => {
        service.setDisabledAvatars([Avatar.Avatar2, Avatar.Avatar4]);

        service.getCharacters().subscribe((characters: Character[]) => {
            const disabledAvatars = characters.filter((character) => !character.isAvailable).map((character) => character.id);
            expect(disabledAvatars).toEqual([Avatar.Avatar2, Avatar.Avatar4]);
            done();
        });
    });

    it('should keep unspecified avatars enabled when setDisabledAvatars is called', (done) => {
        service.setDisabledAvatars([Avatar.Avatar5]);

        service.getCharacters().subscribe((characters: Character[]) => {
            const availableCharacters = characters.filter((character) => character.isAvailable).map((character) => character.id);
            const disabledCharacters = characters.filter((character) => !character.isAvailable).map((character) => character.id);

            expect(disabledCharacters).toEqual([Avatar.Avatar5]);
            expect(availableCharacters).toContain(Avatar.Avatar1);
            expect(availableCharacters).toContain(Avatar.Avatar2);
            done();
        });
    });

    it('should not disable any avatars if an empty array is passed to setDisabledAvatars', (done) => {
        service.setDisabledAvatars([]);

        service.getCharacters().subscribe((characters: Character[]) => {
            const disabledAvatars = characters.filter((character) => !character.isAvailable);
            expect(disabledAvatars.length).toBe(0);
            done();
        });
    });
});
