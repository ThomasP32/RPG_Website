import { Component } from '@angular/core';
import { CreateCharacterComponent } from '@app/components/create-character/create-character.component';

@Component({
    selector: 'app-character-form-page',
    standalone: true,
    imports: [CreateCharacterComponent],
    templateUrl: './character-form-page.component.html',
    styleUrls: ['./character-form-page.component.scss'],
})
export class CharacterFormPageComponent {}
