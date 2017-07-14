import { ValidationSeverity } from './dockerValidator';

export interface ValidatorSettings {

	deprecatedMaintainer?: ValidationSeverity;

	instructionCasing?: ValidationSeverity;
}