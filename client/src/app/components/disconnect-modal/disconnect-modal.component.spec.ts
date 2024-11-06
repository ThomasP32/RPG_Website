import { ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import { DisconnectModalComponent } from './disconnect-modal.component';
import { SocketService } from '@app/services/communication-socket/communication-socket.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { WaitingRoomParameters } from '@common/constants';

describe('DisconnectModalComponent', () => {
  let component: DisconnectModalComponent;
  let fixture: ComponentFixture<DisconnectModalComponent>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let disconnectedSubject: Subject<void>;

  beforeEach(async () => {
    disconnectedSubject = new Subject<void>();
    socketServiceSpy = jasmine.createSpyObj('SocketService', ['listen']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    socketServiceSpy.listen.and.returnValue(disconnectedSubject.asObservable());
    await TestBed.configureTestingModule({
      imports: [DisconnectModalComponent],
      providers: [
          { provide: SocketService, useValue: socketServiceSpy },
          { provide: Router, useValue: routerSpy },
      ],
  }).compileComponents();

    fixture = TestBed.createComponent(DisconnectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isPlayerDisconnected to true and log message when disconnected event is received', () => {
    spyOn(console, 'log');
    
    disconnectedSubject.next(); 

    expect(component.isPlayerDisconnected).toBeTrue();
    expect(console.log).toHaveBeenCalledWith('Player disconnected');
});

it('should navigate to "/" and reset isPlayerDisconnected after timeout', fakeAsync(() => {
    disconnectedSubject.next(); 

    expect(component.isPlayerDisconnected).toBeTrue();
    
    tick(WaitingRoomParameters.TIME_LIMIT); 
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    expect(component.isPlayerDisconnected).toBeFalse();
}));

it('should add subscription on init', () => {
    spyOn(component.socketSubscription, 'add').and.callThrough();
    component.ngOnInit();
    expect(component.socketSubscription.add).toHaveBeenCalled();
});
});
