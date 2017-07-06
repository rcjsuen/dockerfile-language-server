/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';

export class Onbuild extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getTrigger(): string {
		let range = this.getTriggerRange();
		if (range === null) {
			return null;
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	public getTriggerRange(): Range {
		let range = this.getRange();
		let text = this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
		let skip = this.document.offsetAt(range.start) + this.getInstruction().length;
		text = text.substring(skip);
		let start = -1;
		let end = -1;
		triggerCheck: for (let i = 0; i < text.length; i++) {
			switch (text.charAt(i)) {
				case ' ':
				case '\t':
					if (start !== -1) {
						end = i;
						break triggerCheck;
					}
					break;
				case this.escapeChar:
					let char = text.charAt(i + 1);
					if (char === '\r') {
						if (text.charAt(i + 2) === '\n') {
							i++;
						}
						i++;
					} else if (char === '\n') {
						i++;
					}
					break;
				case '\r':
				case '\n':
					if (start !== -1) {
						end = i;
						break triggerCheck;
					}
					break triggerCheck;
				default:
					if (start === -1) {
						start = i;
					}
					break;
			}
		}
		if (start === -1) {
			return null;
		} else if (end === -1) {
			// reached EOF
			end = text.length;
		}
		return Range.create(this.document.positionAt(skip + start), this.document.positionAt(skip + end));
	}
}