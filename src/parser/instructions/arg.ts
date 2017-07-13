/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';
import { Argument } from '../argument';
import { Util } from '../../docker';

export class Arg extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getName(): string | null {
		return this.getRangeContent(this.getNameRange());
	}

	public getNameRange(): Range | null{
		let args = this.getArguments();
		if (args.length != 1) {
			return null;
		}
		let arg = args[0].getValue();
		let index = arg.indexOf('=');
		if (index !== -1) {
			return Range.create(args[0].getRange().start, this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + index));
		}
		// no '=' found, just defined the ARG's name
		return args[0].getRange();
	}

	public getValue(): string | null {
		let value = this.getRangeContent(this.getValueRange());
		if (value === null) {
			return null;
		}

		let literal = false;
		let first = value.charAt(0);
		let last = value.charAt(value.length - 1);
		if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
			literal = true;
			value = value.substring(1, value.length - 1);
		}

		let escapedValue = "";
		parseValue: for (let i = 0; i < value.length; i++) {
			let char = value.charAt(i);
			if (char === this.escapeChar) {
				if (i + 1 === value.length) {
					break;
				}

				char = value.charAt(i + 1);
				if (literal) {
					if (char === '\n') {
						i++;
					} else {
						if (char === this.escapeChar) {
							i++;
						}	
						escapedValue = escapedValue + this.escapeChar;
					}
					continue parseValue;
				} else if (char === this.escapeChar) {
					// double escape, append one and move on
					escapedValue = escapedValue + this.escapeChar;
					i++;
				} else if (char === '\r') {
					if (value.charAt(i + 2) === '\n') {
						i++;
					}
					i++;
				} else if (char === '\n') {
					i++;
				} else if (char === ' ' || char === '\t') {
					for (let j = i + 2; j < value.length; j++) {
						let char2 = value.charAt(j);
						if (char2 === ' ' || char2 === '\t') {
							continue;
						} else if (char2 === '\r') {
							if (value.charAt(j + 1) === '\n') {
								i = j + 1;
							} else {
								i = j;
							}
							continue parseValue;
						} else if (char2 === '\n') {
							// the expectation is that this is === '\n'
							i = j;
							continue parseValue;
						} else {
							// the expectation is that this j = i + 2 here
							escapedValue = escapedValue + char + char2;
							i = j;
							continue parseValue;
						}
					}
				} else {
					// any other escapes are simply ignored
					escapedValue = escapedValue + char;
					i++;
				}
			} else {
				escapedValue = escapedValue + char;
			}
		}
		
		return escapedValue;
	}

	private getValueRange(): Range | null {
		let args = this.getArguments();
		if (args.length != 1) {
			return null;
		}
		let arg = args[0].getValue();
		let index = arg.indexOf('=');
		if (index !== -1) {
			let startIndex = this.findLeadingNonWhitespace(arg.substring(index + 1));
			let endIndex = this.findTrailingNonWhitespace(arg);
			return Range.create(
				this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + index + startIndex + 1),
				this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + endIndex + 1)
			);
		}
		return null;
	}

	private findLeadingNonWhitespace(content: string): number {
		whitespaceCheck: for (let i = 0; i < content.length; i++) {
			switch (content.charAt(i)) {
				case ' ':
				case '\t':
					continue;
				case this.escapeChar:
					for (let j = i + 1; j < content.length; j++) {
						switch (content.charAt(j)) {
							case ' ':
							case '\t':
								continue;
							case '\r':
								if (content.charAt(j + 1) === '\n') {
									i = j + 1;
									continue whitespaceCheck;
								}
							case '\n':
								i = j;
								continue whitespaceCheck;
							default:
								return i;
						}
					}
					return i;
				default:
					return i;
			}
		}
		return -1;
	}

	/**
	 * Goes from the back of the string and returns the first
	 * non-whitespace character that is found. If an escape character
	 * is found with newline characters, the escape character will
	 * not be considered a non-whitespace character and its index in
	 * the string will not be returned.
	 * 
	 * @param content the string to search through
	 * @return the index in the string for the first non-whitespace
	 *         character when searching from the end of the string
	 */
	private findTrailingNonWhitespace(content: string): number {
		// loop back to find the first non-whitespace character
		for (let i = content.length - 1; i >= 0; i--) {
			switch (content.charAt(i)) {
				case ' ':
				case '\t':
					continue;
				case '\n':
					if (content.charAt(i - 1) === '\r') {
						i = i - 1;
					}
				case '\r':
					for (let j = i - 1; j >= 0; j--) {
						switch (content.charAt(j)) {
							case ' ':
							case '\t':
							case this.escapeChar:
								continue;
							default:
								return j;
						}
					}
					break;
				default:
					return i;
			}
		}
		throw new Error("Could not find ending non-whitespace character:" + content);
	}

	public getArguments(): Argument[] {
		let args = [];
		let range = this.getInstructionRange();
		let endOffset = this.document.offsetAt(range.end);
		let extra = endOffset - this.document.offsetAt(range.start);
		let content = this.getTextContent();
		let fullArgs = content.substring(extra);
		let start = this.findLeadingNonWhitespace(fullArgs);

		if (start === -1) {
			// only whitespace found, no arguments
			return [];
		}

		let end = this.findTrailingNonWhitespace(fullArgs);
		content = fullArgs.substring(start, end + 1);
		let argStart = 0;
		argumentLoop: for (let i = 0; i < content.length; i++) {
			let char = content.charAt(i);
			switch (char) {
				case this.escapeChar:
					if (i + 1 === content.length) {
						break argumentLoop;
					}

					switch (content.charAt(i + 1)) {
						case ' ':
						case '\t':
							if (!Util.isWhitespace(content.charAt(i + 2))) {
								// space was escaped, continue as normal
								i = i + 2;
								continue argumentLoop;
							}
							// whitespace encountered, need to figure out if it extends to EOL
							for (let j = i + 2; j < content.length; j++) {
								switch (content.charAt(j)) {
									case '\r':
									case '\n':
										// whitespace only, safe to skip
										i = j;
										continue argumentLoop;
									case ' ':
									case '\t':
										// ignore whitespace
										break;
									default:
										// whitespace doesn't extend to EOL, create an argument
										args.push(new Argument(content.substring(argStart, i),
											Range.create(this.document.positionAt(endOffset + start + argStart), this.document.positionAt(endOffset + start + i + 1))
										));
										// loop and process the encountered non-whitespace character
										i = j - 1;
										argStart = j;
										continue argumentLoop;
								}
							}
							// went to EOF without encountering EOL
							args.push(new Argument(content.substring(argStart, i),
								Range.create(this.document.positionAt(endOffset + start + argStart), this.document.positionAt(endOffset + start + i))
							));
							argStart = content.length;
							break argumentLoop;
						case '\r':
							if (content.charAt(i + 2) === '\n') {
								i++;
							}
						case '\n':
							// immediately followed by a newline, skip the newline
						case this.escapeChar:
							// double escape found, skip it and move on
							i = i + 1;
							continue argumentLoop;
						default:
							// non-whitespace encountered, skip the escape and process the
							// character normally
							continue argumentLoop;
					}
				case '\'':
				case '"':
					for (let j = i + 1; j < content.length; j++) {
						if (content.charAt(j) === char) {
							args.push(new Argument(content.substring(argStart, j + 1),
								Range.create(this.document.positionAt(endOffset + start + argStart), this.document.positionAt(endOffset + start + j + 1))
							));
							i = j;
							argStart = i + 1;
							continue argumentLoop;
						}
					}
					break argumentLoop;
				case ' ':
				case '\t':
					args.push(new Argument(content.substring(argStart, i),
						Range.create(this.document.positionAt(endOffset + start + argStart), this.document.positionAt(endOffset + start + i))
					));
					argStart = i + 1;
					break;
			}
		}
		if (argStart !== content.length) {
			args.push(new Argument(content.substring(argStart, content.length),
				Range.create(this.document.positionAt(endOffset + start + argStart), this.document.positionAt(endOffset + start + argStart + content.length))
			));
		}
		return args;
	}
}
