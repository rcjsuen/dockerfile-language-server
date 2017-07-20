/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { ValidationSeverity } from './dockerValidator';

export interface ValidatorSettings {

	deprecatedMaintainer?: ValidationSeverity;

	directiveCasing?: ValidationSeverity;

	instructionCasing?: ValidationSeverity;

	instructionCmdMultiple?: ValidationSeverity;

	instructionEntrypointMultiple?: ValidationSeverity;

	instructionHealthcheckMultiple?: ValidationSeverity;
}