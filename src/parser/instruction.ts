/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range, Position } from 'vscode-languageserver';
import { Util } from '../docker';
import { Line } from './line';
import { Argument } from './argument';
import { Variable } from './variable';

export class Instruction extends Line {

	protected readonly escapeChar: string;

	private readonly instruction: string;

	private readonly instructionRange: Range;

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range);
		this.escapeChar = escapeChar;
		this.instruction = instruction;
		this.instructionRange = instructionRange;
	}

	protected getRangeContent(range: Range) {
		if (range === null) {
			return null;
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	public getInstructionRange(): Range {
		return this.instructionRange;
	}

	public getInstruction(): string {
		return this.instruction;
	}

	public getKeyword(): string {
		return this.getInstruction().toUpperCase();
	}

	public getArguments(): Argument[] {
		let args = [];
		let range = this.getInstructionRange();
		let extra = this.document.offsetAt(range.end) - this.document.offsetAt(range.start);
		let content = this.getTextContent();
		let fullArgs = content.substring(extra);
		let offset = this.document.offsetAt(range.start) + extra;
		let found = -1;
		let escapeMarker = -1;
		let escapedArg = "";
		for (let i = 0; i < fullArgs.length; i++) {
			let char = fullArgs.charAt(i);
			if (Util.isWhitespace(char)) {
				if (found !== -1) {
					if (escapeMarker === -1) {
						args.push(new Argument(escapedArg, Range.create(this.document.positionAt(offset + found), this.document.positionAt(offset + i))));
					} else {
						args.push(new Argument(escapedArg, Range.create(this.document.positionAt(offset + found), this.document.positionAt(offset + escapeMarker))));
					}
					escapedArg = "";
					found = -1;
				}
			} else if (char === this.escapeChar) {
				let next = fullArgs.charAt(i + 1);
				if (next === ' ' || next === '\t') {
					whitespaceCheck: for (let j = i + 2; j < fullArgs.length; j++) {
						let newlineCheck = fullArgs.charAt(j);
						switch (newlineCheck) {
							case ' ':
							case '\t':
								continue;
							case '\r':
								escapeMarker = i;
								if (fullArgs.charAt(j + 1) === '\n') {
									i = j + 1;
								} else {
									i = j;
								}
								break whitespaceCheck;
							case '\n':
								escapeMarker = i;
								i = j;
								break whitespaceCheck;
							default:
								escapedArg = escapedArg + newlineCheck;
								if (found === -1) {
									found = i;
								}
								break whitespaceCheck;
						}
					}
				} else if (fullArgs.charAt(i + 1) === '\r') {
					escapeMarker = i;
					if (fullArgs.charAt(i + 2) === '\n') {
						i++;
					}
					i++;
				} else if (fullArgs.charAt(i + 1) === '\n') {
					escapeMarker = i;
					i++;
				} else {
					escapedArg = escapedArg + char;
					if (found === -1) {
						found = i;
					}
				}
			} else {
				escapeMarker = -1;
				escapedArg = escapedArg + char;
				if (found === -1) {
					found = i;
				}
			}
		}

		if (found !== -1) {
			args.push(new Argument(escapedArg, Range.create(this.document.positionAt(offset + found), this.document.positionAt(offset + fullArgs.length))));			
		}

		return args;
	}

	public getVariables(): Variable[] {
		let variables = [];
		let args = this.getArguments();
		for (let arg of args) {
			let value = arg.getValue();
			let range = arg.getRange();
			let matches = value.match(/\$([a-zA-Z_]+)/);
			if (matches && matches.length > 0) {
				let offset = this.document.offsetAt(range.start) + value.indexOf(matches[0]);
				variables.push(new Variable(matches[1],
					Range.create(this.document.positionAt(offset + 1), this.document.positionAt(offset + matches[0].length)),
					Range.create(this.document.positionAt(offset), this.document.positionAt(offset + matches[0].length))));
			}
			matches = value.match(/\${([a-zA-Z_]+)}/);
			if (matches && matches.length > 0) {
				let escaped = this.escapeChar + matches[0];
				if (value.indexOf(escaped) === -1) {
					let offset = this.document.offsetAt(range.start) + value.indexOf(matches[0]);
					variables.push(new Variable(matches[1],
						Range.create(this.document.positionAt(offset + 2), this.document.positionAt(offset + matches[0].length - 1)),
						Range.create(this.document.positionAt(offset), this.document.positionAt(offset + matches[0].length))));
				}
			}
		}
		return variables;
	}
}