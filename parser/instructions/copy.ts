/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range, Position } from 'vscode-languageserver';
import { Instruction } from '../instruction';

export class Copy extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getFromValue(): string {
		let range = this.getFromValueRange();
		if (range === null) {
			return undefined;
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	public getFromValueRange(): Range {
		let range = this.getFromRange();
		return Range.create(Position.create(range.start.line, range.start.character + 7), range.end);
	}

	public getFrom(): string {
		let range = this.getFromRange();
		if (range === null) {
			return null;
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	public getFromRange(): Range {
		let args = this.getArguments();
		if (args.length > 1 && args[0].getValue().toLowerCase().indexOf("--from=") === 0) {
			return args[0].getRange();
		}
		return null;
	}
}
