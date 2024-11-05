import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JournalService } from '@app/services/journal/journal.service';
import { Player } from '@common/game';
import { JournalEntry } from '@common/journal-entry';
import { of } from 'rxjs';
import { JournalComponent } from './journal.component';

describe('JournalComponent', () => {
    let component: JournalComponent;
    let fixture: ComponentFixture<JournalComponent>;
    let journalServiceStub: Partial<JournalService>;

    beforeEach(async () => {
        journalServiceStub = {
            journalEntries$: of([
                { message: 'Player1 scored', timestamp: new Date(), playersInvolved: ['Player1'] } as JournalEntry,
                { message: 'Player2 scored', timestamp: new Date(), playersInvolved: ['Player2'] } as JournalEntry,
            ]),
        };

        await TestBed.configureTestingModule({
            imports: [JournalComponent],
            providers: [{ provide: JournalService, useValue: journalServiceStub }],
        }).compileComponents();

        fixture = TestBed.createComponent(JournalComponent);
        component = fixture.componentInstance;
        component.player = { name: 'Player1' } as Player;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize journal entries on init', () => {
        expect(component.journalEntries.length).toBe(2);
    });

    it('should filter journal entries to show all', () => {
        component.filter = 'all';
        component.toggleShowAll();
        expect(component.filteredJournalEntries.length).toBe(2);
    });

    it('should filter journal entries to show involved only', () => {
        component.filter = 'involved-only';
        component.toggleShowAll();
        expect(component.filteredJournalEntries.length).toBe(1);
        expect(component.filteredJournalEntries[0].message).toBe('Player1 scored');
    });

    it('should unsubscribe on destroy', () => {
        spyOn(component.subscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.subscription.unsubscribe).toHaveBeenCalled();
    });
});
