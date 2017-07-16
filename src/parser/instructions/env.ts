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

	private properties: Property[] = undefined;

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getProperties(): Property[] {
		if (this.properties === undefined) {
			let args = this.getArguments();
			if (args.length === 0) {
				this.properties = [];
			} else if (args.length === 1) {
				this.properties = [ new Property(this.document, this.escapeChar, args[0]) ];
			} else if (args.length === 2) {
				if (args[0].getValue().indexOf('=') === -1) {
					this.properties = [ new Property(this.document, this.escapeChar, args[0], args[1]) ];
				} else {
					this.properties = [
						new Property(this.document, this.escapeChar, args[0]),
						new Property(this.document, this.escapeChar, args[1])
					];
				}
			} else if (args[0].getValue().indexOf('=') === -1) {
				let text = this.document.getText();
				let start = args[1].getRange().start
				let end = args[args.length - 1].getRange().end;
				text = text.substring(this.document.offsetAt(start), this.document.offsetAt(end));
				this.properties = [ new Property(this.document, this.escapeChar, args[0], new Argument(text, Range.create(args[1].getRange().start, args[args.length - 1].getRange().end))) ];
			} else {
				this.properties = [];
				for (let i = 0; i < args.length; i++) {
					this.properties.push(new Property(this.document, this.escapeChar, args[i]));
				}
			}
		}
		return this.properties;
	}
}
