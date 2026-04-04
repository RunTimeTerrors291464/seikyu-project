import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

function utcDayStartMs(d: Date): number {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

@ValidatorConstraint({ name: 'InvoiceDateRange', async: false })
export class InvoiceDateRangeConstraint implements ValidatorConstraintInterface {
    validate(_toDate: unknown, args: ValidationArguments): boolean {
        const maxDays = (args.constraints[0] as number) ?? 180;
        const obj = args.object as { fromDate?: string; toDate?: string };
        const { fromDate, toDate } = obj ?? {};
        if (!fromDate || !toDate) {
            return false;
        }
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            return false;
        }
        const fromDay = utcDayStartMs(from);
        const toDay = utcDayStartMs(to);
        if (toDay < fromDay) {
            return false;
        }
        const diffDays = (toDay - fromDay) / 86_400_000;
        return diffDays <= maxDays;
    }

    defaultMessage(args: ValidationArguments): string {
        const maxDays = (args.constraints[0] as number) ?? 180;
        return `fromDate and toDate must be valid ISO dates with fromDate <= toDate, and the range must not exceed ${maxDays} days.`;
    }
}
