import { TestBed } from '@angular/core/testing';

import { Character } from '@app/interfaces/character';
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
            done();
        });
    });

    it('should return characters with valid properties', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            characters.forEach((character) => {
                expect(character.id).toBeDefined();
                expect(character.name).toBeDefined();
                expect(character.image).toBeDefined();
            });
            done();
        });
    });

    it('should return characters with correct IDs', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            const ids = characters.map((c) => c.id);
            expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            done();
        });
    });

    it('should return characters with non-empty names and images', (done) => {
        service.getCharacters().subscribe((characters: Character[]) => {
            characters.forEach((character) => {
                expect(character.name).not.toBe('');
                expect(character.image).not.toBe('');
            });
            done();
        });
    });
});
