/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';
import { Property } from '../property';
import { Argument } from '../argument';
import { Util } from '../../docker';

export abstract class PropertyInstruction extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
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
		let instructionNameEndOffset = this.document.offsetAt(range.end);
		let extra = instructionNameEndOffset - this.document.offsetAt(range.start);
		let content = this.getTextContent();
		let fullArgs = content.substring(extra);
		let start = Util.findLeadingNonWhitespace(fullArgs, this.escapeChar);

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
											Range.create(this.document.positionAt(instructionNameEndOffset + start + argStart), this.document.positionAt(instructionNameEndOffset + start + i + 1))
										));
										// loop and process the encountered non-whitespace character
										i = j - 1;
										argStart = j;
										continue argumentLoop;
								}
							}
							// went to EOF without encountering EOL
							args.push(new Argument(content.substring(argStart, i),
								Range.create(this.document.positionAt(instructionNameEndOffset + start + argStart), this.document.positionAt(instructionNameEndOffset + start + i))
							));
							argStart = content.length;
							break argumentLoop;
						case '\r':
							if (content.charAt(i + 2) === '\n') {
								i++;
							}
						case '\n':
							// immediately followed by a newline, skip the newline
							i = i + 1;
							continue argumentLoop;
						case this.escapeChar:
							// double escape found, skip it and move on
							if (argStart === -1) {
								argStart = i;
							}
							i = i + 1;
							continue argumentLoop;
						default:
							if (argStart === -1) {
								argStart = i;
							}
							// non-whitespace encountered, skip the escape and process the
							// character normally
							continue argumentLoop;
					}
				case '\'':
				case '"':
					if (argStart === -1) {
						argStart = i;
					}
					for (let j = i + 1; j < content.length; j++) {
						if (content.charAt(j) === char) {
							args.push(new Argument(content.substring(argStart, j + 1),
								Range.create(this.document.positionAt(instructionNameEndOffset + start + argStart), this.document.positionAt(instructionNameEndOffset + start + j + 1))
							));
							i = j;
							argStart = -1;
							continue argumentLoop;
						}
					}
					break argumentLoop;
				case ' ':
				case '\t':
					args.push(new Argument(content.substring(argStart, i),
						Range.create(this.document.positionAt(instructionNameEndOffset + start + argStart), this.document.positionAt(instructionNameEndOffset + start + i))
					));
					argStart = -1;
					break;
				default:
					if (argStart === -1) {
						argStart = i;
					}
					break;
			}
		}
		if (argStart !== -1 && argStart !== content.length) {
			args.push(new Argument(content.substring(argStart, content.length),
				Range.create(this.document.positionAt(instructionNameEndOffset + start + argStart), this.document.positionAt(instructionNameEndOffset + start + content.length))
			));
		}
		return args;
	}
}
