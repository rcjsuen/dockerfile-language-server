/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Property } from '../property';
import { PropertyInstruction } from './propertyInstruction';

export class Arg extends PropertyInstruction {

	private property: Property | undefined | null = undefined;

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getProperty(): Property | null {
		if (this.property === undefined) {
			let args = this.getArguments();
			if (args.length === 1) {
				this.property = new Property(this.document, this.escapeChar, args[0]);
			} else {
				this.property = null;
			}
		}
		return this.property;
	}
}
