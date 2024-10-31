import { Avatar } from '@common/game';

export interface Character {
    id: Avatar;
    name: string;
    image: string;
    preview: string;
    isAvailable: boolean;
}
