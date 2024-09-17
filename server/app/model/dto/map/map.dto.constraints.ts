import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { CoordinateDto, CreateMapDto } from './create-map.dto';

@ValidatorConstraint({ name: 'IsOutOfMap', async: false })
export class IsOutOfMap implements ValidatorConstraintInterface {
    validate(coordinate: CoordinateDto, args: ValidationArguments) {
        const map = args.object as CreateMapDto;
        const mapSize = map.mapSize;

        if (coordinate.x > mapSize.x || coordinate.x < 0 || coordinate.y > mapSize.x || coordinate.y < 0) {
            return false;
        }
        return true;
    }
    defaultMessage() {
        return 'All elements must be placed within the map.';
    }
}
