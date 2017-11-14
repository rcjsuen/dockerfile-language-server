/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Dockerfile } from '../dockerfile';
import { Variable } from '../variable';
import { Property } from '../property';
import { PropertyInstruction } from './propertyInstruction';
import { Util } from '../../docker';

export class Label extends PropertyInstruction {

	constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, dockerfile, escapeChar, instruction, instructionRange);
	}

	public getVariables(): Variable[] {
		const variables = super.getVariables();
		const properties = this.getProperties();
		// iterate over all of this LABEL's properties
		for (const property of properties) {
			const value = property.getRawValue();
			// check if the value is contained in single quotes,
			// single quotes would indicate a literal value
			if (value.length >= 2 && value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\'') {
				const range = property.getValueRange();
				for (let i = 0; i < variables.length; i++) {
					// if a variable is in a single quote, remove it from the list
					if (Util.isInsideRange(variables[i].getRange().start, range)) {
						variables.splice(i, 1);
						i--;
					}
				}
			}
		}
		return variables;
	}

	public getProperties(): Property[] {
		return super.getProperties();
	}
}
