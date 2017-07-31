/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';
import { Property } from '../property';
import { Argument } from '../argument';
import { PropertyInstruction } from './propertyInstruction';
import { Util } from '../../docker';

export class Label extends PropertyInstruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getProperties(): Property[] {
		return super.getProperties();
	}
}
