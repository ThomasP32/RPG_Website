import { Component } from '@angular/core';

@Component({
    selector: 'app-profile-modal',
    standalone: true,
    imports: [],
    templateUrl: './profile-modal.component.html',
    styleUrl: './profile-modal.component.scss',
})
export class ProfileModalComponent {
    selectedProfile: string | null = null;

    setProfile(profile: string): void {
        this.selectedProfile = profile;
    }

    createVirtualPlayer(): void {
        // Create a virtual player with the selected profile
    }
}
