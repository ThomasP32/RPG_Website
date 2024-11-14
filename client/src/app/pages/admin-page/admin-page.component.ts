import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CreateMapModalComponent } from '@app/components/create-map-modal/create-map-modal.component';
import { ErrorMessageComponent } from '@app/components/error-message-component/error-message.component';
import { CommunicationMapService } from '@app/services/communication/communication.map.service';
import { DetailedMap } from '@common/map.types';
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
        this.communicationMapService.basicGet<DetailedMap[]>('admin').subscribe((maps: DetailedMap[]) => {
            this.maps = maps;
            console.log('Maps updated after import:', this.maps);
        });
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

    onGameImported(file: File): void {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                console.log('File content:', reader.result);
                const parsedData = JSON.parse(reader.result as string);
                const { _id, lastModified, _v, ...cleanedData } = parsedData;

                this.communicationMapService.basicPost('map/import', cleanedData).subscribe({
                    next: (response) => {
                        this.updateDisplay();
                    },
                    error: (error) => {
                        this.handleImportError(error, file);
                    },
                });
            } catch (error) {
                this.onImportError('Le format ce fichier est invalide. Un fichier en format JSON est attendu.');
            }
        };
        reader.readAsText(file);
    }

    onFileSelect(event: any): void {
        console.log('File selected:', event.target.files[0]);
        const file = event.target.files[0] as File;
        if (file) {
            this.onGameImported(file);
        }
    }

    private handleImportError(error: any, file: File): void {
        if (error.status === 409) {
            const newName = prompt(`Un jeu avec le nom "${file.name}" existe déjà. Entrez un nouveau nom :`);
            if (newName) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const parsedData = JSON.parse(reader.result as string);
                        parsedData.name = newName;
                        const updatedContent = JSON.stringify(parsedData, null, 2);
                        const updatedFile = new File([updatedContent], `${newName}.json`, { type: 'application/json' });
                        this.onGameImported(updatedFile);
                    } catch (parseError) {
                        this.errorMessageModal.open('Erreur lors de la modification du fichier JSON.');
                        console.error('Erreur de parsing JSON lors de la modification du nom :', parseError);
                    }
                };
                reader.readAsText(file);
            } else {
                this.errorMessageModal.open('Importation annulée : le nom est déjà utilisé.');
            }
        } else if (error.status === 400) {
            this.errorMessageModal.open('Le fichier JSON contient des erreurs de format. Veuillez vérifier et réessayer.');
        } else {
            this.errorMessageModal.open('Erreur lors de l’importation du fichier.');
        }

        console.error('Détails de l’erreur d’importation :', error);
    }
}
