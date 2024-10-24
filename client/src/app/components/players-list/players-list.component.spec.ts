import { TestBed } from '@angular/core/testing';
import { CharacterService } from '@app/services/character/character.service';
import { Avatar } from '@common/game';
import { PlayersListComponent } from './players-list.component';

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let characterService: CharacterService;

    const mockCharacterService = {
        getAvatarPreview: jasmine.createSpy('getAvatarPreview').and.callFake((avatar: Avatar) => {
            const mockCharacters = [
                { id: Avatar.Avatar1, preview: '../../assets/previewcharacters/1.png' },
                { id: Avatar.Avatar2, preview: '../../assets/previewcharacters/2.png' },
            ];
            const foundCharacter = mockCharacters.find((character) => character.id === avatar);
            return foundCharacter ? foundCharacter.preview : '';
        }),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PlayersListComponent],
            providers: [{ provide: CharacterService, useValue: mockCharacterService }],
        }).compileComponents();

        const fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        characterService = TestBed.inject(CharacterService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the correct preview URL for a given avatar', () => {
        const avatarPreview = component.getAvatarPreview(Avatar.Avatar1);
        expect(avatarPreview).toBe('../../assets/previewcharacters/1.png');
        expect(characterService.getAvatarPreview).toHaveBeenCalledWith(Avatar.Avatar1);
    });
});
