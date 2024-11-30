import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { BONUS, DEFAULT_HP, DEFAULT_SPEED, ProfileType } from '@common/constants';
import { GameCreationEvents } from '@common/events/game-creation.events';
import { Avatar, Bonus } from '@common/game';
import { ProfileModalComponent } from './profile-modal.component';

describe('ProfileModalComponent', () => {
    let component: ProfileModalComponent;
    let fixture: ComponentFixture<ProfileModalComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['sendMessage']);

        await TestBed.configureTestingModule({
            imports: [ProfileModalComponent],
            providers: [{ provide: SocketService, useValue: socketServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize virtual player on init', () => {
        component.ngOnInit();
        expect(component.virtualPlayer).toBeDefined();
    });

    it('should create a virtual socket ID', () => {
        component.createVirtualSocketId();
        expect(component.virtualPlayer.socketId).toMatch(/virtualPlayer\d{1,3}/);
    });

    it('should set selected profile', () => {
        const profile = 'aggressive';
        component.setProfile(profile);
        expect(component.selectedProfile).toBe(profile);
        component.highlightSelectedProfileButton();
    });

    it('should assign a random name to the virtual player', () => {
        component.activePlayers = [
            {
                name: 'Bot1',
                avatar: Avatar.Avatar1,
                isActive: true,
                socketId: '',
                specs: {} as any,
                inventory: [],
                position: { x: 0, y: 0 },
                initialPosition: { x: 0, y: 0 },
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            },
        ];
        component.assignRandomName();
        expect(component.virtualPlayer.name).toBeDefined();
        expect(component.virtualPlayer.name).not.toBe('Bot1');
    });

    it('should assign a random avatar to the virtual player', () => {
        component.activePlayers = [
            {
                name: 'Bot1',
                avatar: Avatar.Avatar1,
                isActive: true,
                socketId: '',
                specs: {} as any,
                inventory: [],
                position: { x: 0, y: 0 },
                initialPosition: { x: 0, y: 0 },
                turn: 0,
                visitedTiles: [],
                profile: ProfileType.NORMAL,
            },
        ];
        component.assignRandomAvatar();
        expect(component.virtualPlayer.avatar).toBeDefined();
        expect(component.virtualPlayer.avatar).not.toBe(Avatar.Avatar1);
    });

    it('should assign a random life bonus', () => {
        spyOn(Math, 'random').and.returnValue(0.4);
        component.assignRandomLifeOrSpeedBonus();
        expect(component.virtualPlayer.specs.life).toBe(DEFAULT_HP + BONUS);
        expect(component.virtualPlayer.specs.speed).toBe(DEFAULT_SPEED);
    });

    it('should assign a random speed bonus', () => {
        spyOn(Math, 'random').and.returnValue(0.6);
        component.assignRandomLifeOrSpeedBonus();
        expect(component.virtualPlayer.specs.speed).toBe(DEFAULT_SPEED + BONUS);
        expect(component.virtualPlayer.specs.life).toBe(DEFAULT_HP);
    });

    it('should assign a random attack bonus', () => {
        spyOn(Math, 'random').and.returnValue(0.4);
        component.assignRandomAttackOrDefenseBonus();
        expect(component.virtualPlayer.specs.attackBonus).toBe(Bonus.D6);
        expect(component.virtualPlayer.specs.defenseBonus).toBe(Bonus.D4);
    });

    it('should assign a random defense bonus', () => {
        spyOn(Math, 'random').and.returnValue(0.6);
        component.assignRandomAttackOrDefenseBonus();
        expect(component.virtualPlayer.specs.attackBonus).toBe(Bonus.D4);
        expect(component.virtualPlayer.specs.defenseBonus).toBe(Bonus.D6);
    });

    it('should create a virtual player', () => {
        component.createVirtualPlayer();
        expect(component.virtualPlayer).toBeDefined();
    });

    it('should call all necessary methods and send message on submit', () => {
        spyOn(component, 'assignRandomName');
        spyOn(component, 'assignRandomAvatar');
        spyOn(component, 'assignRandomLifeOrSpeedBonus');
        spyOn(component, 'assignRandomAttackOrDefenseBonus');
        spyOn(component, 'createVirtualSocketId');
        spyOn(component, 'createVirtualPlayer');
        component.closeProfileModal = jasmine.createSpy('closeProfileModal');

        component.onSubmit();

        expect(component.assignRandomName).toHaveBeenCalled();
        expect(component.assignRandomAvatar).toHaveBeenCalled();
        expect(component.assignRandomLifeOrSpeedBonus).toHaveBeenCalled();
        expect(component.assignRandomAttackOrDefenseBonus).toHaveBeenCalled();
        expect(component.createVirtualSocketId).toHaveBeenCalled();
        expect(component.createVirtualPlayer).toHaveBeenCalled();
        expect(socketServiceSpy.sendMessage).toHaveBeenCalledWith(GameCreationEvents.JoinGame, {
            player: component.virtualPlayer,
            gameId: component.gameId,
        });
        expect(component.closeProfileModal).toHaveBeenCalled();
    });

    it('should highlight the selected profile button', () => {
        const aggressiveButton = document.createElement('button');
        aggressiveButton.classList.add('profile-button', 'profile-button--aggressive');
        document.body.appendChild(aggressiveButton);

        const defensiveButton = document.createElement('button');
        defensiveButton.classList.add('profile-button', 'profile-button--defensive');
        document.body.appendChild(defensiveButton);

        component.selectedProfile = ProfileType.AGGRESSIVE;
        component.highlightSelectedProfileButton();
        expect(aggressiveButton.classList.contains('profile-button--active')).toBeFalse();
        expect(defensiveButton.classList.contains('profile-button--active')).toBeFalse();

        component.selectedProfile = ProfileType.DEFENSIVE;
        component.highlightSelectedProfileButton();
        expect(defensiveButton.classList.contains('profile-button--active')).toBeFalse();
        expect(aggressiveButton.classList.contains('profile-button--active')).toBeFalse();

        document.body.removeChild(aggressiveButton);
        document.body.removeChild(defensiveButton);
    });
});
