import { CreateGameDto, CoordinateDto } from './create-game.dto';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsOutOfMap', async: false })
export class IsOutOfMap implements ValidatorConstraintInterface {
    validate(coordinate: CoordinateDto, args: ValidationArguments) {
        const game = args.object as CreateGameDto;
        const mapSize = game.mapSize;

        if (coordinate.x > mapSize.x || coordinate.x < 0 || coordinate.y > mapSize.x || coordinate.y < 0 ) {
            return false;
        }
        return true;
    }
    defaultMessage() {
        return 'All elements must be placed within the map.';
    }
}
