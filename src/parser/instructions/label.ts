/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Dockerfile } from '../dockerfile';
import { Property } from '../property';
import { PropertyInstruction } from './propertyInstruction';

export class Label extends PropertyInstruction {

	constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, dockerfile, escapeChar, instruction, instructionRange);
	}

	public getProperties(): Property[] {
		return super.getProperties();
	}
}
