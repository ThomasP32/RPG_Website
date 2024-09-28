import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { CommunicationMapService } from '@app/services/communication.map.service';
import { ScreenShotService } from './screenshot.component';

const html2canvas = require('html2canvas'); // Utilisation de require pour contourner les problèmes d'importation

describe('ScreenshotService', () => {
    let component: ScreenShotService;
    let fixture: ComponentFixture<ScreenShotService>;
    let httpMock: HttpTestingController;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationMapService>;

    beforeEach(async () => {
        const communicationSpy = jasmine.createSpyObj('CommunicationMapService', ['basicPatch']);

        await TestBed.configureTestingModule({
            declarations: [ScreenShotService],
            providers: [{ provide: CommunicationMapService, useValue: communicationSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ScreenShotService);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
        communicationServiceSpy = TestBed.inject(CommunicationMapService) as jasmine.SpyObj<CommunicationMapService>;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call captureAndUpload and make HTTP POST request', async () => {
        spyOn(component, 'captureAndUpload').and.callThrough();

        // Création d'un faux élément HTMLCanvasElement pour simuler la capture
        const fakeCanvas = CanvasTestHelper.createCanvas(100, 100);

        // Mock html2canvas pour retourner ce faux canvas
        spyOn(html2canvas, 'default').and.returnValue(Promise.resolve(fakeCanvas));

        await component.captureAndUpload('map123');
        fixture.detectChanges();

        // Expect a POST request to be made
        const req = httpMock.expectOne('https://api.imgbb.com/1/upload?expiration=600&key=6cc9c7c4c9f0a1fabb48fe35834d938b');
        expect(req.request.method).toBe('POST');

        // Simuler une réponse réussie de imgbb
        req.flush({
            data: {
                url: 'https://fakeimageurl.com',
            },
        });

        expect(component.captureAndUpload).toHaveBeenCalled();
        expect(communicationServiceSpy.basicPatch).toHaveBeenCalledWith('admin/edition/map123', { imagePreview: 'https://fakeimageurl.com' });
    });

    it('should handle error in captureAndUpload', async () => {
        spyOn(html2canvas, 'default').and.throwError('Failed to capture screenshot');
        spyOn(console, 'error');

        await component.captureAndUpload('map123');
        expect(console.error).toHaveBeenCalledWith('Error uploading image:', jasmine.any(Error));
    });

    afterEach(() => {
        httpMock.verify();
    });
});
