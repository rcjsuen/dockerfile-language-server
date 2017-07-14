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
				} else if (next === '\r') {
					escapeMarker = i;
					if (fullArgs.charAt(i + 2) === '\n') {
						i++;
					}
					i++;
				} else if (next === '\n') {
					escapeMarker = i;
					i++;
				} else if (next === '$') {
					escapedArg = escapedArg + char + next;
					if (found === -1) {
						found = i;
					}
					i++;
				} else {
					escapedArg = escapedArg + next;
					if (found === -1) {
						found = i;
					}
					i++;
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
			let parsedVariables = this.parseVariables(this.document.offsetAt(arg.getRange().start), arg.getValue());
			for (let parsedVariable of parsedVariables) {
				variables.push(parsedVariable);
			}
		}
		return variables;
	}

	private parseVariables(offset: number, arg: string): Variable[] {
		let variables = [];
		variableLoop: for (let i = 0; i < arg.length; i++) {
			switch (arg.charAt(i)) {
				case this.escapeChar:
					if (arg.charAt(i + 1) === '$') {
						i++;
					}
					break;
				case '$':
					let start = i;
					if (arg.charAt(i + 1) === '{') {
						for (let j = i + 2; j < arg.length; j++) {
							if (arg.charAt(j) === '}') {
								let name = arg.substring(i + 2, j);
								let end = name.indexOf(':');
								if (end === -1) {
									end = j;
								} else {
									name = name.substring(0, end);
									end = i + 2 + end;
								}
								variables.push(new Variable(
									name, Range.create(this.document.positionAt(offset + i + 2), this.document.positionAt(offset + end)))
								);
								i = j;
								continue variableLoop;
							}
						}
						// no } found, not a valid variable, stop processing
						break variableLoop;
					} else {
						for (let j = i + 1; j < arg.length; j++) {
							if (arg.charAt(j) === '$') {
								variables.push(new Variable(
									arg.substring(i + 1, j),
									Range.create(this.document.positionAt(offset + i + 1), this.document.positionAt(offset + j)))
								);
								i = j - 1;
								continue variableLoop;
							}
						}
						variables.push(new Variable(
							arg.substring(i + 1, arg.length),
							Range.create(this.document.positionAt(offset + i + 1), this.document.positionAt(offset + arg.length))
						));
					}
					break variableLoop;
			}
		}
		return variables;
	}
}