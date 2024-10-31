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

    it('should return the correct preview image for a given avatar', () => {
        const preview = service.getAvatarPreview(Avatar.Avatar1);
        expect(preview).toBe('./assets/previewcharacters/1.png');
    });

    it('should return an empty string if the avatar does not exist', () => {
        const preview = service.getAvatarPreview(999 as Avatar);
        expect(preview).toBe('');
    });

    it('should reset character availability to true for all characters', () => {
        const characters = service.getCharacters();
        characters.subscribe((chars) => {
            chars[0].isAvailable = false;
        });

        service.resetCharacterAvailability();

        service.getCharacters().subscribe((chars) => {
            chars.forEach(character => {
                expect(character.isAvailable).toBe(true);
            });
        });
    });
});
