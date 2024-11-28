import { TestBed } from '@angular/core/testing';
import { MapSize } from '@common/constants';
import { MapConversionService } from './map-conversion.service';

describe('MapConversionService', () => {
    let service: MapConversionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MapConversionService],
        });
        service = TestBed.inject(MapConversionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('convertToMapSize', () => {
        it('should return SMALL for size 10', () => {
            expect(service.convertToMapSize(10)).toBe(MapSize.SMALL);
        });

        it('should return MEDIUM for size 15', () => {
            expect(service.convertToMapSize(15)).toBe(MapSize.MEDIUM);
        });

        it('should return LARGE for size 20', () => {
            expect(service.convertToMapSize(20)).toBe(MapSize.LARGE);
        });

        it('should return SMALL for invalid numeric size and log a warning', () => {
            spyOn(console, 'warn');
            expect(service.convertToMapSize(25)).toBe(MapSize.SMALL);
            expect(console.warn).toHaveBeenCalledWith('Invalid numeric size: 25, defaulting to SMALL');
        });

        it('should return SMALL for "small"', () => {
            expect(service.convertToMapSize('small')).toBe(MapSize.SMALL);
        });

        it('should return MEDIUM for "medium"', () => {
            expect(service.convertToMapSize('medium')).toBe(MapSize.MEDIUM);
        });

        it('should return LARGE for "large"', () => {
            expect(service.convertToMapSize('large')).toBe(MapSize.LARGE);
        });

        it('should return SMALL for invalid string size and log a warning', () => {
            spyOn(console, 'warn');
            expect(service.convertToMapSize('extra-large' as any)).toBe(MapSize.SMALL);
            expect(console.warn).toHaveBeenCalledWith('Invalid size string: extra-large, defaulting to SMALL');
        });
    });

    describe('getMaxPlayers', () => {
        it('should return 2 for SMALL size', () => {
            expect(service.getMaxPlayers(10)).toBe(2);
        });

        it('should return 4 for MEDIUM size', () => {
            expect(service.getMaxPlayers(15)).toBe(4);
        });

        it('should return 6 for LARGE size', () => {
            expect(service.getMaxPlayers(20)).toBe(6);
        });

        it('should handle invalid size by defaulting to SMALL', () => {
            spyOn(console, 'warn');
            expect(service.getMaxPlayers(25)).toBe(2);
            expect(console.warn).toHaveBeenCalledWith('Invalid numeric size: 25, defaulting to SMALL');
        });
    });

    describe('getNbItems', () => {
        it('should return 2 for SMALL size', () => {
            expect(service.getNbItems(10)).toBe(2);
        });

        it('should return 4 for MEDIUM size', () => {
            expect(service.getNbItems(15)).toBe(4);
        });

        it('should return 6 for LARGE size', () => {
            expect(service.getNbItems(20)).toBe(6);
        });

        it('should handle invalid size by defaulting to SMALL', () => {
            spyOn(console, 'warn');
            expect(service.getNbItems(25)).toBe(2);
            expect(console.warn).toHaveBeenCalledWith('Invalid numeric size: 25, defaulting to SMALL');
        });
    });

    describe('getPlayerCountMessage', () => {
        it('should return "2 joueurs" for SMALL size', () => {
            expect(service.getPlayerCountMessage(10)).toBe('2 joueurs');
        });

        it('should return "2 à 4 joueurs" for MEDIUM size', () => {
            expect(service.getPlayerCountMessage(15)).toBe('2 à 4 joueurs');
        });

        it('should return "2 à 6 joueurs" for LARGE size', () => {
            expect(service.getPlayerCountMessage(20)).toBe('2 à 6 joueurs');
        });

        it('should handle invalid size by defaulting to SMALL', () => {
            spyOn(console, 'warn');
            expect(service.getPlayerCountMessage(25)).toBe('2 joueurs');
            expect(console.warn).toHaveBeenCalledWith('Invalid numeric size: 25, defaulting to SMALL');
        });
        describe('convertNumberToString', () => {
            it('should return "Petite" for size 10', () => {
                expect(service.convertNumberToString(10)).toBe('Petite');
            });

            it('should return "Moyenne" for size 15', () => {
                expect(service.convertNumberToString(15)).toBe('Moyenne');
            });

            it('should return "Large" for size 20', () => {
                expect(service.convertNumberToString(20)).toBe('Large');
            });

            it('should return "Petite" for invalid size', () => {
                expect(service.convertNumberToString(25)).toBe('Petite');
            });
        });
    });
});
