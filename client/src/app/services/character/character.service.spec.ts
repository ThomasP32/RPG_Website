import { TestBed } from '@angular/core/testing';
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

    it('should return characters with valid properties', (done) => {
        service.characters.forEach((character) => {
            expect(character.id).toBeDefined();
            expect(character.image).toBeDefined();
            expect(character.isAvailable).toBe(true);
        });
        done();
    });

    it('should return characters with correct avatars', (done) => {
        const avatars = service.characters.map((c) => c.id);
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

    it('should return the correct preview image for a given avatar', () => {
        const preview = service.getAvatarPreview(Avatar.Avatar1);
        expect(preview).toBe('./assets/previewcharacters/1_preview.png');
    });

    it('should return an empty string if the avatar does not exist', () => {
        const preview = service.getAvatarPreview(999 as Avatar);
        expect(preview).toBe('');
    });

    it('should reset character availability to true for all characters', () => {
        const characters = service.characters;
        characters[0].isAvailable = false;

        service.resetCharacterAvailability();

        service.characters.forEach((character) => {
            expect(character.isAvailable).toBe(true);
        });
    });
});
