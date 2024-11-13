import { Component, Input, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CreateMapModalComponent } from '@app/components/create-map-modal/create-map-modal.component';
import { ErrorMessageComponent } from '@app/components/error-message-component/error-message.component';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DetailedMap } from '@common/map.types';
import { validate } from '@app/schemas/map-schema';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [ErrorMessageComponent, CreateMapModalComponent],
})
export class AdminPageComponent implements OnInit {
    @Input() mapId: string = '';
    @Output() gameImported = new EventEmitter<DetailedMap>();
    @Output() importError = new EventEmitter<string>();
    @ViewChild('fileInput') fileInput!: ElementRef;
    @ViewChild(CreateMapModalComponent, { static: false }) createMapModalComponent!: CreateMapModalComponent;
    @ViewChild(ErrorMessageComponent, { static: false }) errorMessageModal: ErrorMessageComponent;
    
    maps: DetailedMap[] = [];
    currentMapId: string | null = null;
    showDeleteModal = false;
    isCreateMapModalVisible = false;

    constructor(
        private router: Router,
        private communicationMapService: CommunicationMapService,
    ) {
        this.router = router;
        this.communicationMapService = communicationMapService;
    }

    navigateToMain(): void {
        this.router.navigate(['/main-menu']);
    }

    ngOnInit(): void {
        this.communicationMapService.basicGet<DetailedMap[]>('admin').subscribe((maps: DetailedMap[]) => (this.maps = maps));
    }

    toggleGameCreationModalVisibility(): void {
        this.isCreateMapModalVisible = true;
    }

    onCloseModal(): void {
        this.isCreateMapModalVisible = false;
    }

    editMap(map: DetailedMap): void {
        this.router.navigate([`/edition/${map._id}`]);
    }

    deleteMap(mapId: string): void {
        this.communicationMapService.basicDelete(`admin/${mapId}`).subscribe({
            next: () => {
                this.updateDisplay();
            },
            error: (err) => {
                this.errorMessageModal.open(JSON.parse(err.error).message);
            },
        });
    }

    openConfirmationModal(map: DetailedMap): void {
        this.currentMapId = map._id.toString();
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.currentMapId = null;
    }

    confirmDelete(mapId: string): void {
        this.deleteMap(mapId);
        this.closeDeleteModal();
    }

    updateDisplay(): void {
        this.communicationMapService.basicGet<DetailedMap[]>('admin').subscribe((maps: DetailedMap[]) => (this.maps = maps));
    }

    toggleVisibility(mapId: string): void {
        this.communicationMapService.basicPatch(`admin/${mapId}`).subscribe(() => this.updateDisplay());
    }

    formatDate(lastModified: Date): string {
        const date = new Date(lastModified);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    onGameImported(importedMap: DetailedMap): void {
        if (this.maps.some((map) => map.name === importedMap.name)) {
            const newName = prompt(`Un jeu avec le nom "${importedMap.name}" existe déjà. Entrez un nouveau nom :`);
            if (newName) {
                importedMap.name = newName;
            } else {
                this.errorMessageModal.open('Importation annulée : le nom est déjà utilisé.');
                return;
            }
        }

        importedMap.isVisible = false;

        this.communicationMapService.basicPost('admin', importedMap).subscribe({
            next: () => this.updateDisplay(),
            error: (err) => this.errorMessageModal.open(JSON.parse(err.error).message),
        });
    }

    onImportError(error: string): void {
        this.errorMessageModal.open(error);
    }

    onExport(map: DetailedMap): void {
        const { isVisible, ...exportData } = map; 
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, `${map.name || 'map'}.json`);
    }

    triggerFileInput(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelect(event: any): void {
        const file = event.target.files[0] as File;
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const importedMap = JSON.parse(e.target.result) as DetailedMap;

                    if (!importedMap.name || !importedMap.mapSize || !importedMap.mode) {
                        this.importError.emit('Le fichier JSON est incomplet ou mal formaté.');
                        return;
                    }

                    if (!validate(importedMap)) {
                        const errorMessages = validate.errors?.map((err) => `Attribut '${err.instancePath}' ${err.message}`).join(', ');
                        this.importError.emit(`Le fichier JSON est invalide : ${errorMessages}`);
                        return;
                    }

                    this.gameImported.emit(importedMap);
                } catch (error) {
                    this.importError.emit('Erreur de format JSON');
                }
            };
            reader.readAsText(file);
        }
    }
}
