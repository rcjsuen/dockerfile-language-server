import { ValidationSeverity } from './dockerValidator';

export interface ValidatorSettings {

	deprecatedMaintainer?: ValidationSeverity;

	directiveCasing?: ValidationSeverity;

	instructionCasing?: ValidationSeverity;
}