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

export class Env extends PropertyInstruction {

	private property: Property = undefined;

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getProperty(): Property {
		if (this.property === undefined) {
			let args = this.getArguments();
			if (args.length === 1) {
				this.property = new Property(this.document, this.escapeChar, args[0]);
			} else if (args.length === 2) {
				this.property = new Property(this.document, this.escapeChar, args[0], args[1]);
			} else {
				this.property = null;
			}
		}
		return this.property;
	}
}
