import { Avatar } from '@common/game';

export interface Character {
    avatar: Avatar;
    name: string;
    image: string;
    preview: string;
    available: boolean;
}
