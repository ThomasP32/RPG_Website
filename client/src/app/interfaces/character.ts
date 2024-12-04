import { Avatar } from '@common/game';

export interface Character {
    id: Avatar;
    image: string;
    preview: string;
    isAvailable: boolean;
}
